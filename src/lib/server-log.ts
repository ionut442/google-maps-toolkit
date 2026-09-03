type LogValue = string | number | boolean | null;

function clean(value: LogValue) {
  return typeof value === "string"
    ? value.replace(/[\r\n\t]+/g, " ").slice(0, 240)
    : value;
}

export function logServerEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, LogValue> = {},
) {
  const payload = {
    level,
    event: event.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80),
    at: new Date().toISOString(),
    ...Object.fromEntries(
      Object.entries(details).map(([key, value]) => [key, clean(value)]),
    ),
  };
  console[level](JSON.stringify(payload));
}
