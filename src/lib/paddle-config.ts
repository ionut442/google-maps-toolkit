import { createHmac, timingSafeEqual } from "node:crypto";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

type EnvironmentValues = Record<string, string | undefined>;

export type PaddleMode = "sandbox" | "live";

export type PaddlePublicConfig = {
  clientToken: string;
  priceId: string;
  environment: PaddleMode;
};

export function paddleConfigurationIssues(
  env: EnvironmentValues = process.env,
) {
  const issues: string[] = [];
  const mode = env.NEXT_PUBLIC_PADDLE_ENVIRONMENT?.trim();
  const apiKey = env.PADDLE_API_KEY?.trim();
  const webhookSecret = env.PADDLE_WEBHOOK_SECRET?.trim();
  const clientToken = env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  const priceId = env.NEXT_PUBLIC_PADDLE_PRICE_ID?.trim();

  if (mode !== "sandbox" && mode !== "live")
    issues.push("NEXT_PUBLIC_PADDLE_ENVIRONMENT must be sandbox or live");
  if (!apiKey) issues.push("PADDLE_API_KEY is required");
  if (!webhookSecret) issues.push("PADDLE_WEBHOOK_SECRET is required");
  if (!clientToken) issues.push("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is required");
  if (!priceId || !priceId.startsWith("pri_"))
    issues.push("NEXT_PUBLIC_PADDLE_PRICE_ID must be a Paddle price ID");

  if (mode === "sandbox") {
    if (apiKey && !apiKey.includes("_sdbx_"))
      issues.push("PADDLE_API_KEY must be a sandbox key in sandbox mode");
    if (clientToken && !clientToken.startsWith("test_"))
      issues.push(
        "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN must be a sandbox token in sandbox mode",
      );
  }
  if (mode === "live") {
    if (apiKey && !apiKey.includes("_live_"))
      issues.push("PADDLE_API_KEY must be a live key in live mode");
    if (clientToken && !clientToken.startsWith("live_"))
      issues.push(
        "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN must be a live token in live mode",
      );
  }
  return issues;
}

export function paddlePublicConfig(
  env: EnvironmentValues = process.env,
): PaddlePublicConfig | null {
  if (paddleConfigurationIssues(env).length) return null;
  return {
    clientToken: env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!.trim(),
    priceId: env.NEXT_PUBLIC_PADDLE_PRICE_ID!.trim(),
    environment: env.NEXT_PUBLIC_PADDLE_ENVIRONMENT!.trim() as PaddleMode,
  };
}

export function requirePaddleConfig(env: EnvironmentValues = process.env) {
  const issues = paddleConfigurationIssues(env);
  if (issues.length) throw new Error(issues.join("; "));
  return {
    ...paddlePublicConfig(env)!,
    apiKey: env.PADDLE_API_KEY!.trim(),
    webhookSecret: env.PADDLE_WEBHOOK_SECRET!.trim(),
  };
}

export function createPaddleClient(env: EnvironmentValues = process.env) {
  const config = requirePaddleConfig(env);
  return new Paddle(config.apiKey, {
    environment:
      config.environment === "sandbox"
        ? Environment.sandbox
        : Environment.production,
  });
}

function checkoutSignatureFor(businessId: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`localaction:paddle-checkout:${businessId}`)
    .digest("hex");
}

export function createCheckoutSignature(
  businessId: string,
  env: EnvironmentValues = process.env,
) {
  return checkoutSignatureFor(
    businessId,
    requirePaddleConfig(env).webhookSecret,
  );
}

export function verifyCheckoutSignature(
  businessId: string,
  signature: string,
  env: EnvironmentValues = process.env,
) {
  const expected = checkoutSignatureFor(
    businessId,
    requirePaddleConfig(env).webhookSecret,
  );
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
