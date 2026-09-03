import Link from "next/link";
import { logoutAction } from "@/app/actions";

export function AppHeader({ email }: { email: string }) {
  return (
    <div className="app-header">
      <Link href="/dashboard" className="brand">
        LocalAction
      </Link>
      <span>{email}</span>
      <form action={logoutAction}>
        <button className="secondary">Log out</button>
      </form>
    </div>
  );
}
