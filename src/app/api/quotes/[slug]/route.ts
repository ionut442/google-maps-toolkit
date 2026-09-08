import {
  MAX_QUOTE_REQUEST_BYTES,
  quoteFormDataBytes,
} from "@/lib/quote-validation";
import { submitPublicQuote } from "@/lib/quotes";
import { applicationBaseUrl, clientNetworkIdentifier } from "@/lib/environment";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const configured = applicationBaseUrl();
    return new URL(origin).origin === configured;
  } catch {
    return false;
  }
}

function clientIdentifier(request: Request) {
  return clientNetworkIdentifier(request.headers);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!sameOrigin(request))
    return Response.json(
      { ok: false, message: "Request origin was not accepted." },
      { status: 403 },
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("multipart/form-data")
  )
    return Response.json(
      { ok: false, message: "Use the quote form to submit this request." },
      { status: 415 },
    );
  const contentLength = Number(request.headers.get("content-length"));
  if (
    !Number.isFinite(contentLength) ||
    contentLength <= 0 ||
    contentLength > MAX_QUOTE_REQUEST_BYTES
  )
    return Response.json(
      { ok: false, message: "The quote request is too large." },
      { status: 413 },
    );

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { ok: false, message: "The quote form could not be read." },
      { status: 422 },
    );
  }
  if (quoteFormDataBytes(formData) > MAX_QUOTE_REQUEST_BYTES)
    return Response.json(
      { ok: false, message: "The quote request is too large." },
      { status: 413 },
    );
  const { slug } = await params;
  let identifier: string;
  try {
    identifier = clientIdentifier(request);
  } catch {
    return Response.json(
      { ok: false, message: "Quote requests are temporarily unavailable." },
      { status: 503 },
    );
  }
  const result = await submitPublicQuote({
    slug,
    formData,
    clientIdentifier: identifier,
    previewUserId: (await currentUser())?.id,
  });
  if (result.ok) return Response.json({ ok: true }, { status: 201 });
  return Response.json(
    { ok: false, message: result.message, fieldErrors: result.fieldErrors },
    {
      status: result.status,
      headers:
        result.status === 429 && result.retryAfterSeconds
          ? { "Retry-After": String(result.retryAfterSeconds) }
          : undefined,
    },
  );
}
