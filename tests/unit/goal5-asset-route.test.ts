import { beforeEach, describe, expect, it, vi } from "vitest";
import { PNG } from "pngjs";
import jsQR from "jsqr";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  findOwnedBusiness: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/business", () => ({
  findOwnedBusiness: mocks.findOwnedBusiness,
}));

import { GET } from "@/app/dashboard/businesses/[businessId]/assets/[kind]/route";

const business = {
  id: "business-owner-a",
  name: "Route Test Plumbing",
  slug: "route-test-plumbing",
  published: true,
  brandColor: "#2563eb",
  googleReviewUrl:
    "https://search.google.com/local/writereview?placeid=ChIJRouteTestIdentifier12345",
  logoUrl: null,
};

function request(kind: string, download = false) {
  return GET(
    new Request(
      `http://localhost:3000/dashboard/businesses/${business.id}/assets/${kind}${download ? "?download=1" : ""}`,
    ),
    { params: Promise.resolve({ businessId: business.id, kind }) },
  );
}

async function decode(response: Response) {
  const png = PNG.sync.read(Buffer.from(await response.arrayBuffer()));
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}

describe("Goal 5 owner asset routes", () => {
  beforeEach(() => {
    vi.stubEnv("APP_URL", "https://toolkit.example.test");
    mocks.currentUser.mockReset().mockResolvedValue({
      id: "owner-a",
      email: "owner-a@example.test",
    });
    mocks.findOwnedBusiness.mockReset().mockResolvedValue(business);
  });

  it("denies unauthenticated and cross-owner business IDs", async () => {
    mocks.currentUser.mockResolvedValueOnce(null);
    expect((await request("business-page-qr")).status).toBe(404);
    mocks.findOwnedBusiness.mockResolvedValueOnce(null);
    expect((await request("review-qr")).status).toBe(404);
    expect(mocks.findOwnedBusiness).toHaveBeenLastCalledWith(
      "owner-a",
      business.id,
    );
  });

  it("rejects malformed kinds, unpublished pages, and missing review URLs", async () => {
    expect((await request("arbitrary")).status).toBe(404);
    mocks.findOwnedBusiness.mockResolvedValueOnce({
      ...business,
      published: false,
    });
    expect((await request("business-page-qr")).status).toBe(409);
    mocks.findOwnedBusiness.mockResolvedValueOnce({
      ...business,
      googleReviewUrl: null,
    });
    expect((await request("review-qr")).status).toBe(409);
    mocks.findOwnedBusiness.mockResolvedValueOnce({
      ...business,
      googleReviewUrl: "https://www.google.com/maps/place/not-a-review-link",
    });
    expect((await request("social-review-graphic")).status).toBe(409);
  });

  it("returns a decodable canonical Business Page QR with a safe filename", async () => {
    const response = await request("business-page-qr", true);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="route-test-plumbing-business-page-qr.png"',
    );
    expect(await decode(response)).toBe(
      "https://toolkit.example.test/route-test-plumbing",
    );
  });

  it("returns a Review QR pointing directly to the configured destination", async () => {
    const response = await request("review-qr");
    expect(response.status).toBe(200);
    expect(await decode(response)).toBe(business.googleReviewUrl);
  });
});
