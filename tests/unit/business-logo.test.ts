import { describe, expect, it } from "vitest";
import {
  MAX_BUSINESS_LOGO_BYTES,
  stageBusinessLogo,
  storedLogoObjectKey,
} from "@/lib/business-logo";
import type { PrivateObjectStorage, StoredObjectMetadata } from "@/lib/storage";

class MemoryStorage implements PrivateObjectStorage {
  objects = new Map<string, Uint8Array>();

  async store(key: string, bytes: Uint8Array) {
    if (this.objects.has(key)) throw new Error("Already exists");
    this.objects.set(key, bytes);
  }

  async read(key: string) {
    const bytes = this.objects.get(key);
    if (!bytes) throw new Error("Not found");
    return bytes;
  }

  async delete(key: string) {
    this.objects.delete(key);
  }

  async metadata(key: string): Promise<StoredObjectMetadata> {
    const bytes = await this.read(key);
    return { sizeBytes: bytes.byteLength, modifiedAt: new Date(0) };
  }
}

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe("business logo uploads", () => {
  it("stores a content-addressed validated image and creates its public URL", async () => {
    const storage = new MemoryStorage();
    const staged = await stageBusinessLogo(
      "business_1",
      "sample-business",
      new File([pngBytes], "logo.png", { type: "image/png" }),
      storage,
    );

    expect(staged.url).toMatch(
      /^http:\/\/localhost:3000\/sample-business\/logo\/[a-f0-9]{64}\.png$/,
    );
    expect(await storage.read(staged.objectKey)).toEqual(pngBytes);
    expect(
      storedLogoObjectKey({
        businessId: "business_1",
        slug: "sample-business",
        logoUrl: staged.url,
      }),
    ).toEqual({ filename: staged.filename, objectKey: staged.objectKey });
  });

  it("rejects oversized and incorrectly declared files", async () => {
    const storage = new MemoryStorage();
    await expect(
      stageBusinessLogo(
        "business_1",
        "sample-business",
        new File([new Uint8Array(MAX_BUSINESS_LOGO_BYTES + 1)], "large.png", {
          type: "image/png",
        }),
        storage,
      ),
    ).rejects.toThrow("1 MB or smaller");
    await expect(
      stageBusinessLogo(
        "business_1",
        "sample-business",
        new File([pngBytes], "logo.jpg", { type: "image/jpeg" }),
        storage,
      ),
    ).rejects.toThrow("does not match");
  });
});
