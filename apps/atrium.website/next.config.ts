import type { NextConfig } from "next";

// Built as a static site for Hostinger (Apache/LiteSpeed). Redirects such as
// /process -> /services live in public/.htaccess, since a static export has no
// server to run Next.js redirects.
const nextConfig: NextConfig = {
  output: "export",
  // URLs keep no trailing slash (/about), as on Vercel; .htaccess maps them to about.html.
  trailingSlash: false,
  images: {
    // No Next.js image server on static hosting: images load straight from the CDN.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.atriumad.com" },
    ],
  },
};

export default nextConfig;
