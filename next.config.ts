import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/ambassadors", destination: "/ambassador", permanent: false },
      { source: "/campus", destination: "/ambassador", permanent: false },
      { source: "/campus-ambassador", destination: "/ambassador", permanent: false },
      { source: "/studios", destination: "/studio", permanent: false },
      { source: "/deliveries", destination: "/delivery", permanent: false },
      { source: "/coupons", destination: "/admin/promos", permanent: false },
      { source: "/promos", destination: "/admin/promos", permanent: false },
    ];
  },
};

export default nextConfig;
