import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 30; // requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

// Validate and sanitize the request body to prevent abuse
function sanitizeBody(body: any): any {
  // Only allow specific Gemini model identifiers
  const ALLOWED_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];

  const model = body?.model;
  if (model && !ALLOWED_MODELS.includes(model)) {
    throw new Error(`Model "${model}" is not allowed. Allowed: ${ALLOWED_MODELS.join(", ")}`);
  }

  // Cap max_tokens to prevent excessive token usage
  const sanitized = { ...body };
  if (sanitized.max_tokens && sanitized.max_tokens > 8192) {
    sanitized.max_tokens = 8192;
  }

  // Strip any non-standard fields Gemini doesn't support
  delete sanitized.parallel_tool_calls;
  delete sanitized.store;

  return sanitized;
}

export async function POST(req: NextRequest) {
  try {
    // ── Authentication ──
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // ── Rate Limiting (per-user) ──
    const { success } = await checkRateLimit(
      `ai:${user.id}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending more requests." },
        { status: 429 }
      );
    }

    // ── Parse & Validate Body ──
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Require at minimum the messages array
    if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'messages' array" },
        { status: 400 }
      );
    }

    // Sanitize: restrict model, cap tokens, strip unsupported fields
    let sanitizedBody: any;
    try {
      sanitizedBody = sanitizeBody(body);
    } catch (sanitizeError: any) {
      return NextResponse.json(
        { error: sanitizeError.message },
        { status: 400 }
      );
    }

    // ── API Key Check ──
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // ── Proxy to Gemini ──
    // Google's official OpenAI-compatible endpoint
    const backendUrl =
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(sanitizedBody),
    });

    const data = await response.json();

    // Pass back the status from Gemini
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(
      "AI Proxy Error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
