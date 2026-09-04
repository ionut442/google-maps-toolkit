import Link from "next/link";
import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div>
        <h1>Welcome back</h1>
        <p>Continue configuring your customer toolkit.</p>
        <AuthForm action={loginAction} kind="login" />
        <p className="center">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
