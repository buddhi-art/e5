import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.github.dev", // Whitelists all VS Code Port Forwarding tunnels
        "*.app.github.dev"
      ]
    }
  },
  turbopack: {
    root: "/Users/buddhirajgautam/Documents/E5 prop/e5-chronicles"
  }
};

// Wrap with Sentry only if SENTRY_DSN is configured
const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
