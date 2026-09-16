const privatePrefixes = ["/dashboard", "/onboarding", "/preview"];

export function isPrivatePath(pathname: string) {
  return privatePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
