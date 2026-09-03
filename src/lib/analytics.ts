import { db } from "./db";
import { logServerEvent } from "./server-log";

export const analyticsEventTypes = [
  "PAGE_VIEW",
  "CALL_CLICK",
  "WHATSAPP_CLICK",
  "REVIEW_CLICK",
] as const;
export type AnalyticsEventType = (typeof analyticsEventTypes)[number];

export type AnalyticsHookEvent = {
  name: "quote_submitted";
  businessId: string;
  occurredAt: Date;
};

export type AnalyticsHookSink = (event: AnalyticsHookEvent) => Promise<void>;

export async function emitAnalyticsHook(
  event: AnalyticsHookEvent,
  sink: AnalyticsHookSink = async () => {},
) {
  try {
    await sink(event);
  } catch {
    logServerEvent("warn", "quote_analytics_hook_failed", {
      businessId: event.businessId,
    });
    // Analytics hooks never block the authoritative quote conversion.
  }
}

export async function recordPublicAnalyticsEvent(
  slug: string,
  eventType: AnalyticsEventType,
) {
  const business = await db.business.findFirst({
    where: { slug, published: true },
    select: { id: true },
  });
  if (!business) return false;
  await db.analyticsEvent.create({
    data: { businessId: business.id, eventType },
  });
  return true;
}

export type ActivityInput = {
  id: string;
  eventType: string;
  createdAt: Date;
};
export type QuoteActivityInput = { id: string; createdAt: Date };

export function last30DaysStart(now = new Date()) {
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

export function aggregateDashboardActivity(
  events: ActivityInput[],
  quotes: QuoteActivityInput[],
  now = new Date(),
) {
  const start = last30DaysStart(now);
  const inWindow = (date: Date) => date >= start && date <= now;
  const recentEvents = events.filter((event) => inWindow(event.createdAt));
  const count = (type: AnalyticsEventType) =>
    recentEvents.filter((event) => event.eventType === type).length;
  return {
    start,
    pageViews: count("PAGE_VIEW"),
    quoteRequests: quotes.filter((quote) => inWindow(quote.createdAt)).length,
    callClicks: count("CALL_CLICK"),
    whatsappClicks: count("WHATSAPP_CLICK"),
    reviewClicks: count("REVIEW_CLICK"),
  };
}

const activityLabels: Record<AnalyticsEventType, string> = {
  PAGE_VIEW: "Action Page viewed",
  CALL_CLICK: "Call button clicked",
  WHATSAPP_CLICK: "WhatsApp button clicked",
  REVIEW_CLICK: "Review button clicked",
};

export async function getOwnedDashboardActivity(
  userId: string,
  businessId: string,
) {
  const membership = await db.membership.findFirst({
    where: { userId, businessId },
    select: { id: true },
  });
  if (!membership) throw new Error("Business not found or access denied");
  const now = new Date();
  const start = last30DaysStart(now);
  const [events, quotes, recentEvents, recentQuotes] = await Promise.all([
    db.analyticsEvent.findMany({
      where: { businessId, createdAt: { gte: start, lte: now } },
      select: { id: true, eventType: true, createdAt: true },
    }),
    db.quoteRequest.findMany({
      where: { businessId, createdAt: { gte: start, lte: now } },
      select: { id: true, createdAt: true },
    }),
    db.analyticsEvent.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, eventType: true, createdAt: true },
    }),
    db.quoteRequest.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true },
    }),
  ]);
  const summary = aggregateDashboardActivity(events, quotes, now);
  const activity = [
    ...recentEvents.flatMap((event) =>
      analyticsEventTypes.includes(event.eventType as AnalyticsEventType)
        ? [
            {
              id: `event-${event.id}`,
              label: activityLabels[event.eventType as AnalyticsEventType],
              createdAt: event.createdAt,
            },
          ]
        : [],
    ),
    ...recentQuotes.map((quote) => ({
      id: `quote-${quote.id}`,
      label: "New quote request",
      createdAt: quote.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
  return { summary, activity };
}
