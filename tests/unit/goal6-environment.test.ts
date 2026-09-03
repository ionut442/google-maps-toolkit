import { describe, expect, it } from "vitest";
import {
  applicationBaseUrl,
  clientNetworkIdentifier,
  productionEnvironmentIssues,
  sessionTtlDays,
} from "@/lib/environment";

describe("Goal 6 production environment", () => {
  it("normalizes a canonical origin and rejects dangerous production URLs", () => {
    expect(applicationBaseUrl({ APP_URL: "https://toolkit.example/" })).toBe(
      "https://toolkit.example",
    );
    expect(() =>
      applicationBaseUrl({
        NODE_ENV: "production",
        APP_URL: "http://localhost:3000",
      }),
    ).toThrow("public HTTPS origin");
    expect(() =>
      applicationBaseUrl({ APP_URL: "https://toolkit.example/path" }),
    ).toThrow("only an HTTP(S) origin");
  });

  it("bounds session lifetime", () => {
    expect(sessionTtlDays({ SESSION_TTL_DAYS: "30" })).toBe(30);
    expect(() => sessionTtlDays({ SESSION_TTL_DAYS: "0" })).toThrow();
    expect(() => sessionTtlDays({ SESSION_TTL_DAYS: "forever" })).toThrow();
  });

  it("accepts client addresses only from explicitly trusted ingress", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.8, 10.0.0.2",
    });
    expect(clientNetworkIdentifier(headers, { NODE_ENV: "test" })).toBe(
      "local-client",
    );
    expect(
      clientNetworkIdentifier(headers, {
        NODE_ENV: "production",
        TRUST_PROXY_HEADERS: "true",
      }),
    ).toBe("198.51.100.8");
    expect(() =>
      clientNetworkIdentifier(headers, { NODE_ENV: "production" }),
    ).toThrow("TRUST_PROXY_HEADERS");
    expect(() =>
      clientNetworkIdentifier(new Headers({ "x-forwarded-for": "forged" }), {
        NODE_ENV: "production",
        TRUST_PROXY_HEADERS: "true",
      }),
    ).toThrow("valid x-forwarded-for");
  });

  it("reports complete production prerequisites without exposing values", () => {
    const issues = productionEnvironmentIssues({
      APP_URL: "http://localhost:3000",
      SESSION_TTL_DAYS: "900",
      PRIVATE_STORAGE_PROVIDER: "local",
      QUOTE_RATE_LIMIT_SALT: "replace-me",
      EMAIL_TRANSPORT: "development",
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("APP_URL"),
        expect.stringContaining("SESSION_TTL_DAYS"),
        expect.stringContaining("DATABASE_URL"),
        expect.stringContaining("DATABASE_URL_UNPOOLED"),
        expect.stringContaining("PRIVATE_STORAGE_PROVIDER"),
        expect.stringContaining("AWS_ACCESS_KEY_ID"),
        expect.stringContaining("AWS_SECRET_ACCESS_KEY"),
        expect.stringContaining("AWS_REGION"),
        expect.stringContaining("AWS_ENDPOINT_URL_S3"),
        expect.stringContaining("QUOTE_RATE_LIMIT_SALT"),
        expect.stringContaining("TRUST_PROXY_HEADERS"),
        expect.stringContaining("EMAIL_TRANSPORT"),
        expect.stringContaining("RESEND_API_KEY"),
        expect.stringContaining("EMAIL_FROM"),
      ]),
    );

    expect(
      productionEnvironmentIssues({
        APP_URL: "https://toolkit.example",
        SESSION_TTL_DAYS: "30",
        DATABASE_URL: "postgresql://runtime.example/toolkit",
        DATABASE_URL_UNPOOLED: "postgresql://migrations.example/toolkit",
        PRIVATE_STORAGE_PROVIDER: "neon",
        AWS_ACCESS_KEY_ID: "test-access-key",
        AWS_SECRET_ACCESS_KEY: "test-secret-key",
        AWS_ENDPOINT_URL_S3: "https://storage.example",
        AWS_REGION: "us-east-2",
        QUOTE_RATE_LIMIT_SALT: "a-secure-random-value-with-32-characters",
        TRUST_PROXY_HEADERS: "true",
        EMAIL_TRANSPORT: "resend",
        RESEND_API_KEY: "test-resend-key",
        EMAIL_FROM: "quotes@toolkit.example",
      }),
    ).toEqual([]);
  });
});
