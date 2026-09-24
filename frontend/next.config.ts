import type { NextConfig } from "next";

// Security headers posture (docs/SECURITY_SPEC.md §8). Framing denial applies ONLY in
// production so sandboxed/preview iframes keep working during development.
const isProd = process.env.APP_ENV === "production" || process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    const headers: { key: string; value: string }[] = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    if (isProd) {
      headers.push({ key: "X-Frame-Options", value: "DENY" });
      headers.push({
        key: "Content-Security-Policy",
        value: "frame-ancestors 'none'",
      });
      // Full CSP arrives in Stage 21 (report-only first). This minimal production
      // directive covers clickjacking without breaking Next's runtime.
    }
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
