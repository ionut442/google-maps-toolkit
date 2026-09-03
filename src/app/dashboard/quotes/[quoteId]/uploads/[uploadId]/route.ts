import { currentUser } from "@/lib/auth";
import { findOwnedQuoteUpload } from "@/lib/quotes";
import { privateStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string; uploadId: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response("Not found", { status: 404 });
  const { quoteId, uploadId } = await params;
  const upload = await findOwnedQuoteUpload(user.id, quoteId, uploadId);
  if (!upload) return new Response("Not found", { status: 404 });
  let bytes: Uint8Array;
  try {
    bytes = await privateStorage.read(upload.objectKey);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const extension =
    upload.mediaType === "image/jpeg"
      ? "jpg"
      : upload.mediaType === "image/png"
        ? "png"
        : "webp";
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": upload.mediaType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `inline; filename="quote-photo.${extension}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
