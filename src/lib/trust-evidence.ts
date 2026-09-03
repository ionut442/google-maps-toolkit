import { randomUUID } from "node:crypto";
import { db } from "./db";
import { requireOwnedBusiness } from "./business";
import { parseModuleConfig } from "./domain";
import { privateStorage, type PrivateObjectStorage } from "./storage";
import { sanitizeDisplayFilename } from "./uploads";

export const MAX_TRUST_EVIDENCE_BYTES = 5 * 1024 * 1024;
type EvidenceType = {
  mediaType: "application/pdf" | "image/jpeg" | "image/png";
  extension: "pdf" | "jpg" | "png";
};
function detectEvidence(bytes: Uint8Array): EvidenceType | null {
  if (
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  )
    return { mediaType: "application/pdf", extension: "pdf" };
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return { mediaType: "image/jpeg", extension: "jpg" };
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    )
  )
    return { mediaType: "image/png", extension: "png" };
  return null;
}

export async function listOwnedTrustEvidence(
  userId: string,
  businessId: string,
) {
  return db.trustEvidence.findMany({
    where: { businessId, business: { memberships: { some: { userId } } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      entryId: true,
      originalFilename: true,
      mediaType: true,
      sizeBytes: true,
      updatedAt: true,
    },
  });
}

export async function findOwnedTrustEvidence(
  userId: string,
  evidenceId: string,
) {
  return db.trustEvidence.findFirst({
    where: { id: evidenceId, business: { memberships: { some: { userId } } } },
    select: {
      id: true,
      objectKey: true,
      originalFilename: true,
      mediaType: true,
      sizeBytes: true,
    },
  });
}

export async function uploadTrustEvidence(
  userId: string,
  businessId: string,
  entryId: string,
  file: File,
  storage: PrivateObjectStorage = privateStorage,
) {
  const business = await requireOwnedBusiness(userId, businessId);
  const trustModule = business.modules.find((item) => item.type === "TRUST");
  if (!trustModule) throw new Error("Trust tool not found or access denied");
  const config = parseModuleConfig("TRUST", JSON.parse(trustModule.config));
  if (!config.entries.some((entry) => entry.id === entryId))
    throw new Error("Credential not found or access denied");
  if (file.size <= 0 || file.size > MAX_TRUST_EVIDENCE_BYTES)
    throw new Error("Evidence must be 5 MB or smaller");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectEvidence(bytes);
  if (!detected)
    throw new Error("Evidence must contain valid PDF, JPG or PNG data");
  const declared = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (declared && declared !== detected.mediaType)
    throw new Error("Evidence type does not match its file content");
  const id = randomUUID();
  const objectKey = `trust/${business.id}/${id}.${detected.extension}`;
  const previous = await db.trustEvidence.findUnique({
    where: { businessId_entryId: { businessId, entryId } },
    select: { objectKey: true },
  });
  await storage.store(objectKey, bytes);
  try {
    await db.trustEvidence.upsert({
      where: { businessId_entryId: { businessId, entryId } },
      update: {
        id,
        objectKey,
        originalFilename: sanitizeDisplayFilename(
          file.name,
          detected.extension,
        ),
        mediaType: detected.mediaType,
        sizeBytes: file.size,
      },
      create: {
        id,
        businessId,
        entryId,
        objectKey,
        originalFilename: sanitizeDisplayFilename(
          file.name,
          detected.extension,
        ),
        mediaType: detected.mediaType,
        sizeBytes: file.size,
      },
    });
  } catch (error) {
    await storage.delete(objectKey);
    throw error;
  }
  if (previous) await storage.delete(previous.objectKey);
  return business.slug;
}

export async function removeTrustEvidence(
  userId: string,
  businessId: string,
  entryId: string,
  storage: PrivateObjectStorage = privateStorage,
) {
  await requireOwnedBusiness(userId, businessId);
  const evidence = await db.trustEvidence.findUnique({
    where: { businessId_entryId: { businessId, entryId } },
  });
  if (!evidence) return;
  await db.trustEvidence.delete({ where: { id: evidence.id } });
  await storage.delete(evidence.objectKey);
}
