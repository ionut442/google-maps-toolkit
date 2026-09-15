import { PageHeader } from "@/components/dashboard-ui";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";

export default async function BusinessDetailsPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  return (
    <main className="dashboard-page narrow-dashboard-page">
      <PageHeader
        eyebrow="Business details"
        title="Business settings"
        intro="Keep the customer-facing details on your LocalAction page accurate."
      />
      <ProfileForm business={business} />
    </main>
  );
}
