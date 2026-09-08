"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  addFaqItem,
  deleteFaqItem,
  moveFaqItem,
  updateFaqItem,
} from "@/lib/faq";
import {
  applyTemplate,
  createBusinessForUser,
  requireOwnedBusiness,
} from "@/lib/business";
import {
  industrySchema,
  loginSchema,
  normalizePhone,
  primaryActionSchema,
  profileSchema,
  signupSchema,
} from "@/lib/validation";
import {
  canPublishBusiness,
  moduleSwapIndex,
  moduleTypes,
  parseModuleConfig,
  resolvePrimaryAction,
  type ModuleType,
  validPrimaryActions,
} from "@/lib/domain";
import {
  addQuoteFormField,
  deleteQuoteFormField,
  moveQuoteFormField,
  updateQuoteFormField,
  updateQuoteFormMeta,
} from "@/lib/quote-config-service";
import { retryOwnedQuoteEmail } from "@/lib/quotes";
import {
  saveOwnedModuleConfig,
  saveOwnedTrustConfig,
} from "@/lib/module-config-service";
import { removeTrustEvidence, uploadTrustEvidence } from "@/lib/trust-evidence";
import {
  removeStoredBusinessLogo,
  stageBusinessLogo,
} from "@/lib/business-logo";
import { privateStorage } from "@/lib/storage";
import { allEnabledToolsReady } from "@/lib/onboarding-readiness";
import {
  extractGoogleReviewLink,
  type ExtractReviewLinkResult,
} from "@/lib/google-review-link";
import { resolvedGoogleReviewUrl } from "@/lib/profile-behavior";

export type FormState = {
  error?: string;
  success?: string;
  fields?: Record<string, string[]>;
};

export async function extractReviewLinkAction(
  input: string,
): Promise<ExtractReviewLinkResult> {
  await requireUser();
  return extractGoogleReviewLink(input);
}
const values = (formData: FormData) => Object.fromEntries(formData.entries());
const invalid = (error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}): FormState => ({
  error: "Check the highlighted fields.",
  fields: error.flatten().fieldErrors,
});

export async function signupAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);
  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing)
    return { error: "An account could not be created with these details." };
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });
    await createBusinessForUser(
      created.id,
      parsed.data.businessName,
      parsed.data.email,
      tx,
    );
    return created;
  });
  await createSession(user.id);
  redirect("/onboarding/industry");
}

export async function loginAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);
  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash)))
    return { error: "Email or password is incorrect." };
  await createSession(user.id);
  const business = await requireOwnedBusiness(user.id);
  redirect(
    business.onboardingStep < 7
      ? stepPath(business.onboardingStep)
      : "/dashboard",
  );
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

function stepPath(step: number) {
  return (
    (
      {
        2: "/onboarding/industry",
        3: "/onboarding/details",
        4: "/onboarding/tools",
        5: "/onboarding/publish",
        6: "/onboarding/publish",
      } as Record<number, string>
    )[step] ?? "/dashboard"
  );
}

export async function selectIndustryAction(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const parsed = industrySchema.safeParse(values(formData));
  if (!parsed.success) throw new Error("Choose a supported business type");
  await db.$transaction((tx) =>
    applyTemplate(
      business.id,
      parsed.data.industry,
      tx,
      parsed.data.customIndustryLabel ?? null,
    ),
  );
  redirect("/onboarding/details");
}

export async function saveProfileAction(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const logoFile = formData.get("logoFile");
  const hasLogoUpload = logoFile instanceof File && logoFile.size > 0;
  const submitted = values(formData);
  if (hasLogoUpload) submitted.logoUrl = "";
  const parsed = profileSchema.safeParse(submitted);
  if (!parsed.success) return invalid(parsed.error);
  let stagedLogo: Awaited<ReturnType<typeof stageBusinessLogo>> | null = null;
  if (hasLogoUpload) {
    try {
      stagedLogo = await stageBusinessLogo(
        business.id,
        business.slug,
        logoFile,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Logo upload failed.";
      return { error: message, fields: { logoFile: [message] } };
    }
  }
  const nextLogoUrl = stagedLogo?.url ?? parsed.data.logoUrl;
  const googleReviewUrl = resolvedGoogleReviewUrl({
    previousMapsUrl: business.googleMapsUrl,
    previousReviewUrl: business.googleReviewUrl,
    submittedMapsUrl: parsed.data.googleMapsUrl,
    submittedReviewUrl: parsed.data.googleReviewUrl,
    resolvedForMapsUrl:
      String(formData.get("resolvedGoogleMapsUrl") ?? "") || null,
  });
  try {
    await db.business.update({
      where: { id: business.id },
      data: {
        ...parsed.data,
        logoUrl: nextLogoUrl,
        googleReviewUrl,
        phone: normalizePhone(parsed.data.phone),
        whatsapp: normalizePhone(parsed.data.whatsapp),
        onboardingStep: Math.max(business.onboardingStep, 4),
      },
    });
  } catch (error) {
    if (stagedLogo?.created) {
      try {
        await privateStorage.delete(stagedLogo.objectKey);
      } catch {
        // Preserve the database failure while leaving cleanup retryable.
      }
    }
    throw error;
  }
  if (business.logoUrl && business.logoUrl !== nextLogoUrl) {
    try {
      await removeStoredBusinessLogo(
        business.id,
        business.slug,
        business.logoUrl,
      );
    } catch {
      // The new profile is already durable; an orphaned old logo is harmless.
    }
  }
  revalidatePath("/dashboard");
  if (String(formData.get("returnTo")) === "publish")
    redirect("/onboarding/publish");
  if (String(formData.get("intent")) === "onboarding")
    redirect("/onboarding/tools");
  return { success: "Business profile saved." };
}

export async function toggleModuleAction(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(
    user.id,
    String(formData.get("businessId")),
  );
  const moduleId = String(formData.get("moduleId"));
  const item = business.modules.find((m) => m.id === moduleId);
  if (!item) throw new Error("Tool not found or access denied");
  await db.$transaction(async (tx) => {
    await tx.businessModule.update({
      where: { id: item.id },
      data: { enabled: !item.enabled },
    });
    const modules = business.modules.map((m) =>
      m.id === item.id ? { ...m, enabled: !m.enabled } : m,
    );
    const nextPrimaryAction = resolvePrimaryAction(
      business.primaryAction,
      modules,
    );
    if (nextPrimaryAction !== business.primaryAction) {
      await tx.business.update({
        where: { id: business.id },
        data: { primaryAction: nextPrimaryAction },
      });
    }
  });
  revalidatePath("/dashboard");
  revalidatePath("/onboarding/tools");
}

export async function moveModuleAction(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(
    user.id,
    String(formData.get("businessId")),
  );
  const moduleId = String(formData.get("moduleId"));
  const direction = String(formData.get("direction"));
  const index = business.modules.findIndex((m) => m.id === moduleId);
  const swap = moduleSwapIndex(business.modules.length, index, direction);
  if (swap === null) return;
  await db.$transaction([
    db.businessModule.update({
      where: { id: business.modules[index].id },
      data: { sortOrder: business.modules[swap].sortOrder },
    }),
    db.businessModule.update({
      where: { id: business.modules[swap].id },
      data: { sortOrder: business.modules[index].sortOrder },
    }),
  ]);
  revalidatePath("/dashboard");
  revalidatePath("/onboarding/tools");
}

export async function updateModuleLabelAction(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(
    user.id,
    String(formData.get("businessId")),
  );
  const item = business.modules.find(
    (m) => m.id === String(formData.get("moduleId")),
  );
  if (!item || !moduleTypes.includes(item.type as ModuleType))
    throw new Error("Tool not found or access denied");
  const config = JSON.parse(item.config) as Record<string, unknown>;
  config.label = String(formData.get("label")).trim();
  const validated = parseModuleConfig(item.type as ModuleType, config);
  await db.businessModule.update({
    where: { id: item.id },
    data: {
      config: JSON.stringify(validated),
      enabled: true,
      customizedAt: new Date(),
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/onboarding/tools");
}

export async function updateContactActionConfigAction(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(
    user.id,
    String(formData.get("businessId")),
  );
  const item = business.modules.find(
    (module) => module.type === "CALL_WHATSAPP",
  );
  if (!item) throw new Error("Contact actions not found or access denied");
  const current = parseModuleConfig("CALL_WHATSAPP", JSON.parse(item.config));
  const config = parseModuleConfig("CALL_WHATSAPP", {
    ...current,
    callLabel: String(formData.get("callLabel") ?? ""),
    whatsappLabel: String(formData.get("whatsappLabel") ?? ""),
    whatsappMessage: String(formData.get("whatsappMessage") ?? ""),
    emergencyLabel: String(formData.get("emergencyLabel") ?? ""),
  });
  await db.businessModule.update({
    where: { id: item.id },
    data: {
      config: JSON.stringify(config),
      enabled: true,
      customizedAt: new Date(),
    },
  });
  revalidatePath("/dashboard");
  revalidatePath(`/${business.slug}`);
}

function faqItemFrom(formData: FormData) {
  return {
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
  };
}

function revalidateFaq(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}

export async function addFaqAction(formData: FormData) {
  const user = await requireUser();
  const slug = await addFaqItem(
    user.id,
    String(formData.get("businessId")),
    faqItemFrom(formData),
  );
  revalidateFaq(slug);
}

export async function updateFaqAction(formData: FormData) {
  const user = await requireUser();
  const slug = await updateFaqItem(
    user.id,
    String(formData.get("businessId")),
    Number(formData.get("index")),
    faqItemFrom(formData),
  );
  revalidateFaq(slug);
}

export async function deleteFaqAction(formData: FormData) {
  const user = await requireUser();
  const slug = await deleteFaqItem(
    user.id,
    String(formData.get("businessId")),
    Number(formData.get("index")),
  );
  revalidateFaq(slug);
}

export async function moveFaqAction(formData: FormData) {
  const user = await requireUser();
  const slug = await moveFaqItem(
    user.id,
    String(formData.get("businessId")),
    Number(formData.get("index")),
    String(formData.get("direction")),
  );
  revalidateFaq(slug);
}

function revalidateQuoteConfig(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error("Enter a valid number");
  return number;
}

export async function updateQuoteFormMetaAction(formData: FormData) {
  const user = await requireUser();
  const slug = await updateQuoteFormMeta(
    user.id,
    String(formData.get("businessId")),
    {
      label: String(formData.get("label") ?? ""),
      intro: String(formData.get("intro") ?? ""),
    },
  );
  revalidateQuoteConfig(slug);
}

export async function updateQuoteFieldAction(formData: FormData) {
  const user = await requireUser();
  const slug = await updateQuoteFormField(
    user.id,
    String(formData.get("businessId")),
    Number(formData.get("index")),
    {
      label: String(formData.get("label") ?? ""),
      helperText: String(formData.get("helperText") ?? ""),
      required: String(formData.get("required")) === "true",
      choices: String(formData.get("choices") ?? "")
        .split(/\r?\n/)
        .map((choice) => choice.trim())
        .filter(Boolean),
      min: optionalNumber(formData.get("min")),
      max: optionalNumber(formData.get("max")),
      contactKind: String(formData.get("contactKind") ?? ""),
    },
  );
  revalidateQuoteConfig(slug);
}

export async function addQuoteFieldAction(formData: FormData) {
  const user = await requireUser();
  const slug = await addQuoteFormField(
    user.id,
    String(formData.get("businessId")),
    String(formData.get("type")),
  );
  revalidateQuoteConfig(slug);
}

export async function deleteQuoteFieldAction(formData: FormData) {
  const user = await requireUser();
  const slug = await deleteQuoteFormField(
    user.id,
    String(formData.get("businessId")),
    Number(formData.get("index")),
  );
  revalidateQuoteConfig(slug);
}

export async function moveQuoteFieldAction(formData: FormData) {
  const user = await requireUser();
  const slug = await moveQuoteFormField(
    user.id,
    String(formData.get("businessId")),
    Number(formData.get("index")),
    String(formData.get("direction")),
  );
  revalidateQuoteConfig(slug);
}

export async function retryQuoteEmailAction(formData: FormData) {
  const user = await requireUser();
  const quoteId = String(formData.get("quoteId"));
  await retryOwnedQuoteEmail(user.id, quoteId);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

async function savePurposeConfig(
  formData: FormData,
  type: "PRICING" | "SERVICE_AREA" | "TRUST",
) {
  const user = await requireUser();
  let input: unknown;
  try {
    input = JSON.parse(String(formData.get("config") ?? ""));
  } catch {
    throw new Error("Invalid configuration data");
  }
  const { slug } = await saveOwnedModuleConfig(
    user.id,
    String(formData.get("businessId")),
    type,
    input,
  );
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}
export async function savePricingAction(formData: FormData) {
  return savePurposeConfig(formData, "PRICING");
}
export async function saveServiceAreaAction(formData: FormData) {
  return savePurposeConfig(formData, "SERVICE_AREA");
}
export async function saveTrustAction(formData: FormData) {
  const user = await requireUser();
  let input: unknown;
  try {
    input = JSON.parse(String(formData.get("config") ?? ""));
  } catch {
    throw new Error("Invalid configuration data");
  }
  const { slug } = await saveOwnedTrustConfig(
    user.id,
    String(formData.get("businessId")),
    input,
  );
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}

export async function uploadTrustEvidenceAction(formData: FormData) {
  const user = await requireUser();
  const files = formData
    .getAll("evidence")
    .filter((file): file is File => file instanceof File && file.size > 0);
  const slug = await uploadTrustEvidence(
    user.id,
    String(formData.get("businessId")),
    String(formData.get("entryId")),
    files,
  );
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}
export async function removeTrustEvidenceAction(formData: FormData) {
  const user = await requireUser();
  await removeTrustEvidence(
    user.id,
    String(formData.get("businessId")),
    String(formData.get("entryId")),
    String(formData.get("evidenceId")),
  );
  revalidatePath("/dashboard");
}

export async function saveQuoteAction(formData: FormData) {
  const user = await requireUser();
  let input: unknown;
  try {
    input = JSON.parse(String(formData.get("config") ?? ""));
  } catch {
    throw new Error("Invalid quote form configuration");
  }
  const { slug } = await saveOwnedModuleConfig(
    user.id,
    String(formData.get("businessId")),
    "QUOTE_REQUEST",
    input,
  );
  revalidateQuoteConfig(slug);
}

export async function finishToolsAction() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  await db.business.update({
    where: { id: business.id },
    data: { onboardingStep: Math.max(business.onboardingStep, 5) },
  });
  redirect("/onboarding/publish");
}

export async function setPrimaryAction(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(
    user.id,
    String(formData.get("businessId")) || undefined,
  );
  const parsed = primaryActionSchema.safeParse(values(formData));
  if (
    !parsed.success ||
    !validPrimaryActions(business.modules).includes(parsed.data.primaryAction)
  )
    throw new Error("Primary action must use an enabled tool");
  await db.business.update({
    where: { id: business.id },
    data: {
      primaryAction: parsed.data.primaryAction,
      onboardingStep: Math.max(business.onboardingStep, 6),
    },
  });
  revalidatePath("/dashboard");
  if (String(formData.get("intent")) === "onboarding")
    redirect("/onboarding/publish");
}

export async function setPublishedAction(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(
    user.id,
    String(formData.get("businessId")) || undefined,
  );
  const publish = String(formData.get("published")) === "true";
  if (
    publish &&
    (!canPublishBusiness(business, business.modules) ||
      !allEnabledToolsReady(business.modules, business))
  ) {
    throw new Error(
      "Complete the business details and save every enabled tool before publishing",
    );
  }
  await db.business.update({
    where: { id: business.id },
    data: { published: publish, onboardingStep: 7 },
  });
  revalidatePath("/dashboard");
  revalidatePath("/onboarding/publish");
  revalidatePath(`/${business.slug}`);
  if (String(formData.get("intent")) === "onboarding") redirect("/dashboard");
}
