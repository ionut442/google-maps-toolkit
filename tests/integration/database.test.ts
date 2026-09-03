import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  applyTemplate,
  createBusinessForUser,
  findOwnedBusiness,
  requireOwnedBusiness,
} from "@/lib/business";
import { canPublishBusiness, resolvePrimaryAction } from "@/lib/domain";
import {
  addFaqItem,
  deleteFaqItem,
  moveFaqItem,
  updateFaqItem,
} from "@/lib/faq";
import { findPublicBusinessBySlug } from "@/lib/public-business";
import { GET as getContactCard } from "@/app/[slug]/contact.vcf/route";
import {
  findOwnedTrustEvidence,
  listOwnedTrustEvidence,
  uploadTrustEvidence,
} from "@/lib/trust-evidence";
import {
  saveOwnedModuleConfig,
  saveOwnedTrustConfig,
} from "@/lib/module-config-service";
import type { PrivateObjectStorage, StoredObjectMetadata } from "@/lib/storage";

class EvidenceStorage implements PrivateObjectStorage {
  objects = new Map<string, Uint8Array>();
  async store(key: string, bytes: Uint8Array) {
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
    return {
      sizeBytes: (await this.read(key)).length,
      modifiedAt: new Date(0),
    };
  }
}
const evidencePng = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
]);

const client = new PrismaClient();
beforeEach(async () => {
  await client.session.deleteMany();
  await client.businessModule.deleteMany();
  await client.membership.deleteMany();
  await client.business.deleteMany();
  await client.user.deleteMany();
});
afterAll(() => client.$disconnect());

describe("database ownership and toolkit integration", () => {
  it("protects, replaces, and cleans private credential evidence", async () => {
    const owner = await client.user.create({
      data: { email: "credential-owner@example.test", passwordHash: "x" },
    });
    const stranger = await client.user.create({
      data: { email: "credential-stranger@example.test", passwordHash: "x" },
    });
    const created = await createBusinessForUser(
      owner.id,
      "Credential Co",
      owner.email,
      client,
    );
    await applyTemplate(created.id, "PLUMBING", client);
    const business = await requireOwnedBusiness(owner.id, created.id, client);
    const trust = business.modules.find((item) => item.type === "TRUST")!;
    const config = JSON.parse(trust.config) as {
      label: string;
      entries: Array<{ id: string; name: string }>;
    };
    const entry = config.entries[0];
    const storage = new EvidenceStorage();
    await expect(
      uploadTrustEvidence(
        stranger.id,
        business.id,
        entry.id,
        new File([evidencePng], "proof.png", { type: "image/png" }),
        storage,
      ),
    ).rejects.toThrow("access denied");
    await uploadTrustEvidence(
      owner.id,
      business.id,
      entry.id,
      new File([evidencePng], "proof.png", { type: "image/png" }),
      storage,
    );
    const evidence = await listOwnedTrustEvidence(owner.id, business.id);
    expect(evidence).toHaveLength(1);
    expect(storage.objects.size).toBe(1);
    await expect(
      findOwnedTrustEvidence(owner.id, evidence[0].id),
    ).resolves.toMatchObject({ id: evidence[0].id, mediaType: "image/png" });
    await expect(
      findOwnedTrustEvidence(stranger.id, evidence[0].id),
    ).resolves.toBeNull();
    await expect(
      uploadTrustEvidence(
        owner.id,
        business.id,
        entry.id,
        new File([new Uint8Array([1, 2, 3])], "fake.pdf", {
          type: "application/pdf",
        }),
        storage,
      ),
    ).rejects.toThrow("valid PDF");
    await expect(
      uploadTrustEvidence(
        owner.id,
        business.id,
        entry.id,
        new File([evidencePng], "wrong.pdf", { type: "application/pdf" }),
        storage,
      ),
    ).rejects.toThrow("does not match");
    await expect(
      uploadTrustEvidence(
        owner.id,
        business.id,
        entry.id,
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
        storage,
      ),
    ).rejects.toThrow("5 MB");
    await uploadTrustEvidence(
      owner.id,
      business.id,
      entry.id,
      new File([evidencePng], "replacement.png", { type: "image/png" }),
      storage,
    );
    expect(storage.objects.size).toBe(1);
    await saveOwnedTrustConfig(
      owner.id,
      business.id,
      { ...config, entries: config.entries.slice(1) },
      storage,
    );
    expect(await listOwnedTrustEvidence(owner.id, business.id)).toHaveLength(0);
    expect(storage.objects.size).toBe(0);
  });
  it("authorizes and persists Pricing and Service Area configuration", async () => {
    const owner = await client.user.create({
      data: { email: "config-owner@example.test", passwordHash: "x" },
    });
    const stranger = await client.user.create({
      data: { email: "config-stranger@example.test", passwordHash: "x" },
    });
    const created = await createBusinessForUser(
      owner.id,
      "Config Co",
      owner.email,
      client,
    );
    await applyTemplate(created.id, "HVAC", client);
    const pricing = {
      mode: "PRICE_LIST" as const,
      label: "Owner prices",
      currency: "RON" as const,
      categories: [
        {
          id: "category_hvac",
          name: "HVAC services",
          items: [
            {
              id: "inspection",
              name: "Inspection",
              amountMinor: 20000,
              pricePrefix: "FIXED" as const,
            },
          ],
        },
      ],
    };
    await saveOwnedModuleConfig(owner.id, created.id, "PRICING", pricing);
    await expect(
      saveOwnedModuleConfig(stranger.id, created.id, "PRICING", pricing),
    ).rejects.toThrow("access denied");
    const area = {
      label: "Coverage",
      areas: [
        {
          id: "area_city",
          name: "Cluj-Napoca, Cluj, Romania",
          latitude: 46.77,
          longitude: 23.59,
          countryCode: "RO",
          source: "PHOTON" as const,
          sourceId: "12345",
        },
      ],
      postalCodes: [
        { id: "postcode_one", display: "400 001", normalized: "400001" },
      ],
    };
    await saveOwnedModuleConfig(owner.id, created.id, "SERVICE_AREA", area);
    await expect(
      saveOwnedModuleConfig(stranger.id, created.id, "SERVICE_AREA", area),
    ).rejects.toThrow("access denied");
    const loaded = await requireOwnedBusiness(owner.id, created.id, client);
    expect(
      JSON.parse(
        loaded.modules.find((item) => item.type === "PRICING")!.config,
      ),
    ).toEqual(pricing);
    expect(
      JSON.parse(
        loaded.modules.find((item) => item.type === "SERVICE_AREA")!.config,
      ),
    ).toEqual(area);
  });
  it("creates a business, applies template, and enforces ownership", async () => {
    const owner = await client.user.create({
      data: { email: "owner@example.test", passwordHash: "test-only" },
    });
    const stranger = await client.user.create({
      data: { email: "stranger@example.test", passwordHash: "test-only" },
    });
    const business = await createBusinessForUser(
      owner.id,
      "ABC Plumbing",
      owner.email,
      client,
    );
    await applyTemplate(business.id, "PLUMBING", client);
    const owned = await requireOwnedBusiness(owner.id, business.id, client);
    expect(owned.modules).toHaveLength(8);
    expect(owned.primaryAction).toBe("QUOTE_REQUEST");
    await expect(
      findOwnedBusiness(stranger.id, business.id, client),
    ).resolves.toBeNull();
    await expect(
      requireOwnedBusiness(stranger.id, business.id, client),
    ).rejects.toThrow("access denied");
  });
  it("enforces unique account emails, slugs, memberships, and module types per business", async () => {
    const user = await client.user.create({
      data: { email: "unique@example.test", passwordHash: "x" },
    });
    const first = await createBusinessForUser(
      user.id,
      "Same Name",
      user.email,
      client,
    );
    const second = await createBusinessForUser(
      user.id,
      "Same Name",
      user.email,
      client,
    );
    expect(first.slug).toBe("same-name");
    expect(second.slug).toBe("same-name-2");
    await expect(
      client.user.create({ data: { email: user.email, passwordHash: "x" } }),
    ).rejects.toThrow();
  });
  it("persists module state, ordering, primary-action resolution, and publish state", async () => {
    const user = await client.user.create({
      data: { email: "tools@example.test", passwordHash: "test-only" },
    });
    const created = await createBusinessForUser(
      user.id,
      "Tool Test Plumbing",
      user.email,
      client,
    );
    await client.$transaction((tx) =>
      applyTemplate(created.id, "PLUMBING", tx),
    );
    const business = await requireOwnedBusiness(user.id, created.id, client);
    const quote = business.modules.find(
      (module) => module.type === "QUOTE_REQUEST",
    )!;
    const modulesAfterDisable = business.modules.map((module) =>
      module.id === quote.id ? { ...module, enabled: false } : module,
    );
    const nextPrimary = resolvePrimaryAction(
      business.primaryAction,
      modulesAfterDisable,
    );
    await client.$transaction([
      client.businessModule.update({
        where: { id: quote.id },
        data: { enabled: false },
      }),
      client.business.update({
        where: { id: business.id },
        data: {
          primaryAction: nextPrimary,
          phone: "+40700111222",
          description: "A complete local plumbing profile.",
        },
      }),
    ]);

    const beforeMove = await requireOwnedBusiness(user.id, created.id, client);
    const last = beforeMove.modules.at(-1)!;
    const previous = beforeMove.modules.at(-2)!;
    await client.$transaction([
      client.businessModule.update({
        where: { id: last.id },
        data: { sortOrder: previous.sortOrder },
      }),
      client.businessModule.update({
        where: { id: previous.id },
        data: { sortOrder: last.sortOrder },
      }),
    ]);

    const publishable = await requireOwnedBusiness(user.id, created.id, client);
    expect(publishable.primaryAction).toBe("CALL");
    expect(
      publishable.modules.find((module) => module.id === quote.id)?.enabled,
    ).toBe(false);
    expect(publishable.modules.at(-2)?.id).toBe(last.id);
    expect(canPublishBusiness(publishable, publishable.modules)).toBe(true);
    await client.business.update({
      where: { id: created.id },
      data: { published: true },
    });
    expect(
      (await client.business.findUnique({ where: { id: created.id } }))
        ?.published,
    ).toBe(true);
    await client.business.update({
      where: { id: created.id },
      data: { published: false },
    });
    expect(
      (await client.business.findUnique({ where: { id: created.id } }))
        ?.published,
    ).toBe(false);
  });

  it("returns a deliberate, ordered public DTO and filters disabled or malformed modules", async () => {
    const owner = await client.user.create({
      data: { email: "public-owner@example.test", passwordHash: "x" },
    });
    const created = await createBusinessForUser(
      owner.id,
      "Public Plumbing",
      owner.email,
      client,
    );
    await applyTemplate(created.id, "PLUMBING", client);
    const owned = await requireOwnedBusiness(owner.id, created.id, client);
    const pricing = owned.modules.find((item) => item.type === "PRICING")!;
    const review = owned.modules.find((item) => item.type === "REVIEW")!;
    const serviceArea = owned.modules.find(
      (item) => item.type === "SERVICE_AREA",
    )!;
    const trust = owned.modules.find((item) => item.type === "TRUST")!;
    const trustEntryId = (
      JSON.parse(trust.config) as { entries: Array<{ id: string }> }
    ).entries[0].id;
    await client.trustEvidence.create({
      data: {
        id: crypto.randomUUID(),
        businessId: created.id,
        entryId: trustEntryId,
        objectKey: `trust/${created.id}/private-proof.pdf`,
        originalFilename: "private-proof.pdf",
        mediaType: "application/pdf",
        sizeBytes: 12,
      },
    });
    await client.$transaction([
      client.business.update({
        where: { id: created.id },
        data: {
          published: true,
          phone: "+40700111222",
          whatsapp: "+40700111222",
          description: "Safe public profile",
        },
      }),
      client.businessModule.update({
        where: { id: pricing.id },
        data: { enabled: false },
      }),
      client.businessModule.update({
        where: { id: review.id },
        data: { config: "{malformed" },
      }),
      client.businessModule.update({
        where: { id: serviceArea.id },
        data: {
          config: JSON.stringify({ label: "Broken", areas: "not-an-array" }),
        },
      }),
    ]);

    const publicBusiness = await findPublicBusinessBySlug(created.slug);
    expect(publicBusiness).not.toBeNull();
    expect(Object.keys(publicBusiness!).sort()).toEqual(
      [
        "brandColor",
        "customIndustryLabel",
        "description",
        "email",
        "googleReviewUrl",
        "industry",
        "logoUrl",
        "modules",
        "name",
        "phone",
        "primaryAction",
        "slug",
        "website",
        "whatsapp",
      ].sort(),
    );
    expect(publicBusiness!.modules.map((item) => item.type)).not.toContain(
      "PRICING",
    );
    expect(publicBusiness!.modules.map((item) => item.type)).not.toContain(
      "REVIEW",
    );
    expect(publicBusiness!.modules.map((item) => item.type)).not.toContain(
      "SERVICE_AREA",
    );
    expect(publicBusiness!.modules.map((item) => item.sortOrder)).toEqual(
      [...publicBusiness!.modules]
        .map((item) => item.sortOrder)
        .sort((a, b) => a - b),
    );
    expect(publicBusiness).not.toHaveProperty("id");
    expect(publicBusiness).not.toHaveProperty("published");
    expect(JSON.stringify(publicBusiness)).not.toContain("private-proof");
    expect(JSON.stringify(publicBusiness)).not.toContain("objectKey");

    await client.business.update({
      where: { id: created.id },
      data: { published: false },
    });
    await expect(findPublicBusinessBySlug(created.slug)).resolves.toBeNull();
  });

  it("authorizes and persists FAQ add, edit, reorder, and delete operations", async () => {
    const owner = await client.user.create({
      data: { email: "faq-owner@example.test", passwordHash: "x" },
    });
    const stranger = await client.user.create({
      data: { email: "faq-stranger@example.test", passwordHash: "x" },
    });
    const created = await createBusinessForUser(
      owner.id,
      "FAQ Plumbing",
      owner.email,
      client,
    );
    await applyTemplate(created.id, "PLUMBING", client);

    await expect(
      addFaqItem(
        stranger.id,
        created.id,
        { question: "Private?", answer: "No." },
        client,
      ),
    ).rejects.toThrow("access denied");

    await addFaqItem(
      owner.id,
      created.id,
      { question: "New question?", answer: "A useful answer." },
      client,
    );
    await updateFaqItem(
      owner.id,
      created.id,
      0,
      { question: "Updated first?", answer: "Updated answer." },
      client,
    );
    await moveFaqItem(owner.id, created.id, 0, "down", client);
    await deleteFaqItem(owner.id, created.id, 1, client);

    const owned = await requireOwnedBusiness(owner.id, created.id, client);
    const faq = owned.modules.find((item) => item.type === "FAQ")!;
    const config = JSON.parse(faq.config) as {
      suggestedFaqs: Array<{ question: string; answer: string }>;
    };
    expect(config.suggestedFaqs.at(-1)).toEqual({
      question: "New question?",
      answer: "A useful answer.",
    });
    expect(
      config.suggestedFaqs.some((item) => item.question === "Updated first?"),
    ).toBe(false);
  });

  it("serves a vCard only for a published business", async () => {
    const owner = await client.user.create({
      data: { email: "card-owner@example.test", passwordHash: "x" },
    });
    const created = await createBusinessForUser(
      owner.id,
      "Card & Sons",
      owner.email,
      client,
    );
    await client.business.update({
      where: { id: created.id },
      data: { published: true, phone: "+40700111222" },
    });
    const response = await getContactCard(new Request("http://test"), {
      params: Promise.resolve({ slug: created.slug }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/vcard; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toContain(
      `${created.slug}.vcf`,
    );
    expect(await response.text()).toContain("FN:Card & Sons");

    await client.business.update({
      where: { id: created.id },
      data: { published: false },
    });
    const hidden = await getContactCard(new Request("http://test"), {
      params: Promise.resolve({ slug: created.slug }),
    });
    expect(hidden.status).toBe(404);
  });
});
