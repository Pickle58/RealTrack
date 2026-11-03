import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Clerk's script/frame/connect/image hosts, Cloudflare Turnstile, and the Google Fonts hosts
 * vinext needs because `next/font/google` loads from the CDN at runtime. Clerk's abuse and fraud
 * protection hosts only answer on non-443 ports, hence the trailing `:*`.
 * The production Frontend API host is listed explicitly: it is not covered by the
 * `*.clerk.com` / `*.clerk.accounts.dev` wildcards. `clerk.elderpickle.com` is the
 * production instance's Frontend API (the publishable key decodes to that host).
 */
const productionClerkHost = "https://clerk.elderpickle.com";

const mapTileUrl =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * The tile host is the only third-party image origin this app loads. A malformed value must not
 * take the whole page down, so a bad URL falls back to the development host.
 */
function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "https://tile.openstreetmap.org";
  }
}

const mapTileOrigin = originOf(mapTileUrl);

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://*.clerk.com ${productionClerkHost} https://challenges.cloudflare.com https://*.protect.clerk.com`,
  `connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com ${productionClerkHost} https://clerk-telemetry.com https://*.clerk-telemetry.com https://challenges.cloudflare.com https://*.protect.clerk.com:*${isDevelopment ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  `img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://*.clerk.accounts.dev https://*.clerk.com ${productionClerkHost} ${mapTileOrigin}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "worker-src 'self' blob:",
  `frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com ${productionClerkHost} https://challenges.cloudflare.com https://*.protect.clerk.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Media sends one file per action call, and services/media.ts rejects anything over 10 MB.
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
