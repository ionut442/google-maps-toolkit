import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  configuredPrivateStorage,
  LocalPrivateStorage,
  NeonPrivateStorage,
} from "@/lib/storage";
import {
  quoteStorageKey,
  sanitizeDisplayFilename,
  validatePhotoUploads,
} from "@/lib/uploads";
import { MAX_QUOTE_PHOTO_BYTES } from "@/lib/quote-validation";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

const pngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);

describe("private quote uploads", () => {
  it("accepts a matching PNG signature and generates an opaque key", async () => {
    const [upload] = await validatePhotoUploads([
      new File([pngBytes], "kitchen.png", { type: "image/png" }),
    ]);
    expect(upload).toMatchObject({ mediaType: "image/png", extension: "png" });
    expect(quoteStorageKey(crypto.randomUUID(), upload)).toMatch(
      /^quotes\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.png$/,
    );
  });

  it("rejects content/MIME mismatch and unsupported signatures", async () => {
    await expect(
      validatePhotoUploads([
        new File([pngBytes], "fake.jpg", { type: "image/jpeg" }),
      ]),
    ).rejects.toThrow("does not match");
    await expect(
      validatePhotoUploads([
        new File(["plain text"], "fake.png", { type: "image/png" }),
      ]),
    ).rejects.toThrow("valid JPG, PNG or WebP");
  });

  it("accepts zero through three photos and enforces the fourth-photo limit", async () => {
    const photo = new File([pngBytes], "photo.png", { type: "image/png" });
    for (let count = 0; count <= 3; count += 1)
      await expect(
        validatePhotoUploads(Array.from({ length: count }, () => photo)),
      ).resolves.toHaveLength(count);
    await expect(
      validatePhotoUploads([photo, photo, photo, photo]),
    ).rejects.toThrow("no more than 3");
  });

  it("accepts exactly 5 MiB and rejects one byte more", async () => {
    const exactLimit = new Uint8Array(MAX_QUOTE_PHOTO_BYTES);
    exactLimit.set(pngBytes);
    await expect(
      validatePhotoUploads([
        new File([exactLimit], "limit.png", { type: "image/png" }),
      ]),
    ).resolves.toHaveLength(1);
    await expect(
      validatePhotoUploads([
        new File([new Uint8Array(MAX_QUOTE_PHOTO_BYTES + 1)], "large.png", {
          type: "image/png",
        }),
      ]),
    ).rejects.toThrow("5 MB or smaller");
  });

  it("selects local storage outside production and Neon explicitly", () => {
    expect(configuredPrivateStorage({ NODE_ENV: "test" })).toBeInstanceOf(
      LocalPrivateStorage,
    );
    expect(
      configuredPrivateStorage({ PRIVATE_STORAGE_PROVIDER: "neon" }),
    ).toBeInstanceOf(NeonPrivateStorage);
    expect(() =>
      configuredPrivateStorage({
        NODE_ENV: "production",
        PRIVATE_STORAGE_PROVIDER: "local",
      }),
    ).toThrow("unavailable");
  });

  it("sanitizes display filenames without using them as object paths", () => {
    expect(sanitizeDisplayFilename('../../bad\r\n"name.png', "png")).toBe(
      "badname.png",
    );
  });

  it("stores, reads, describes, and deletes only safe private keys", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gmt-storage-"));
    roots.push(root);
    const storage = new LocalPrivateStorage(root);
    const key = `quotes/${crypto.randomUUID()}/${crypto.randomUUID()}.png`;
    await storage.store(key, pngBytes);
    expect(await storage.read(key)).toEqual(pngBytes);
    expect((await storage.metadata(key)).sizeBytes).toBe(pngBytes.length);
    await storage.delete(key);
    await expect(storage.read(key)).rejects.toThrow();
    await expect(storage.store("../secret.png", pngBytes)).rejects.toThrow(
      "Invalid private object key",
    );
  });
});
