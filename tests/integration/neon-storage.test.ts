import { describe, expect, it } from "vitest";
import { NeonPrivateStorage } from "@/lib/storage";

const remoteIt = process.env.NEON_STORAGE_INTEGRATION === "1" ? it : it.skip;
const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);

describe("Neon private object storage", () => {
  remoteIt(
    "stores, reads, describes, denies public access, and deletes",
    async () => {
      const endpoint = process.env.AWS_ENDPOINT_URL_S3;
      if (!endpoint) throw new Error("AWS_ENDPOINT_URL_S3 is required");
      const storage = new NeonPrivateStorage();
      const key = `quotes/${crypto.randomUUID()}/${crypto.randomUUID()}.png`;
      try {
        await storage.store(key, pngBytes);
        await expect(storage.read(key)).resolves.toEqual(pngBytes);
        await expect(storage.metadata(key)).resolves.toMatchObject({
          sizeBytes: pngBytes.byteLength,
          modifiedAt: expect.any(Date),
        });

        const publicResponse = await fetch(
          `${endpoint.replace(/\/$/, "")}/uploads/${key}`,
        );
        expect(publicResponse.ok).toBe(false);
        expect([401, 403, 404]).toContain(publicResponse.status);
      } finally {
        await storage.delete(key);
      }
      await expect(storage.metadata(key)).rejects.toThrow();
    },
  );
});
