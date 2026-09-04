import { PageHeader } from "@/components/dashboard-ui";
import { ToolList } from "@/components/tool-list";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { safeHttpUrl } from "@/lib/public-actions";

export default async function ToolsPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  return (
    <main className="dashboard-page">
      <PageHeader
        eyebrow="Tools"
        title="Customer tools"
        intro="Choose the useful actions and information customers can access from your page."
      />
      <ToolList
        businessId={business.id}
        tools={business.modules}
        googleConnected={Boolean(safeHttpUrl(business.googleReviewUrl))}
      />
    </main>
  );
}
