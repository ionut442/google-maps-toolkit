import { handleContactRequest } from "@/lib/contact";
import { clientNetworkIdentifier } from "@/lib/environment";

export async function POST(request: Request) {
  return handleContactRequest(request, {
    identifyClient: (incoming) => clientNetworkIdentifier(incoming.headers),
    expectedOrigin: process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : undefined,
  });
}
