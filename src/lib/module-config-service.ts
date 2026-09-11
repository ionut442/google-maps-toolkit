import { db } from "./db";
import { requireOwnedBusiness } from "./business";
import {
  parseModuleConfig,
  type ModuleConfigByType,
  type ModuleType,
} from "./domain";
import {
  privateStorage,
  publicStorage,
  type PrivateObjectStorage,
} from "./storage";

export async function saveOwnedModuleConfig<T extends ModuleType>(
  userId: string,
  businessId: string,
  type: T,
  input: unknown,
) {
  const business = await requireOwnedBusiness(userId, businessId);
  const item = business.modules.find((module) => module.type === type);
  if (!item) throw new Error("Tool not found or access denied");
  const config = parseModuleConfig(type, input);
  await db.businessModule.update({
    where: { id: item.id },
    data: {
      config: JSON.stringify(config),
      enabled: true,
      customizedAt: new Date(),
    },
  });
  return { slug: business.slug, config: config as ModuleConfigByType[T] };
}

export async function saveOwnedTrustConfig(
  userId: string,
  businessId: string,
  input: unknown,
  storage: PrivateObjectStorage = privateStorage,
  legacyStorage: PrivateObjectStorage = publicStorage,
) {
  const business = await requireOwnedBusiness(userId, businessId);
  const item = business.modules.find((module) => module.type === "TRUST");
  if (!item) throw new Error("Trust tool not found or access denied");
  const config = parseModuleConfig("TRUST", input);
  const retainedIds = config.entries.map((entry) => entry.id);
  const removed = await db.trustEvidence.findMany({
    where: {
      businessId,
      ...(retainedIds.length ? { entryId: { notIn: retainedIds } } : {}),
    },
    select: { id: true, objectKey: true, storageScope: true },
  });
  await db.$transaction([
    db.businessModule.update({
      where: { id: item.id },
      data: {
        config: JSON.stringify(config),
        enabled: true,
        customizedAt: new Date(),
      },
    }),
    ...(removed.length
      ? [
          db.trustEvidence.deleteMany({
            where: { id: { in: removed.map((entry) => entry.id) } },
          }),
        ]
      : []),
  ]);
  await Promise.allSettled(
    removed.map((entry) =>
      (entry.storageScope === "PRIVATE" ? storage : legacyStorage).delete(
        entry.objectKey,
      ),
    ),
  );
  return { slug: business.slug, config };
}
