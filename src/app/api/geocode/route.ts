import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { geocoder } from "@/lib/geocoder";

export async function GET(request: Request) {
  if (!(await currentUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 100)
    return NextResponse.json({ results: [] });
  try {
    return NextResponse.json({ results: await geocoder.search(query) });
  } catch {
    return NextResponse.json(
      { error: "Place search is temporarily unavailable" },
      { status: 503 },
    );
  }
}
