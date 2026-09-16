import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function AppHeader({ email }: { email: string }) {
  return (
    <div className="app-header">
      <Link href="/dashboard" className="brand">
        LocalAction
      </Link>
      <span>{email}</span>
      <UserButton />
    </div>
  );
}
