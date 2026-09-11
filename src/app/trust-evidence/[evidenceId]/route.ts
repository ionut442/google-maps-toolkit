import { privateStorage, publicStorage } from "@/lib/storage";
import { findPublicTrustEvidence } from "@/lib/trust-evidence";
import { findOwnedTrustEvidence } from "@/lib/trust-evidence";
import { currentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ evidenceId: string }> },
) {
  const { evidenceId } = await params;
  const user = await currentUser();
  const evidence =
    (await findPublicTrustEvidence(evidenceId)) ??
    (user ? await findOwnedTrustEvidence(user.id, evidenceId) : null);
  if (!evidence) return new Response("Not found", { status: 404 });
  try {
    const storage =
      evidence.storageScope === "PUBLIC" ? publicStorage : privateStorage;
    const bytes = await storage.read(evidence.objectKey);
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": evidence.mediaType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename="${encodeURIComponent(evidence.originalFilename)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
