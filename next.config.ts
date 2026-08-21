import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
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
