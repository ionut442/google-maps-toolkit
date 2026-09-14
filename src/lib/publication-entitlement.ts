import { hasBillingAccess } from "@/lib/billing-entitlement";
import { canPublishBusiness } from "@/lib/domain";
import {
  allEnabledToolsReady,
  type ToolReadinessModule,
} from "@/lib/onboarding-readiness";

export function canPublishWithBilling(
  billingStatus: string | null | undefined,
  business: {
    phone: string;
    description: string;
    googleReviewUrl?: string | null;
  },
  modules: ToolReadinessModule[],
) {
  return (
    hasBillingAccess(billingStatus) &&
    canPublishBusiness(business, modules) &&
    allEnabledToolsReady(modules, business)
  );
}
