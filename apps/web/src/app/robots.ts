import type { MetadataRoute } from "next";

// Keep crawlers out of the admin surface. Enforcement is at the Cloudflare WAF;
// this is the advisory layer for well-behaved bots.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/dashboard",
    },
  };
}
