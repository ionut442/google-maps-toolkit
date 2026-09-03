export const DEFAULT_BRAND_COLOR = "#2563eb";

type AccessibleBrand = {
  background: string;
  foreground: "#ffffff" | "#111827";
  border: string;
  soft: string;
};

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  );
}

export function accessibleBrandColor(
  value: string | null | undefined,
): AccessibleBrand {
  const candidate = value?.trim().toLowerCase();
  const background =
    candidate && /^#[0-9a-f]{6}$/.test(candidate)
      ? candidate
      : DEFAULT_BRAND_COLOR;
  const lightness = luminance(background);
  const whiteContrast = 1.05 / (lightness + 0.05);
  const blackContrast = (lightness + 0.05) / 0.05;
  return {
    background,
    foreground: whiteContrast >= blackContrast ? "#ffffff" : "#111827",
    border: lightness > 0.85 ? "#667085" : background,
    soft: `${background}18`,
  };
}
