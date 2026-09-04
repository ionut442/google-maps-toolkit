import { createHash } from "node:crypto";
import { applicationBaseUrl } from "@/lib/environment";
import { privateStorage, type PrivateObjectStorage } from "@/lib/storage";
import { detectedPhotoType, type SupportedPhotoType } from "@/lib/uploads";

export const MAX_BUSINESS_LOGO_BYTES = 1024 * 1024;

const LOGO_FILENAME = /^[a-f0-9]{64}\.(jpg|png|webp)$/;

function extensionFor(mediaType: SupportedPhotoType) {
  if (mediaType === "image/jpeg") return "jpg";
  if (mediaType === "image/png") return "png";
  return "webp";
}

export function mediaTypeForLogoFilename(filename: string) {
  if (filename.endsWith(".jpg")) return "image/jpeg";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  return null;
}

export function storedLogoObjectKey({
  businessId,
  slug,
  logoUrl,
}: {
  businessId: string;
  slug: string;
  logoUrl: string | null;
}) {
  if (!logoUrl) return null;
  try {
    const url = new URL(logoUrl);
    if (url.origin !== applicationBaseUrl()) return null;
    const expectedPrefix = `/${encodeURIComponent(slug)}/logo/`;
    if (!url.pathname.startsWith(expectedPrefix) || url.search || url.hash)
      return null;
    const filename = url.pathname.slice(expectedPrefix.length);
    if (!LOGO_FILENAME.test(filename)) return null;
    return { filename, objectKey: `logos/${businessId}/${filename}` };
  } catch {
    return null;
  }
}

export async function stageBusinessLogo(
  businessId: string,
  slug: string,
  file: File,
  storage: PrivateObjectStorage = privateStorage,
) {
  if (file.size <= 0 || file.size > MAX_BUSINESS_LOGO_BYTES)
    throw new Error("Logo must be 1 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = detectedPhotoType(bytes);
  if (!mediaType)
    throw new Error("Logo must contain valid JPG, PNG or WebP image data.");
  const declared = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (declared && declared !== mediaType)
    throw new Error("Logo type does not match its file content.");

  const filename = `${createHash("sha256").update(bytes).digest("hex")}.${extensionFor(mediaType)}`;
  const objectKey = `logos/${businessId}/${filename}`;
  let created = true;
  try {
    await storage.store(objectKey, bytes);
  } catch (error) {
    try {
      const existing = await storage.metadata(objectKey);
      if (existing.sizeBytes !== bytes.byteLength) throw error;
      created = false;
    } catch {
      throw error;
    }
  }

  return {
    created,
    filename,
    mediaType,
    objectKey,
    url: new URL(
      `/${encodeURIComponent(slug)}/logo/${filename}`,
      `${applicationBaseUrl()}/`,
    ).toString(),
  };
}

export async function removeStoredBusinessLogo(
  businessId: string,
  slug: string,
  logoUrl: string | null,
  storage: PrivateObjectStorage = privateStorage,
) {
  const stored = storedLogoObjectKey({ businessId, slug, logoUrl });
  if (stored) await storage.delete(stored.objectKey);
}
