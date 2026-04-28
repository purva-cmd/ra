// ============================================================
// SMARTe MCP — Auth Tools
// Provides a sign-in UI card and server-side authentication
// ============================================================

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const SIGNIN_CARD_RESOURCE_URI = "ui://smarte-signin/mcp-app.html";

// ── Tool definitions ──────────────────────────────────────────

export const authTools: Tool[] = [
  {
    name: "smarte_login",
    description: `Show the SMARTe sign-in card to authenticate and retrieve your API key.

Renders an interactive sign-in form (matching app.smarte.pro/signin) directly inside Claude or ChatGPT.

Use this when: the user doesn't have a SMARTE_API_KEY yet, or wants to sign in to SMARTe from within the chat interface.

After signing in, the card displays the API key with a copy button and setup instructions.`,
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    _meta: {
      ui: {
        resourceUri: SIGNIN_CARD_RESOURCE_URI,
        prefersBorder: false,
      },
      "ui/resourceUri": SIGNIN_CARD_RESOURCE_URI,
    },
  },

  {
    name: "smarte_authenticate",
    description: "Internal tool called by the sign-in UI card to authenticate with the SMARTe API. Do not call this directly.",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "SMARTe account email address",
        },
        password: {
          type: "string",
          description: "SMARTe account password",
        },
      },
      required: ["email", "password"],
      additionalProperties: false,
    },
  },
];

// ── Auth handler ──────────────────────────────────────────────

type AuthResult =
  | { success: true; apiKey: string; email: string; message: string }
  | { success: false; error: string; hint?: string };

export async function handleAuthTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const text = (data: unknown) =>
    ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

  switch (toolName) {
    case "smarte_login": {
      return text({
        message: "SMARTe sign-in card ready. The interactive UI should appear above.",
        hint: "If the UI card does not appear, open https://app.smarte.pro/signin in your browser.",
      });
    }

    case "smarte_authenticate": {
      const email = String(args.email ?? "").trim();
      const password = String(args.password ?? "");

      if (!email || !password) {
        return text({ success: false, error: "Email and password are required." } satisfies AuthResult);
      }

      const result = await authenticateWithSmarte(email, password);
      return text(result);
    }

    default:
      return text({ success: false, error: `Unknown auth tool: ${toolName}` });
  }
}

// ── SMARTe authentication ─────────────────────────────────────

async function authenticateWithSmarte(email: string, password: string): Promise<AuthResult> {
  const BASE = process.env.SMARTE_BASE_URL ?? "https://api.smarte.pro/v7";
  const APP_URL = "https://app.smarte.pro";

  // Attempt 1: JSON API at /v7/user/login
  try {
    const res1 = await fetch(`${BASE}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ emailId: email, password }),
      signal: AbortSignal.timeout(10_000),
    });

    if (res1.ok) {
      const data = await res1.json() as Record<string, unknown>;
      const key = extractApiKey(data);
      if (key) {
        return { success: true, apiKey: key, email, message: "Authenticated successfully." };
      }
    }

    // Attempt 2: /v7/auth/login
    const res2 = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10_000),
    });

    if (res2.ok) {
      const data = await res2.json() as Record<string, unknown>;
      const key = extractApiKey(data);
      if (key) {
        return { success: true, apiKey: key, email, message: "Authenticated successfully." };
      }
    }

    // Attempt 3: Next.js credentials endpoint
    const formData = new URLSearchParams({ email, password, redirect: "false", callbackUrl: "/" });
    const res3 = await fetch(`${APP_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: formData.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    if (res3.ok) {
      const data = await res3.json() as Record<string, unknown>;
      const key = extractApiKey(data);
      if (key) {
        return { success: true, apiKey: key, email, message: "Authenticated successfully." };
      }
    }

    const status = res1.status;
    if (status === 401 || status === 403) {
      return {
        success: false,
        error: "Invalid email or password. Please check your credentials.",
        hint: "Reset your password at https://app.smarte.pro/forgot-password",
      };
    }

    return {
      success: false,
      error: "Unable to authenticate. The sign-in API may have changed.",
      hint: "Sign in at https://app.smarte.pro/signin to get your API key.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timeout") || msg.includes("abort")) {
      return { success: false, error: "Sign-in request timed out. Check your network connection." };
    }
    return {
      success: false,
      error: `Network error: ${msg}`,
      hint: "Sign in at https://app.smarte.pro/signin to get your API key.",
    };
  }
}

function extractApiKey(data: Record<string, unknown>): string | null {
  // Common key field names in B2B SaaS auth responses
  const candidates = ["apiKey", "api_key", "apikey", "token", "accessToken", "access_token", "key"];
  for (const field of candidates) {
    const val = data[field];
    if (typeof val === "string" && val.length > 8) return val;
  }
  // Check nested user/data objects
  for (const wrapper of ["user", "data", "result"]) {
    const nested = data[wrapper];
    if (nested && typeof nested === "object") {
      const key = extractApiKey(nested as Record<string, unknown>);
      if (key) return key;
    }
  }
  return null;
}
