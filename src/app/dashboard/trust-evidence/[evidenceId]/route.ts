import { currentUser } from "@/lib/auth";
import { privateStorage } from "@/lib/storage";
import { findOwnedTrustEvidence } from "@/lib/trust-evidence";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response("Not found", { status: 404 });
  const { evidenceId } = await params;
  const evidence = await findOwnedTrustEvidence(user.id, evidenceId);
  if (!evidence) return new Response("Not found", { status: 404 });
  let bytes: Uint8Array;
  try {
    bytes = await privateStorage.read(evidence.objectKey);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const extension =
    evidence.mediaType === "application/pdf"
      ? "pdf"
      : evidence.mediaType === "image/jpeg"
        ? "jpg"
        : "png";
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": evidence.mediaType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="credential-evidence.${extension}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
