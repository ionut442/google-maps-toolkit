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
        eyebrow="Business Details"
        title="Your business information"
        intro="Keep the details reused across your customer tools accurate and up to date."
      />
      <ProfileForm business={business} />
    </main>
  );
}
