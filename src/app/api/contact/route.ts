import { handleContactRequest } from "@/lib/contact";
import { clientNetworkIdentifier } from "@/lib/environment";

export async function POST(request: Request) {
  return handleContactRequest(request, {
    identifyClient: (incoming) => clientNetworkIdentifier(incoming.headers),
  });
}
