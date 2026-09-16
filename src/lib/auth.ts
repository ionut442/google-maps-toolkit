import { auth as clerkAuth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveLocalUserForClerkSession } from "./clerk-identity";

export async function currentUser() {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  return resolveLocalUserForClerkSession(userId, async () => {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return {
      id: user.id,
      primaryEmailAddressId: user.primaryEmailAddressId,
      emailAddresses: user.emailAddresses.map((address) => ({
        id: address.id,
        emailAddress: address.emailAddress,
        verification: { status: address.verification?.status },
      })),
    };
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
