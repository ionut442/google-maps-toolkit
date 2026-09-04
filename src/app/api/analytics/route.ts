import { handleAnalyticsRequest } from "@/lib/analytics-request";

export async function POST(request: Request) {
  return handleAnalyticsRequest(request);
}
