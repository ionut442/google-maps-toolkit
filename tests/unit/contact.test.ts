import { describe, expect, it, vi } from "vitest";
import {
  buildContactEmail,
  consumeContactRateLimit,
  handleContactRequest,
  SUPPORT_EMAIL,
} from "@/lib/contact";

const valid = {
  name: "Alex Morgan",
  email: "alex@example.com",
  businessName: "Morgan Services",
  topic: "Setting up my page" as const,
  message: "Please help me configure my public page.",
  website: "",
};

function request(body: unknown) {
  return new Request("https://local-action.com/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://local-action.com",
    },
    body: JSON.stringify(body),
  });
}

describe("public contact form", () => {
  it("validates required fields and length limits", async () => {
    const response = await handleContactRequest(
      request({ ...valid, message: "short" }),
      { identifyClient: () => "client", transport: { send: vi.fn() } },
    );
    expect(response.status).toBe(422);
  });

  it("accepts honeypot submissions without sending email", async () => {
    const send = vi.fn();
    const response = await handleContactRequest(
      request({ ...valid, website: "https://spam.example" }),
      {
        identifyClient: () => {
          throw new Error("should not identify");
        },
        transport: { send },
      },
    );
    expect(response.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("rate limits repeated clients", () => {
    const identifier = `contact-test-${crypto.randomUUID()}`;
    for (let index = 0; index < 5; index++)
      expect(consumeContactRateLimit(identifier, 1_000).allowed).toBe(true);
    expect(consumeContactRateLimit(identifier, 1_000)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 900,
    });
  });

  it("sends to support with visitor email as Reply-To", async () => {
    const send = vi.fn().mockResolvedValue({ messageId: "sent-1" });
    const response = await handleContactRequest(request(valid), {
      identifyClient: () => crypto.randomUUID(),
      rateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
      transport: { send },
    });
    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toMatchObject({
      destination: SUPPORT_EMAIL,
      replyTo: "alex@example.com",
      subject: "LocalAction contact — Setting up my page",
    });
  });

  it("accepts the canonical origin behind a loopback reverse proxy", async () => {
    const send = vi.fn().mockResolvedValue({ messageId: "sent-2" });
    const proxiedRequest = new Request("http://127.0.0.1:3040/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://local-action.com",
      },
      body: JSON.stringify(valid),
    });
    const response = await handleContactRequest(proxiedRequest, {
      identifyClient: () => crypto.randomUUID(),
      expectedOrigin: "https://local-action.com",
      rateLimit: () => ({ allowed: true, retryAfterSeconds: 0 }),
      transport: { send },
    });
    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
  });

  it("builds injection-safe headers", () => {
    const email = buildContactEmail({
      ...valid,
      name: "Alex\r\nBcc: attacker@example.com",
      businessName: "Morgan\nServices",
    });
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.replyTo).toBe("alex@example.com");
    expect(email.destination).toBe(SUPPORT_EMAIL);
  });
});
