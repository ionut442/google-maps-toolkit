import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  applyTemplate,
  createBusinessForUser,
  requireOwnedBusiness,
} from "@/lib/business";
import {
  addQuoteFormField,
  moveQuoteFormField,
  updateQuoteFormField,
  updateQuoteFormMeta,
} from "@/lib/quote-config-service";
import {
  findOwnedQuoteRequest,
  findOwnedQuoteUpload,
  listAllOwnedQuoteRequests,
  listOwnedQuoteRequests,
  retryOwnedQuoteEmail,
  submitPublicQuote,
} from "@/lib/quotes";
import type { EmailTransport, TransactionalEmail } from "@/lib/email";
import type { PrivateObjectStorage, StoredObjectMetadata } from "@/lib/storage";
import { consumeQuoteRateLimit } from "@/lib/rate-limit";
import { POST as submitRoute } from "@/app/api/quotes/[slug]/route";

const client = new PrismaClient();

class MemoryStorage implements PrivateObjectStorage {
  objects = new Map<string, Uint8Array>();
  async store(key: string, bytes: Uint8Array) {
    if (this.objects.has(key)) throw new Error("duplicate key");
    this.objects.set(key, bytes);
  }
  async read(key: string) {
    const value = this.objects.get(key);
    if (!value) throw new Error("not found");
    return value;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
  async metadata(key: string): Promise<StoredObjectMetadata> {
    const value = await this.read(key);
    return { sizeBytes: value.length, modifiedAt: new Date(0) };
  }
}

class CaptureTransport implements EmailTransport {
  messages: TransactionalEmail[] = [];
  async send(message: TransactionalEmail) {
    this.messages.push(message);
    return { messageId: `captured:${message.deliveryId}` };
  }
}

class FailingTransport implements EmailTransport {
  async send(): Promise<{ messageId: string }> {
    throw new Error("simulated provider outage");
  }
}

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);

function quoteForm(submissionKey = crypto.randomUUID(), withPhoto = true) {
  const form = new FormData();
  form.set("submissionKey", submissionKey);
  form.set("website", "");
  form.set("field:issue_type", "Leak");
  form.set("field:urgency", "Normal service");
  form.set("field:property_postcode", "010101");
  form.set("field:issue_description", "Water is leaking under the sink");
  form.set("field:customer_name", "Ana Popescu");
  form.set("field:customer_phone", "+40700111222");
  form.set("field:customer_email", "ana@example.com");
  if (withPhoto)
    form.append(
      "photos",
      new File([pngBytes], "sink.png", { type: "image/png" }),
    );
  return form;
}

async function businessFixture(email: string, name: string, published = true) {
  const user = await client.user.create({
    data: { email, passwordHash: "test-only" },
  });
  const business = await createBusinessForUser(user.id, name, email, client);
  await applyTemplate(business.id, "PLUMBING", client);
  await client.business.update({
    where: { id: business.id },
    data: {
      published,
      phone: "+40700111222",
      description: "Test plumbing business",
    },
  });
  return { user, business };
}

beforeEach(async () => {
  await client.session.deleteMany();
  await client.businessModule.deleteMany();
  await client.membership.deleteMany();
  await client.business.deleteMany();
  await client.user.deleteMany();
});
afterAll(() => client.$disconnect());

describe("Goal 3 quote system integration", () => {
  it("recalculates constrained pricing handoff and rejects tampering", async () => {
    const fixture = await businessFixture(
      "handoff@example.test",
      "Handoff Plumbing",
    );
    await client.businessModule.update({
      where: {
        businessId_type: { businessId: fixture.business.id, type: "PRICING" },
      },
      data: {
        config: JSON.stringify({
          mode: "SIMPLE_ESTIMATE",
          label: "Estimate",
          currency: "RON",
          base: { label: "Base", amountMinor: 10000 },
          addOns: [{ id: "urgent", label: "Urgent", amountMinor: 5000 }],
          quantity: {
            id: "units",
            label: "Units",
            unitLabel: "unit",
            unitAmountMinor: 2000,
            min: 0,
            max: 5,
            step: 1,
          },
        }),
      },
    });
    const form = quoteForm(crypto.randomUUID(), false);
    form.append("pricingAddOn", "urgent");
    form.set("pricingQuantity", "3");
    await expect(
      submitPublicQuote({
        slug: fixture.business.slug,
        formData: form,
        clientIdentifier: "handoff-ok",
        client,
        storage: new MemoryStorage(),
        transport: new CaptureTransport(),
      }),
    ).resolves.toEqual({ ok: true, accepted: true });
    const saved = await client.quoteRequest.findFirst({
      where: { businessId: fixture.business.id },
      select: { answers: true },
    });
    expect(saved?.answers).toContain("RON");
    expect(saved?.answers).toContain("210");
    expect(saved?.answers).toContain("Urgent");
    const tampered = quoteForm(crypto.randomUUID(), false);
    tampered.append("pricingAddOn", "unknown");
    tampered.set("pricingQuantity", "3");
    const rejected = await submitPublicQuote({
      slug: fixture.business.slug,
      formData: tampered,
      clientIdentifier: "handoff-bad",
      client,
      storage: new MemoryStorage(),
      transport: new CaptureTransport(),
    });
    expect(rejected).toMatchObject({ ok: false, status: 422 });
  });
  it("authorizes and persists constrained owner quote configuration", async () => {
    const owner = await businessFixture(
      "config-owner@example.test",
      "Config Plumbing",
    );
    const stranger = await businessFixture(
      "config-stranger@example.test",
      "Stranger Plumbing",
    );
    await expect(
      updateQuoteFormMeta(
        stranger.user.id,
        owner.business.id,
        {
          label: "Stolen",
          intro: "No",
        },
        client,
      ),
    ).rejects.toThrow("access denied");

    await updateQuoteFormMeta(
      owner.user.id,
      owner.business.id,
      {
        label: "Request plumbing help",
        intro: "Tell us what happened.",
      },
      client,
    );
    await addQuoteFormField(
      owner.user.id,
      owner.business.id,
      "CHECKBOX",
      client,
    );
    const afterAdd = await requireOwnedBusiness(
      owner.user.id,
      owner.business.id,
      client,
    );
    const quoteModule = afterAdd.modules.find(
      (item) => item.type === "QUOTE_REQUEST",
    )!;
    const config = JSON.parse(quoteModule.config) as {
      fields: Array<{ type: string }>;
    };
    const addedIndex = config.fields.length - 1;
    await updateQuoteFormField(
      owner.user.id,
      owner.business.id,
      addedIndex,
      {
        label: "Access confirmed",
        helperText: "",
        required: false,
      },
      client,
    );
    await moveQuoteFormField(
      owner.user.id,
      owner.business.id,
      addedIndex,
      "up",
      client,
    );
    const saved = await requireOwnedBusiness(
      owner.user.id,
      owner.business.id,
      client,
    );
    const savedConfig = JSON.parse(
      saved.modules.find((item) => item.type === "QUOTE_REQUEST")!.config,
    ) as { label: string; intro: string; fields: Array<{ label: string }> };
    expect(savedConfig).toMatchObject({
      label: "Request plumbing help",
      intro: "Tell us what happened.",
    });
    expect(savedConfig.fields.at(-2)?.label).toBe("Access confirmed");
  });

  it("persists answers/upload/email atomically and deduplicates replay", async () => {
    const { business } = await businessFixture(
      "submit-owner@example.test",
      "Submit Plumbing",
    );
    const storage = new MemoryStorage();
    const transport = new CaptureTransport();
    const key = crypto.randomUUID();
    const result = await submitPublicQuote({
      slug: business.slug,
      formData: quoteForm(key),
      clientIdentifier: "198.51.100.10",
      client,
      storage,
      transport,
    });
    expect(result).toEqual({ ok: true, accepted: true });
    const quote = await client.quoteRequest.findFirst({
      where: { businessId: business.id },
      include: { uploads: true, emailDelivery: true },
    });
    expect(quote).toMatchObject({
      customerName: "Ana Popescu",
      customerEmail: "ana@example.com",
    });
    expect(JSON.parse(quote!.answers)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldId: "issue_type",
          label: "What plumbing issue do you have?",
          value: "Leak",
        }),
      ]),
    );
    expect(quote!.uploads).toHaveLength(1);
    expect(storage.objects.size).toBe(1);
    expect(quote!.emailDelivery).toMatchObject({
      status: "DELIVERED",
      attemptCount: 1,
      destination: "submit-owner@example.test",
    });
    expect(transport.messages[0].text).toContain(
      "Water is leaking under the sink",
    );

    await expect(
      submitPublicQuote({
        slug: business.slug,
        formData: quoteForm(key),
        clientIdentifier: "198.51.100.10",
        client,
        storage,
        transport,
      }),
    ).resolves.toEqual({ ok: true, accepted: true });
    expect(await client.quoteRequest.count()).toBe(1);
    expect(transport.messages).toHaveLength(1);
  });

  it("keeps lead/uploads when email fails and retries without duplicate quote", async () => {
    const fixture = await businessFixture(
      "failure-owner@example.test",
      "Failure Plumbing",
    );
    const storage = new MemoryStorage();
    await expect(
      submitPublicQuote({
        slug: fixture.business.slug,
        formData: quoteForm(),
        clientIdentifier: "198.51.100.11",
        client,
        storage,
        transport: new FailingTransport(),
      }),
    ).resolves.toEqual({ ok: true, accepted: true });
    const quote = await client.quoteRequest.findFirst({
      include: { emailDelivery: true, uploads: true },
    });
    expect(quote!.uploads).toHaveLength(1);
    expect(quote!.emailDelivery).toMatchObject({
      status: "FAILED",
      attemptCount: 1,
      lastError: "simulated provider outage",
    });
    const capture = new CaptureTransport();
    await retryOwnedQuoteEmail(fixture.user.id, quote!.id, {
      client,
      transport: capture,
      now: new Date(Date.now() + 120_000),
    });
    expect(await client.quoteRequest.count()).toBe(1);
    expect(
      await client.emailDelivery.findUnique({
        where: { quoteRequestId: quote!.id },
      }),
    ).toMatchObject({ status: "DELIVERED", attemptCount: 2 });
  });

  it("rejects unpublished, disabled, and malformed Quote configurations", async () => {
    const fixture = await businessFixture(
      "unavailable-owner@example.test",
      "Unavailable Plumbing",
      false,
    );
    const submit = () =>
      submitPublicQuote({
        slug: fixture.business.slug,
        formData: quoteForm(),
        clientIdentifier: crypto.randomUUID(),
        client,
        storage: new MemoryStorage(),
        transport: new CaptureTransport(),
      });
    await expect(submit()).resolves.toMatchObject({ ok: false, status: 404 });
    await client.business.update({
      where: { id: fixture.business.id },
      data: { published: true },
    });
    const quoteModule = await client.businessModule.findFirst({
      where: { businessId: fixture.business.id, type: "QUOTE_REQUEST" },
    });
    await client.businessModule.update({
      where: { id: quoteModule!.id },
      data: { enabled: false },
    });
    await expect(submit()).resolves.toMatchObject({ ok: false, status: 404 });
    await client.businessModule.update({
      where: { id: quoteModule!.id },
      data: { enabled: true, config: "{bad" },
    });
    await expect(submit()).resolves.toMatchObject({ ok: false, status: 404 });
    expect(await client.quoteRequest.count()).toBe(0);
  });

  it("rejects invalid uploads without object or database orphans", async () => {
    const { business } = await businessFixture(
      "upload-owner@example.test",
      "Upload Plumbing",
    );
    const storage = new MemoryStorage();
    const form = quoteForm(crypto.randomUUID(), false);
    form.append(
      "photos",
      new File(["not an image"], "attack.jpg", { type: "image/jpeg" }),
    );
    await expect(
      submitPublicQuote({
        slug: business.slug,
        formData: form,
        clientIdentifier: "198.51.100.12",
        client,
        storage,
        transport: new CaptureTransport(),
      }),
    ).resolves.toMatchObject({ ok: false, status: 422 });
    expect(storage.objects.size).toBe(0);
    expect(await client.quoteRequest.count()).toBe(0);
    expect(await client.quoteUpload.count()).toBe(0);
  });

  it("cleans stored objects when quote persistence fails", async () => {
    const { business } = await businessFixture(
      "atomic-owner@example.test",
      "Atomic Plumbing",
    );
    const storage = new MemoryStorage();
    const failingClient = new Proxy(client, {
      get(target, property, receiver) {
        if (property === "$transaction")
          return vi.fn().mockRejectedValue(new Error("simulated DB failure"));
        return Reflect.get(target, property, receiver);
      },
    }) as PrismaClient;
    await expect(
      submitPublicQuote({
        slug: business.slug,
        formData: quoteForm(),
        clientIdentifier: "198.51.100.13",
        client: failingClient,
        storage,
        transport: new CaptureTransport(),
      }),
    ).resolves.toMatchObject({ ok: false, status: 500 });
    expect(storage.objects.size).toBe(0);
    expect(await client.quoteRequest.count()).toBe(0);
  });

  it("enforces rate thresholds, client/business separation, and reset", async () => {
    const first = await businessFixture("rate-a@example.test", "Rate A");
    const second = await businessFixture("rate-b@example.test", "Rate B");
    const now = new Date("2026-08-26T12:00:00Z");
    await expect(
      consumeQuoteRateLimit(first.business.id, "client-a", {
        client,
        now,
        limit: 2,
        windowMs: 1_000,
      }),
    ).resolves.toMatchObject({ allowed: true, remaining: 1 });
    await consumeQuoteRateLimit(first.business.id, "client-a", {
      client,
      now,
      limit: 2,
      windowMs: 1_000,
    });
    await expect(
      consumeQuoteRateLimit(first.business.id, "client-a", {
        client,
        now,
        limit: 2,
        windowMs: 1_000,
      }),
    ).resolves.toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    await expect(
      consumeQuoteRateLimit(first.business.id, "client-b", {
        client,
        now,
        limit: 2,
        windowMs: 1_000,
      }),
    ).resolves.toMatchObject({ allowed: true });
    await expect(
      consumeQuoteRateLimit(second.business.id, "client-a", {
        client,
        now,
        limit: 2,
        windowMs: 1_000,
      }),
    ).resolves.toMatchObject({ allowed: true });
    await expect(
      consumeQuoteRateLimit(first.business.id, "client-a", {
        client,
        now: new Date(now.getTime() + 1_001),
        limit: 2,
        windowMs: 1_000,
      }),
    ).resolves.toMatchObject({ allowed: true, remaining: 1 });

    const concurrent = await Promise.all(
      Array.from({ length: 10 }, () =>
        consumeQuoteRateLimit(first.business.id, "client-concurrent", {
          client,
          now,
          limit: 5,
          windowMs: 1_000,
        }),
      ),
    );
    expect(concurrent.filter((result) => result.allowed)).toHaveLength(5);
  });

  it("protects Quote history/uploads across businesses", async () => {
    const ownerA = await businessFixture("history-a@example.test", "History A");
    const ownerB = await businessFixture("history-b@example.test", "History B");
    const storage = new MemoryStorage();
    await submitPublicQuote({
      slug: ownerA.business.slug,
      formData: quoteForm(),
      clientIdentifier: "198.51.100.14",
      client,
      storage,
      transport: new CaptureTransport(),
    });
    const quote = await client.quoteRequest.findFirst({
      include: { uploads: true },
    });
    await expect(
      listOwnedQuoteRequests(ownerA.user.id, ownerA.business.id, client),
    ).resolves.toHaveLength(1);
    await expect(
      listAllOwnedQuoteRequests(ownerA.user.id, client),
    ).resolves.toMatchObject([{ business: { name: "History A" } }]);
    await expect(
      listAllOwnedQuoteRequests(ownerB.user.id, client),
    ).resolves.toEqual([]);
    await expect(
      findOwnedQuoteRequest(ownerB.user.id, quote!.id, client),
    ).resolves.toBeNull();
    await expect(
      findOwnedQuoteUpload(
        ownerB.user.id,
        quote!.id,
        quote!.uploads[0].id,
        client,
      ),
    ).resolves.toBeNull();
    await expect(
      findOwnedQuoteUpload(
        ownerA.user.id,
        quote!.id,
        quote!.uploads[0].id,
        client,
      ),
    ).resolves.toMatchObject({ objectKey: quote!.uploads[0].objectKey });
  }, 30_000);

  it("uses honeypot and strict route request protections", async () => {
    const { business } = await businessFixture(
      "route-owner@example.test",
      "Route Plumbing",
    );
    const bot = quoteForm();
    bot.set("website", "https://spam.example");
    await expect(
      submitPublicQuote({
        slug: business.slug,
        formData: bot,
        clientIdentifier: "bot",
        client,
        storage: new MemoryStorage(),
        transport: new CaptureTransport(),
      }),
    ).resolves.toEqual({ ok: true, accepted: false });
    expect(await client.quoteRequest.count()).toBe(0);

    const denied = await submitRoute(
      new Request(`http://localhost:3000/api/quotes/${business.slug}`, {
        method: "POST",
        headers: {
          Origin: "https://evil.example",
          "Content-Type": "multipart/form-data; boundary=test",
          "Content-Length": "100",
        },
        body: "--test--",
      }),
      { params: Promise.resolve({ slug: business.slug }) },
    );
    expect(denied.status).toBe(403);
    const oversized = await submitRoute(
      new Request(`http://localhost:3000/api/quotes/${business.slug}`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "multipart/form-data; boundary=test",
          "Content-Length": String(17 * 1024 * 1024),
        },
        body: "--test--",
      }),
      { params: Promise.resolve({ slug: business.slug }) },
    );
    expect(oversized.status).toBe(413);

    const forgedBody = new FormData();
    forgedBody.set("submissionKey", crypto.randomUUID());
    forgedBody.set("website", "");
    forgedBody.set("field:issue_description", "x".repeat(17 * 1024 * 1024));
    const forgedLength = await submitRoute(
      new Request(`http://localhost:3000/api/quotes/${business.slug}`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Length": "100",
        },
        body: forgedBody,
      }),
      { params: Promise.resolve({ slug: business.slug }) },
    );
    expect(forgedLength.status).toBe(413);
  });
});
