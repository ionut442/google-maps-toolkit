import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);

  return (
    <AppShell email={user.email} businessName={business.name}>
      {children}
    </AppShell>
  );
}
