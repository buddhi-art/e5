import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.github.dev", // Whitelists all VS Code Port Forwarding tunnels
        "*.app.github.dev"
      ]
    }
  }
};

export default nextConfig;
