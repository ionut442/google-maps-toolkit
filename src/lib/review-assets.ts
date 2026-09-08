import fs from "node:fs";
import path from "node:path";
import * as fontkit from "fontkit";
import type { Font } from "fontkit";
import sharp from "sharp";
import { accessibleBrandColor } from "./brand";
import { generateQrPng } from "./qr";

export type ReviewAssetBusiness = {
  name: string;
  brandColor: string;
  googleReviewUrl: string;
};

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

function loadFont(packageName: string, filename: string) {
  const bytes = fs.readFileSync(
    path.join(process.cwd(), "node_modules", packageName, "files", filename),
  );
  return fontkit.create(bytes) as Font;
}

let fonts:
  | {
      anton: Font[];
      public400: Font[];
      public500: Font[];
      public700: Font[];
      public800: Font[];
      mono600: Font[];
      mono700: Font[];
    }
  | undefined;

function assetFonts() {
  if (fonts) return fonts;
  const variants = (packageName: string, family: string, weight: number) => [
    loadFont(packageName, `${family}-latin-${weight}-normal.woff2`),
    loadFont(packageName, `${family}-latin-ext-${weight}-normal.woff2`),
  ];
  fonts = {
    anton: variants("@fontsource/anton", "anton", 400),
    public400: variants("@fontsource/public-sans", "public-sans", 400),
    public500: variants("@fontsource/public-sans", "public-sans", 500),
    public700: variants("@fontsource/public-sans", "public-sans", 700),
    public800: variants("@fontsource/public-sans", "public-sans", 800),
    mono600: variants("@fontsource/ibm-plex-mono", "ibm-plex-mono", 600),
    mono700: variants("@fontsource/ibm-plex-mono", "ibm-plex-mono", 700),
  };
  return fonts;
}

function fontForCharacter(available: Font[], character: string) {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    available.find((font) => font.hasGlyphForCodePoint(codePoint)) ??
    available[0]
  );
}

function textWidth(
  available: Font[],
  value: string,
  size: number,
  spacing = 0,
) {
  let width = 0;
  for (const character of value) {
    const font = fontForCharacter(available, character);
    const glyph = font.glyphForCodePoint(character.codePointAt(0) ?? 0);
    width += (glyph.advanceWidth / font.unitsPerEm) * size;
    width += spacing;
  }
  return Math.max(0, width - spacing);
}

function textPath({
  fonts: available,
  value,
  x,
  y,
  size,
  fill,
  anchor = "start",
  spacing = 0,
}: {
  fonts: Font[];
  value: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  anchor?: "start" | "middle" | "end";
  spacing?: number;
}) {
  const width = textWidth(available, value, size, spacing);
  let cursor =
    x - (anchor === "middle" ? width / 2 : anchor === "end" ? width : 0);
  const segments: string[] = [];
  for (const character of value) {
    const font = fontForCharacter(available, character);
    const glyph = font.glyphForCodePoint(character.codePointAt(0) ?? 0);
    const scale = size / font.unitsPerEm;
    segments.push(
      `<g transform="translate(${cursor} ${y}) scale(${scale} ${-scale})"><path d="${glyph.path.toSVG()}"/></g>`,
    );
    cursor += (glyph.advanceWidth / font.unitsPerEm) * size;
    cursor += spacing;
  }
  return `<g fill="${fill}">${segments.filter(Boolean).join("")}</g>`;
}

function fittedName(
  available: Font[],
  rawName: string,
  preferredSize: number,
  minimumSize: number,
  maxWidth: number,
) {
  let value = rawName.trim() || "Business Name";
  let size = preferredSize;
  while (size > minimumSize && textWidth(available, value, size) > maxWidth)
    size -= 2;
  if (textWidth(available, value, size) <= maxWidth) return { value, size };
  while (value.length > 1 && textWidth(available, `${value}…`, size) > maxWidth)
    value = value.slice(0, -1).trimEnd();
  return { value: `${value}…`, size };
}

function rgba(hex: string, opacity: number) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${opacity})`;
}

function assetForeground(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 190
    ? "#111827"
    : "#ffffff";
}

function starRow(
  x: number,
  centerY: number,
  size: number,
  gap: number,
  fill: string,
) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? size / 2 : size * 0.22;
    return `${x + size / 2 + Math.cos(angle) * radius},${centerY + Math.sin(angle) * radius}`;
  }).join(" ");
  return Array.from(
    { length: 5 },
    (_, index) =>
      `<polygon points="${points}" fill="${fill}" transform="translate(${index * (size + gap)} 0)"/>`,
  ).join("");
}

function firstUsableCharacter(name: string) {
  return (
    Array.from(name.trim())
      .find((character) => /[\p{L}\p{N}]/u.test(character))
      ?.toUpperCase() ?? "B"
  );
}

export async function generatePrintableReviewSign(
  business: ReviewAssetBusiness,
) {
  const width = 2480;
  const height = 3508;
  const brand = accessibleBrandColor(business.brandColor);
  const font = assetFonts();
  const name = fittedName(font.public800, business.name, 84, 54, 1600);
  const initial = firstUsableCharacter(business.name);
  const brandForeground = assetForeground(brand.background);
  const qr = await generateQrPng(business.googleReviewUrl, 562);
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="2480" height="3508" fill="#fffdf6"/>
    <rect width="2480" height="34" fill="${brand.background}"/>
    <circle cx="2010" cy="800" r="500" fill="${rgba(brand.background, 0.075)}"/>
    <circle cx="-70" cy="2310" r="360" fill="${rgba(brand.background, 0.045)}"/>
    <rect x="205" y="210" width="220" height="220" rx="52" fill="${brand.background}"/>
    ${textPath({ fonts: font.public800, value: initial, x: 315, y: 365, size: 110, fill: brandForeground, anchor: "middle" })}
    ${textPath({ fonts: font.public800, value: name.value, x: 477, y: 323, size: name.size, fill: "#171d1a" })}
    ${textPath({ fonts: font.public500, value: "Local service · Local people", x: 477, y: 398, size: 40, fill: "#727a74" })}
    <rect x="205" y="670" width="490" height="68" rx="34" fill="${rgba(brand.background, 0.1)}"/>
    <circle cx="245" cy="704" r="6" fill="${brand.background}"/>
    ${textPath({ fonts: font.mono700, value: "YOUR FEEDBACK MATTERS", x: 276, y: 716, size: 30, fill: brand.background, spacing: 1.6 })}
    ${textPath({ fonts: font.anton, value: "How did", x: 205, y: 1050, size: 270, fill: "#171d1a" })}
    ${textPath({ fonts: font.anton, value: "we do?", x: 205, y: 1309, size: 270, fill: "#171d1a" })}
    ${textPath({ fonts: font.public400, value: "Your review helps future customers choose with confidence —", x: 205, y: 1446, size: 58, fill: "#5f6862" })}
    ${textPath({ fonts: font.public400, value: "and helps our local business grow.", x: 205, y: 1528, size: 58, fill: "#5f6862" })}
    ${starRow(205, 1668, 78, 20, "#ffb020")}
    <rect x="205" y="2374" width="2070" height="830" rx="66" fill="#ffffff" stroke="#e7e5dd" stroke-width="3"/>
    <rect x="310" y="2464" width="650" height="650" rx="50" fill="#ffffff" stroke="#e7e9e7" stroke-width="3"/>
    <image href="data:image/png;base64,${qr.toString("base64")}" x="354" y="2508" width="562" height="562" image-rendering="pixelated"/>
    <circle cx="940" cy="3094" r="58" fill="#ffffff"/>
    <circle cx="940" cy="3094" r="38" fill="${brand.background}"/>
    ${textPath({ fonts: font.anton, value: "Scan to leave a", x: 1080, y: 2640, size: 150, fill: "#171d1a" })}
    ${textPath({ fonts: font.anton, value: "Google review", x: 1080, y: 2787, size: 150, fill: "#171d1a" })}
    ${textPath({ fonts: font.public400, value: "Open your camera, point it at the QR code", x: 1080, y: 2890, size: 42, fill: "#646c67" })}
    ${textPath({ fonts: font.public400, value: "and share your experience.", x: 1080, y: 2951, size: 42, fill: "#646c67" })}
    ${textPath({ fonts: font.mono700, value: "USUALLY TAKES LESS THAN A MINUTE", x: 1080, y: 3061, size: 40, fill: brand.background, spacing: 0.8 })}
    <path d="M1915 3047h52m-18-18 18 18-18 18" fill="none" stroke="${brand.background}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    ${textPath({ fonts: font.public800, value: "Thank you", x: 205, y: 3320, size: 48, fill: "#2d342f" })}
    ${textPath({ fonts: font.public400, value: "for supporting an independent local business.", x: 452, y: 3320, size: 48, fill: "#737b76" })}
    ${textPath({ fonts: font.mono600, value: "REVIEW ON GOOGLE", x: 2275, y: 3320, size: 40, fill: "#737b76", anchor: "end", spacing: 0.8 })}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function generateSocialReviewGraphic(
  business: ReviewAssetBusiness,
) {
  const width = 1200;
  const height = 1200;
  const brand = accessibleBrandColor(business.brandColor);
  const font = assetFonts();
  const name = fittedName(font.public800, business.name, 34, 23, 760);
  const initial = firstUsableCharacter(business.name);
  const qr = await generateQrPng(business.googleReviewUrl, 272);
  const foreground = assetForeground(brand.background);
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1200" fill="${brand.background}"/>
    <circle cx="975" cy="120" r="280" fill="${foreground}" opacity=".085"/>
    <circle cx="-10" cy="1030" r="180" fill="none" stroke="${foreground}" stroke-width="2" opacity=".16"/>
    <rect x="82" y="82" width="78" height="78" rx="19" fill="${foreground}"/>
    ${textPath({ fonts: font.public800, value: initial, x: 121, y: 137, size: 39, fill: brand.background, anchor: "middle" })}
    ${textPath({ fonts: font.public800, value: name.value, x: 184, y: 137, size: name.size, fill: foreground })}
    ${textPath({ fonts: font.mono700, value: "A SMALL FAVOUR, A BIG HELP", x: 82, y: 238, size: 26, fill: foreground, spacing: 1.5 })}
    ${textPath({ fonts: font.anton, value: "Tell us how", x: 82, y: 398, size: 154, fill: foreground })}
    ${textPath({ fonts: font.anton, value: "we did.", x: 82, y: 540, size: 154, fill: foreground })}
    ${textPath({ fonts: font.public400, value: "Your feedback helps our local", x: 82, y: 626, size: 40, fill: foreground })}
    ${textPath({ fonts: font.public400, value: "business keep getting better.", x: 82, y: 680, size: 40, fill: foreground })}
    ${starRow(82, 950, 42, 12, "#ffd45c")}
    ${textPath({ fonts: font.public800, value: "Leave us a", x: 82, y: 1060, size: 50, fill: foreground })}
    ${textPath({ fonts: font.public800, value: "Google review", x: 82, y: 1112, size: 50, fill: foreground })}
    <rect x="788" y="728" width="330" height="390" rx="42" fill="#ffffff"/>
    <image href="data:image/png;base64,${qr.toString("base64")}" x="817" y="757" width="272" height="272" image-rendering="pixelated"/>
    ${textPath({ fonts: font.mono700, value: "SCAN TO REVIEW", x: 953, y: 1080, size: 18, fill: "#171d1a", anchor: "middle", spacing: 0.6 })}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
