import sharp from "sharp";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { accessibleBrandColor } from "./brand";
import { generateQrPng } from "./qr";

export type ReviewAssetBusiness = {
  name: string;
  brandColor: string;
  googleReviewUrl: string;
  logoUrl?: string | null;
};

function privateAddress(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "0.0.0.0" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      normalized,
    )
  );
}

export async function normalizeLogo(
  bytes: Buffer,
  width: number,
  height: number,
) {
  const metadata = await sharp(bytes).metadata();
  if (
    !metadata.width ||
    !metadata.height ||
    !["png", "jpeg", "webp"].includes(metadata.format ?? "")
  )
    throw new Error("Unsupported logo");
  return sharp(bytes)
    .resize({
      width,
      height,
      fit: "contain",
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function loadSafeLogo(
  urlValue: string | null | undefined,
  width: number,
  height: number,
) {
  if (!urlValue) return null;
  try {
    const url = new URL(urlValue);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      isIP(url.hostname)
    )
      return null;
    const addresses = await lookup(url.hostname, { all: true });
    if (
      !addresses.length ||
      addresses.some((item) => privateAddress(item.address))
    )
      return null;
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(3000),
      headers: { accept: "image/png,image/jpeg,image/webp" },
    });
    if (
      !response.ok ||
      !["image/png", "image/jpeg", "image/webp"].includes(
        response.headers.get("content-type")?.split(";")[0] ?? "",
      )
    )
      return null;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > 2 * 1024 * 1024) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > 2 * 1024 * 1024) return null;
    return await normalizeLogo(bytes, width, height);
  } catch {
    return null;
  }
}

function xml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!,
  );
}

export function wrapBusinessName(name: string, max = 28, lines = 3) {
  const words = name.trim().split(/\s+/);
  const output: string[] = [];
  for (const word of words) {
    const current = output.at(-1);
    if (
      !current ||
      (current.length + word.length + 1 > max && output.length < lines)
    )
      output.push(word);
    else output[output.length - 1] = `${current} ${word}`;
  }
  if (output.length > lines) output.splice(lines);
  const last = output.at(-1) ?? "Business";
  if (last.length > max + 8)
    output[output.length - 1] = `${last.slice(0, max + 5)}…`;
  return output;
}

function textLines(
  lines: string[],
  x: number,
  y: number,
  size: number,
  color: string,
  anchor: "start" | "middle" = "middle",
) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * size * 1.18}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="700" fill="${color}">${xml(line)}</text>`,
    )
    .join("");
}

export async function generatePrintableReviewSign(
  business: ReviewAssetBusiness,
) {
  const width = 2480,
    height = 3508;
  const brand = accessibleBrandColor(business.brandColor);
  const name = wrapBusinessName(business.name, 28, 3);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><rect width="100%" height="520" fill="${brand.background}"/><text x="1240" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="170" font-weight="800" fill="${brand.foreground}">How did we do?</text><text x="1240" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" fill="${brand.foreground}">Your feedback helps local customers find us.</text>${textLines(name, 1240, 820, 120, "#111827")}<text x="1240" y="1280" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" fill="#475467">Scan to review us on Google</text><rect x="620" y="1430" width="1240" height="1240" rx="48" fill="#ffffff" stroke="#d0d5dd" stroke-width="8"/><text x="1240" y="2920" text-anchor="middle" font-family="Arial, sans-serif" font-size="88" font-weight="700" fill="${brand.border}">Thank you for choosing us</text></svg>`;
  const qr = await generateQrPng(business.googleReviewUrl, 1080);
  const logo = await loadSafeLogo(business.logoUrl, 280, 280);
  return sharp(Buffer.from(svg))
    .composite([
      { input: qr, left: 700, top: 1510 },
      ...(logo ? [{ input: logo, left: 120, top: 650 }] : []),
    ])
    .png()
    .toBuffer();
}

export async function generateSocialReviewGraphic(
  business: ReviewAssetBusiness,
) {
  const width = 1200,
    height = 1200;
  const brand = accessibleBrandColor(business.brandColor);
  const name = wrapBusinessName(business.name, 24, 2);
  const initial = xml(business.name.trim().charAt(0).toUpperCase() || "B");
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${brand.background}"/><circle cx="120" cy="120" r="70" fill="#ffffff" opacity=".96"/><text x="120" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" font-weight="800" fill="${brand.border}">${initial}</text>${textLines(name, 220, 105, 58, brand.foreground, "start")}<text x="80" y="370" font-family="Arial, sans-serif" font-size="104" font-weight="800" fill="${brand.foreground}">Loved our service?</text><text x="80" y="470" font-family="Arial, sans-serif" font-size="58" fill="${brand.foreground}">Scan to leave us a Google review.</text><rect x="345" y="560" width="510" height="510" rx="32" fill="#ffffff"/><text x="600" y="1140" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="${brand.foreground}">Thank you for supporting a local business</text></svg>`;
  const qr = await generateQrPng(business.googleReviewUrl, 430);
  const logo = await loadSafeLogo(business.logoUrl, 140, 140);
  return sharp(Buffer.from(svg))
    .composite([
      { input: qr, left: 385, top: 600 },
      ...(logo ? [{ input: logo, left: 50, top: 50 }] : []),
    ])
    .png()
    .toBuffer();
}
