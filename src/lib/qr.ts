import QRCode from "qrcode";

export const qrSettings = {
  errorCorrectionLevel: "M" as const,
  margin: 4,
  width: 1024,
  color: { dark: "#111827", light: "#FFFFFFFF" },
};

export async function generateQrPng(
  destination: string,
  width = qrSettings.width,
) {
  return QRCode.toBuffer(destination, { ...qrSettings, width, type: "png" });
}
