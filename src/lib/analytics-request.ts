import { z } from "zod";
import {
  analyticsEventTypes,
  recordPublicAnalyticsEvent,
} from "@/lib/analytics";
import { logServerEvent } from "@/lib/server-log";

const eventSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/),
    eventType: z.enum(analyticsEventTypes),
  })
  .strict();

export async function handleAnalyticsRequest(
  request: Request,
  persist: typeof recordPublicAnalyticsEvent = recordPublicAnalyticsEvent,
) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 1024)
    return Response.json({ error: "Invalid event" }, { status: 413 });
  let value: unknown;
  try {
    const body = await request.text();
    if (body.length > 1024)
      return Response.json({ error: "Invalid event" }, { status: 413 });
    value = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(value);
  if (!parsed.success)
    return Response.json({ error: "Invalid event" }, { status: 400 });
  try {
    const recorded = await persist(parsed.data.slug, parsed.data.eventType);
    return new Response(null, { status: recorded ? 202 : 404 });
  } catch {
    logServerEvent("warn", "public_analytics_persist_failed", {
      eventType: parsed.data.eventType,
    });
    return new Response(null, { status: 202 });
  }
}
