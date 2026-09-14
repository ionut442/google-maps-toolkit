import { createPaddleClient, requirePaddleConfig } from "@/lib/paddle-config";
import {
  applyPaddleSubscriptionEvent,
  normalizePaddleSubscriptionEvent,
  PaddleWebhookError,
} from "@/lib/paddle-billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();
  let event;
  try {
    const config = requirePaddleConfig();
    event = await createPaddleClient().webhooks.unmarshal(
      rawBody,
      config.webhookSecret,
      signature,
    );
  } catch (error) {
    console.error("Paddle webhook signature verification failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  try {
    const normalized = normalizePaddleSubscriptionEvent(event);
    if (!normalized) return Response.json({ received: true, ignored: true });
    const result = await applyPaddleSubscriptionEvent(normalized);
    return Response.json({ received: true, outcome: result.outcome });
  } catch (error) {
    console.error("Paddle webhook could not be applied", {
      eventId: event.eventId,
      eventType: event.eventType,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json(
      { error: "Webhook could not be applied" },
      { status: error instanceof PaddleWebhookError ? error.status : 500 },
    );
  }
}
