import { isIP } from "node:net";

type Environment = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);
const TRUSTED_IP_HEADERS = [
  "cf-connecting-ip",
  "x-forwarded-for",
  "x-real-ip",
] as const;
type TrustedIpHeader = (typeof TRUSTED_IP_HEADERS)[number];

export function applicationBaseUrl(env: Environment = process.env) {
  const raw =
    env.APP_URL?.trim() ||
    (env.NODE_ENV === "production" ? null : "http://localhost:3000");
  if (!raw) throw new Error("APP_URL is required in production");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("APP_URL must be an absolute HTTP(S) origin");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("APP_URL must contain only an HTTP(S) origin");
  if (
    env.NODE_ENV === "production" &&
    (url.protocol !== "https:" || LOCAL_HOSTS.has(url.hostname.toLowerCase()))
  )
    throw new Error("Production APP_URL must be a public HTTPS origin");
  return url.origin;
}

export function sessionTtlDays(env: Environment = process.env) {
  const value = Number(env.SESSION_TTL_DAYS ?? 30);
  if (!Number.isInteger(value) || value < 1 || value > 365)
    throw new Error("SESSION_TTL_DAYS must be an integer from 1 to 365");
  return value;
}

function trustedIpHeader(env: Environment): TrustedIpHeader {
  const value = (
    env.TRUSTED_CLIENT_IP_HEADER ?? "x-forwarded-for"
  ).toLowerCase();
  if (!TRUSTED_IP_HEADERS.includes(value as TrustedIpHeader))
    throw new Error("TRUSTED_CLIENT_IP_HEADER is not supported");
  return value as TrustedIpHeader;
}

export function clientNetworkIdentifier(
  headers: Headers,
  env: Environment = process.env,
) {
  const trustProxy = env.TRUST_PROXY_HEADERS === "true";
  if (!trustProxy) {
    if (env.NODE_ENV === "production")
      throw new Error(
        "TRUST_PROXY_HEADERS must be true behind trusted ingress",
      );
    return "local-client";
  }
  const header = trustedIpHeader(env);
  const raw = headers.get(header);
  const candidate =
    header === "x-forwarded-for" ? raw?.split(",")[0]?.trim() : raw?.trim();
  if (!candidate || !isIP(candidate))
    throw new Error(`Trusted ingress did not supply a valid ${header}`);
  return candidate;
}

export function productionEnvironmentIssues(env: Environment = process.env) {
  const issues: string[] = [];
  try {
    applicationBaseUrl({ ...env, NODE_ENV: "production" });
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "APP_URL is invalid");
  }
  try {
    sessionTtlDays(env);
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "SESSION_TTL_DAYS is invalid",
    );
  }
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) issues.push("DATABASE_URL is required");
  else if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl))
    issues.push("DATABASE_URL must use PostgreSQL");
  const directUrl = env.DATABASE_URL_UNPOOLED?.trim();
  if (!directUrl)
    issues.push("DATABASE_URL_UNPOOLED is required for migrations");
  else if (!/^postgres(?:ql)?:\/\//i.test(directUrl))
    issues.push("DATABASE_URL_UNPOOLED must use PostgreSQL");
  if (env.PRIVATE_STORAGE_PROVIDER !== "neon")
    issues.push("PRIVATE_STORAGE_PROVIDER must be neon in production");
  for (const key of ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"] as const) {
    if (!env[key]?.trim()) issues.push(`${key} is required for Neon storage`);
  }
  if (env.AWS_REGION !== "us-east-2")
    issues.push("AWS_REGION must be us-east-2 for Neon Object Storage");
  try {
    const endpoint = new URL(env.AWS_ENDPOINT_URL_S3 ?? "");
    if (endpoint.protocol !== "https:") throw new Error();
  } catch {
    issues.push("AWS_ENDPOINT_URL_S3 must be an HTTPS URL");
  }
  const salt = env.QUOTE_RATE_LIMIT_SALT?.trim();
  if (!salt || salt.length < 32 || /replace|example/i.test(salt))
    issues.push(
      "QUOTE_RATE_LIMIT_SALT must be a non-placeholder 32+ character secret",
    );
  if (env.TRUST_PROXY_HEADERS !== "true")
    issues.push("TRUST_PROXY_HEADERS must be true behind trusted ingress");
  else {
    try {
      trustedIpHeader(env);
    } catch (error) {
      issues.push(
        error instanceof Error ? error.message : "Trusted IP header is invalid",
      );
    }
  }
  if (env.EMAIL_TRANSPORT !== "resend")
    issues.push("EMAIL_TRANSPORT must be resend in production");
  if (!env.RESEND_API_KEY?.trim()) issues.push("RESEND_API_KEY is required");
  if (!env.EMAIL_FROM?.includes("@"))
    issues.push("EMAIL_FROM must be a valid sender");
  return issues;
}
