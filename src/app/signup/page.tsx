import Link from "next/link";
import { signupAction } from "@/app/actions";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="centered">
      <div>
        <span className="eyebrow">Step 1 of 6</span>
        <h1>Create your account</h1>
        <p>Start with your email and business name.</p>
        <AuthForm action={signupAction} kind="signup" />
        <p className="center">
          Already registered? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
