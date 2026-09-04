import { randomUUID } from "node:crypto";
import { MAX_QUOTE_PHOTO_BYTES, MAX_QUOTE_PHOTOS } from "./quote-validation";

export type SupportedPhotoType = "image/jpeg" | "image/png" | "image/webp";
export type ValidatedUpload = {
  id: string;
  bytes: Uint8Array;
  mediaType: SupportedPhotoType;
  extension: "jpg" | "png" | "webp";
  originalFilename: string;
  sizeBytes: number;
};

export function detectedPhotoType(
  bytes: Uint8Array,
): SupportedPhotoType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    )
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export function sanitizeDisplayFilename(value: string, extension: string) {
  const base = value
    .split(/[\\/]/)
    .at(-1)!
    .replace(/[\u0000-\u001f\u007f";]/g, "")
    .trim()
    .slice(0, 100);
  return base || `photo.${extension}`;
}

export async function validatePhotoUploads(
  files: File[],
): Promise<ValidatedUpload[]> {
  if (files.length > MAX_QUOTE_PHOTOS)
    throw new Error(`Add no more than ${MAX_QUOTE_PHOTOS} photos.`);
  const uploads: ValidatedUpload[] = [];
  for (const file of files) {
    if (file.size <= 0 || file.size > MAX_QUOTE_PHOTO_BYTES)
      throw new Error("Each photo must be 5 MB or smaller.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mediaType = detectedPhotoType(bytes);
    if (!mediaType)
      throw new Error("Photos must contain valid JPG, PNG or WebP image data.");
    const declared = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (declared && declared !== mediaType)
      throw new Error("A photo type does not match its file content.");
    const extension =
      mediaType === "image/jpeg"
        ? "jpg"
        : mediaType === "image/png"
          ? "png"
          : "webp";
    uploads.push({
      id: randomUUID(),
      bytes,
      mediaType,
      extension,
      originalFilename: sanitizeDisplayFilename(file.name, extension),
      sizeBytes: file.size,
    });
  }
  return uploads;
}

export function quoteStorageKey(
  quoteId: string,
  upload: Pick<ValidatedUpload, "id" | "extension">,
) {
  if (!/^[0-9a-f-]{36}$/.test(quoteId) || !/^[0-9a-f-]{36}$/.test(upload.id))
    throw new Error("Invalid storage identifier");
  return `quotes/${quoteId}/${upload.id}.${upload.extension}`;
}
