import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const { userId } = await auth();
  if (userId) redirect("/auth/continue");

  return (
    <main className="auth-page">
      <div>
        <h1>Welcome back</h1>
        <p>Continue configuring your customer toolkit.</p>
        <div className="clerk-auth-frame">
          <SignIn
            path="/login"
            signUpUrl="/signup"
            forceRedirectUrl="/auth/continue"
          />
        </div>
      </div>
    </main>
  );
}
