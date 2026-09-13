import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  configuredEmailTransport,
  type EmailTransport,
  type TransactionalEmail,
} from "./email";
import { logServerEvent } from "./server-log";
import { contactTopics } from "./contact-options";

export const SUPPORT_EMAIL = "support@local-action.com";
export { contactTopics } from "./contact-options";

export const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    businessName: z.string().trim().max(120).optional().default(""),
    topic: z.enum(contactTopics),
    message: z.string().trim().min(10).max(4000),
    website: z.string().max(200).optional().default(""),
  })
  .strict();

export type ContactSubmission = z.infer<typeof contactSchema>;

const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; startedAt: number }>();

function contactKey(identifier: string) {
  const salt =
    process.env.QUOTE_RATE_LIMIT_SALT ??
    (process.env.NODE_ENV === "production"
      ? null
      : "local-development-rate-limit");
  if (!salt) throw new Error("Rate-limit salt is not configured");
  return createHash("sha256")
    .update(`${salt}:contact:${identifier || "unknown"}`)
    .digest("hex");
}

export function consumeContactRateLimit(identifier: string, now = Date.now()) {
  const key = contactKey(identifier);
  const current = attempts.get(key);
  if (!current || now - current.startedAt >= CONTACT_WINDOW_MS) {
    attempts.set(key, { count: 1, startedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= CONTACT_LIMIT)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.startedAt + CONTACT_WINDOW_MS - now) / 1000),
      ),
    };
  current.count += 1;
  if (attempts.size > 10_000)
    for (const [storedKey, value] of attempts)
      if (now - value.startedAt >= CONTACT_WINDOW_MS)
        attempts.delete(storedKey);
  return { allowed: true, retryAfterSeconds: 0 };
}

const singleLine = (value: string, max: number) =>
  value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);

export function buildContactEmail(
  submission: Omit<ContactSubmission, "website">,
): TransactionalEmail {
  const name = singleLine(submission.name, 100);
  const business = singleLine(submission.businessName ?? "", 120);
  const topic = singleLine(submission.topic, 80);
  const email = submission.email.trim().toLowerCase();
  return {
    deliveryId: randomUUID(),
    destination: SUPPORT_EMAIL,
    replyTo: email,
    subject: `LocalAction contact — ${topic}`,
    text: [
      "New LocalAction contact message",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Business: ${business || "Not supplied"}`,
      `Topic: ${topic}`,
      "",
      "Message:",
      submission.message.trim(),
    ].join("\n"),
  };
}

export type ContactDependencies = {
  identifyClient: (request: Request) => string;
  rateLimit?: (identifier: string) => {
    allowed: boolean;
    retryAfterSeconds: number;
  };
  transport?: EmailTransport;
};

const failure = () =>
  Response.json(
    {
      ok: false,
      message:
        "We couldn't send your message. You can email us directly at support@local-action.com.",
    },
    { status: 502 },
  );

export async function handleContactRequest(
  request: Request,
  dependencies: ContactDependencies,
) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return Response.json(
      { ok: false, message: "Invalid request." },
      { status: 403 },
    );

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 12_000)
    return Response.json(
      { ok: false, message: "Message is too long." },
      { status: 413 },
    );

  let raw: unknown;
  try {
    const body = await request.text();
    if (body.length > 12_000) throw new Error("oversize");
    raw = JSON.parse(body);
  } catch {
    return Response.json(
      { ok: false, message: "Check the form and try again." },
      { status: 400 },
    );
  }
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success)
    return Response.json(
      { ok: false, message: "Check the form and try again." },
      { status: 422 },
    );

  const success = () =>
    Response.json({
      ok: true,
      message:
        "Message sent. Thanks — we'll get back to you as soon as we can.",
    });
  if (parsed.data.website) return success();

  try {
    const identifier = dependencies.identifyClient(request);
    const rate = (dependencies.rateLimit ?? consumeContactRateLimit)(
      identifier,
    );
    if (!rate.allowed)
      return Response.json(
        { ok: false, message: "Too many messages. Please wait and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    await (dependencies.transport ?? configuredEmailTransport()).send(
      buildContactEmail(parsed.data),
    );
    return success();
  } catch (error) {
    logServerEvent("error", "contact_email_failed", {
      reason: error instanceof Error ? error.message.slice(0, 160) : "unknown",
    });
    return failure();
  }
}
