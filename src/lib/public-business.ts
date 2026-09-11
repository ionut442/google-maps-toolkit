import { cache } from "react";
import { db } from "./db";
import {
  moduleTypes,
  safeParseModuleConfig,
  type ModuleConfigByType,
  type ModuleType,
} from "./domain";
import { trustEntryState } from "./trust";

export type PublicModule = {
  [K in ModuleType]: {
    type: K;
    sortOrder: number;
    config: ModuleConfigByType[K];
  };
}[ModuleType];

export type PublicBusiness = {
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string | null;
  brandColor: string;
  industry: string;
  customIndustryLabel: string | null;
  googleReviewUrl: string | null;
  googleReviewScore: number | null;
  googleReviewCount: number | null;
  displayGoogleReviewScore: boolean;
  displayGoogleReviewCount: boolean;
  primaryAction: string | null;
  modules: PublicModule[];
  trustEvidence?: Array<{
    id: string;
    entryId: string;
    mediaType: string;
    originalFilename: string;
  }>;
};

type PreviewableBusiness = Omit<PublicBusiness, "modules" | "trustEvidence"> & {
  modules: Array<{
    type: string;
    enabled?: boolean;
    sortOrder: number;
    config: string;
  }>;
  trustEvidence?: PublicBusiness["trustEvidence"];
};

function parsePublicModule(module: {
  type: string;
  sortOrder: number;
  config: string;
}): PublicModule | null {
  if (!moduleTypes.includes(module.type as ModuleType)) return null;
  const type = module.type as ModuleType;
  try {
    const config = safeParseModuleConfig(type, JSON.parse(module.config));
    return config
      ? ({ type, sortOrder: module.sortOrder, config } as PublicModule)
      : null;
  } catch {
    return null;
  }
}

export function toPublicBusiness(
  business: PreviewableBusiness,
): PublicBusiness {
  return {
    name: business.name,
    slug: business.slug,
    logoUrl: business.logoUrl,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    website: business.website,
    brandColor: business.brandColor,
    industry: business.industry,
    customIndustryLabel: business.customIndustryLabel,
    googleReviewUrl: business.googleReviewUrl,
    googleReviewScore: business.googleReviewScore,
    googleReviewCount: business.googleReviewCount,
    displayGoogleReviewScore: business.displayGoogleReviewScore,
    displayGoogleReviewCount: business.displayGoogleReviewCount,
    primaryAction: business.primaryAction,
    trustEvidence: business.trustEvidence ?? [],
    modules: business.modules
      .filter((module) => module.enabled !== false)
      .map(parsePublicModule)
      .filter((module): module is PublicModule => Boolean(module))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function findPublicBusinessBySlug(
  slug: string,
): Promise<PublicBusiness | null> {
  const business = await db.business.findFirst({
    where: { slug, published: true },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      phone: true,
      whatsapp: true,
      email: true,
      website: true,
      brandColor: true,
      industry: true,
      customIndustryLabel: true,
      googleReviewUrl: true,
      googleReviewScore: true,
      googleReviewCount: true,
      displayGoogleReviewScore: true,
      displayGoogleReviewCount: true,
      primaryAction: true,
      modules: {
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
        select: { type: true, sortOrder: true, config: true },
      },
      trustEvidence: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          entryId: true,
          mediaType: true,
          originalFilename: true,
        },
      },
    },
  });
  if (!business) return null;
  const publicBusiness = toPublicBusiness(business);
  const trust = publicBusiness.modules.find(
    (module) => module.type === "TRUST",
  );
  const visibleEntryIds = new Set(
    trust?.type === "TRUST"
      ? trust.config.entries
          .filter((entry) => trustEntryState(entry.expiresOn) !== "EXPIRED")
          .map((entry) => entry.id)
      : [],
  );
  publicBusiness.trustEvidence = (publicBusiness.trustEvidence ?? []).filter(
    (evidence) => visibleEntryIds.has(evidence.entryId),
  );
  return publicBusiness;
}

export const getPublicBusiness = cache(findPublicBusinessBySlug);
