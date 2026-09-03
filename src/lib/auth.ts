import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { sessionTtlDays } from "./environment";

const COOKIE = "gmt_session";
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const days = sessionTtlDays();
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await db.session.create({
    data: { tokenHash: tokenHash(token), userId, expiresAt },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return db.user.findFirst({
    where: {
      sessions: {
        some: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() } },
      },
    },
    select: { id: true, email: true },
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  jar.delete(COOKIE);
}
