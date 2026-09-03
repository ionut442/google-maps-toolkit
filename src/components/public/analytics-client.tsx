"use client";

import {
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import type { AnalyticsEventType } from "@/lib/analytics";

export function sendAnalytics(slug: string, eventType: AnalyticsEventType) {
  const body = JSON.stringify({ slug, eventType });
  try {
    if (
      navigator.sendBeacon?.(
        "/api/analytics",
        new Blob([body], { type: "application/json" }),
      )
    )
      return;
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Customer navigation always wins over best-effort analytics.
  }
}

export function AnalyticsPageView({ slug }: { slug: string }) {
  const sentSlug = useRef<string | null>(null);
  useEffect(() => {
    if (sentSlug.current === slug) return;
    sentSlug.current = slug;
    sendAnalytics(slug, "PAGE_VIEW");
  }, [slug]);
  return null;
}

export function TrackedLink({
  slug,
  eventType,
  children,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  slug: string;
  eventType?: AnalyticsEventType;
  children: ReactNode;
}) {
  return (
    <a
      {...props}
      onClick={(event) => {
        if (eventType) sendAnalytics(slug, eventType);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
