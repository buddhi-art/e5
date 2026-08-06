import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

import path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production'
const allowedOrigins = isDevelopment
  ? ["localhost:3000", "*.github.dev", "*.app.github.dev"]
  : (process.env.NEXT_PUBLIC_SITE_URL ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).host] : [])

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    }
  },
  // Content Security Policy headers for all routes
  async headers() {
    const cspHeader = [
      "default-src 'self'",
       `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
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
         source: "/(.*)",
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
          ...(isDevelopment ? [] : [
            // HSTS: force HTTPS app-wide only in production
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            }
          ]),
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
