import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    // Cloudinary is the image host. Add any other CDN hostnames here.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default config;
