import { clerkMiddleware } from "@clerk/nextjs/server";
import { isPrivatePath } from "@/lib/auth-routes";

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  if (isPrivatePath(pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
