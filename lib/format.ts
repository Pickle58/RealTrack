export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatLotSize(value: number, unit: "sqft" | "acres"): string {
  if (unit === "acres") return `${value.toLocaleString("en-US", { maximumFractionDigits: 4 })} ac`;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(timestamp);
}

export function formatPrice(cents: number, currency = "USD"): string {
  const amount = cents / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
  }
}
