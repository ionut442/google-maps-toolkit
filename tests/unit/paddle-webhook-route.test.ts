import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/paddle/webhook/route";

describe("Paddle webhook route", () => {
  beforeAll(() => {
    vi.stubEnv("PADDLE_API_KEY", "pdl_sdbx_apikey_test-only");
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", "pdl_ntfset_test-only");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "test_client-token");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ID", "pri_localaction-monthly");
    vi.stubEnv("NEXT_PUBLIC_PADDLE_ENVIRONMENT", "sandbox");
  });
  afterAll(() => vi.unstubAllEnvs());

  it("rejects an invalid Paddle signature before processing", async () => {
    const logger = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = await POST(
      new Request("https://local-action.com/api/paddle/webhook", {
        method: "POST",
        body: JSON.stringify({ event_type: "subscription.created" }),
        headers: { "paddle-signature": "ts=0;h1=invalid" },
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid webhook signature",
    });
    expect(logger).toHaveBeenCalledOnce();
    logger.mockRestore();
  });
});
