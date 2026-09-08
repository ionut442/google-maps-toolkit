import { randomUUID } from "node:crypto";
import { db } from "./db";
import { requireOwnedBusiness } from "./business";
import { parseModuleConfig } from "./domain";
import { trustEntryState } from "./trust";
import {
  privateStorage,
  publicStorage,
  type PrivateObjectStorage,
} from "./storage";
import { sanitizeDisplayFilename } from "./uploads";

export const MAX_TRUST_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const MAX_TRUST_EVIDENCE_FILES = 6;
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
      storageScope: true,
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
      storageScope: true,
    },
  });
}

export async function findPublicTrustEvidence(evidenceId: string) {
  const evidence = await db.trustEvidence.findFirst({
    where: {
      id: evidenceId,
      business: {
        published: true,
        modules: { some: { type: "TRUST", enabled: true } },
      },
    },
    select: {
      objectKey: true,
      mediaType: true,
      originalFilename: true,
      storageScope: true,
      entryId: true,
      business: {
        select: {
          modules: {
            where: { type: "TRUST", enabled: true },
            select: { config: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!evidence) return null;
  try {
    const trustModule = evidence.business.modules[0];
    if (!trustModule) return null;
    const config = parseModuleConfig("TRUST", JSON.parse(trustModule.config));
    const entry = config.entries.find((item) => item.id === evidence.entryId);
    if (!entry || trustEntryState(entry.expiresOn) === "EXPIRED") return null;
    return {
      objectKey: evidence.objectKey,
      mediaType: evidence.mediaType,
      originalFilename: evidence.originalFilename,
      storageScope: evidence.storageScope,
    };
  } catch {
    return null;
  }
}

export async function uploadTrustEvidence(
  userId: string,
  businessId: string,
  entryId: string,
  filesInput: File | File[],
  storage: PrivateObjectStorage = publicStorage,
) {
  const files = Array.isArray(filesInput) ? filesInput : [filesInput];
  const business = await requireOwnedBusiness(userId, businessId);
  const trustModule = business.modules.find((item) => item.type === "TRUST");
  if (!trustModule) throw new Error("Trust tool not found or access denied");
  const config = parseModuleConfig("TRUST", JSON.parse(trustModule.config));
  if (!config.entries.some((entry) => entry.id === entryId))
    throw new Error("Credential not found or access denied");
  const existing = await db.trustEvidence.count({
    where: { businessId, entryId },
  });
  if (!files.length) throw new Error("Choose at least one evidence file");
  if (existing + files.length > MAX_TRUST_EVIDENCE_FILES)
    throw new Error(
      `Add no more than ${MAX_TRUST_EVIDENCE_FILES} files per credential`,
    );
  const validated = [];
  for (const file of files) {
    if (file.size <= 0 || file.size > MAX_TRUST_EVIDENCE_BYTES)
      throw new Error("Each evidence file must be 5 MB or smaller");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectEvidence(bytes);
    if (!detected)
      throw new Error("Evidence must contain valid PDF, JPG or PNG data");
    const declared = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (declared && declared !== detected.mediaType)
      throw new Error("Evidence type does not match its file content");
    const id = randomUUID();
    validated.push({
      id,
      bytes,
      objectKey: `trust/${business.id}/${id}.${detected.extension}`,
      originalFilename: sanitizeDisplayFilename(file.name, detected.extension),
      mediaType: detected.mediaType,
      sizeBytes: file.size,
    });
  }
  const stored: string[] = [];
  try {
    for (const item of validated) {
      await storage.store(item.objectKey, item.bytes);
      stored.push(item.objectKey);
    }
    await db.trustEvidence.createMany({
      data: validated.map((item) => ({
        id: item.id,
        objectKey: item.objectKey,
        originalFilename: item.originalFilename,
        mediaType: item.mediaType,
        sizeBytes: item.sizeBytes,
        storageScope: "PUBLIC",
        businessId,
        entryId,
      })),
    });
  } catch (error) {
    await Promise.allSettled(
      stored.map((objectKey) => storage.delete(objectKey)),
    );
    throw error;
  }
  return business.slug;
}

export async function removeTrustEvidence(
  userId: string,
  businessId: string,
  entryId: string,
  evidenceId: string,
  storage: PrivateObjectStorage = publicStorage,
  legacyStorage: PrivateObjectStorage = privateStorage,
) {
  await requireOwnedBusiness(userId, businessId);
  const evidence = await db.trustEvidence.findFirst({
    where: { id: evidenceId, businessId, entryId },
  });
  if (!evidence) return;
  await db.trustEvidence.delete({ where: { id: evidence.id } });
  await (evidence.storageScope === "PUBLIC" ? storage : legacyStorage).delete(
    evidence.objectKey,
  );
}
