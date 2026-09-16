import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const { userId } = await auth();
  if (userId) redirect("/auth/continue");

  return (
    <main className="auth-page">
      <div>
        <span className="eyebrow">Secure signup</span>
        <h1>Create your account</h1>
        <p>Choose Google or Clerk’s configured email verification flow.</p>
        <div className="clerk-auth-frame">
          <SignUp
            path="/signup"
            signInUrl="/login"
            forceRedirectUrl="/auth/continue"
          />
        </div>
      </div>
    </main>
  );
}
