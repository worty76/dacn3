import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "videos.openai.com", // Allow OpenAI domains
      "gateway.pinata.cloud", // For IPFS content
      "ipfs.io", // For IPFS content
      "cloudflare-ipfs.com", // For IPFS content
      "dweb.link", // For IPFS content
      "github.com", // For avatar images
      "avatar.vercel.sh", // For generated avatars
      "placehold.co", // For placeholder images
      "api.qrserver.com", // For QR code generation
    ],
  },
  swcMinify: true,
};

export default nextConfig;
