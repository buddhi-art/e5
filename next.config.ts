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
  // Content Security Policy headers for all routes
  async headers() {
    const cspHeader = [
      "default-src 'self'",
      // Scripts: allow self, inline for Next.js, and Supabase auth
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: allow self, inline (Tailwind, Framer Motion), and external fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: allow self, data URIs, Supabase storage, and blob URLs (html2canvas)
      "img-src 'self' data: blob: https://*.supabase.co",
      // Fonts: allow self and Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connect: allow Supabase APIs, Gemini AI proxy, Sentry, and Upstash Redis
      "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com wss://*.supabase.co https://*.sentry.io https://*.upstash.io",
      // Media: allow Supabase storage
      "media-src 'self' https://*.supabase.co",
      // Frame ancestors: deny embedding in iframes (clickjacking protection)
      "frame-ancestors 'none'",
      // Form actions: restrict to self
      "form-action 'self'",
      // Base URI: restrict to self
      "base-uri 'self'",
      // Object-src: deny plugins
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/((?!api/ai-proxy).*)", // Apply to all routes except AI proxy
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          // Additional security headers
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // The AI proxy is a JSON API route that never returns HTML, so it gets
        // a locked-down CSP of its own rather than the app-wide policy (which
        // permits inline scripts for Next.js). This closes the previously
        // unprotected attack surface.
        source: "/api/ai-proxy/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
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
