#!/usr/bin/env node
// ============================================================
// SMARTe MCP Server
// B2B data enrichment & prospecting
// Supports --stdio (default) and --http transports
// ============================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import * as dotenv from "dotenv";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SmarteClient } from "./client/smarte.js";
import { enrichTools, handleEnrichTool } from "./tools/enrich.js";
import { discoverTools, handleDiscoverTool } from "./tools/discover.js";
import { agentTools, handleAgentTool } from "./tools/agents.js";
import { authTools, handleAuthTool, SIGNIN_CARD_RESOURCE_URI } from "./tools/auth.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_APP_DIR = path.resolve(__dirname, "..", "dist-app");

// ── Validate required env vars (skip for smarte_login / smarte_authenticate) ─
const apiKey = process.env.SMARTE_API_KEY;
const isAuthOnly = !apiKey || apiKey.trim() === "" || apiKey === "your_smarte_api_key_here";

if (isAuthOnly) {
  console.error(
    "[smarte-mcp] SMARTE_API_KEY not set — only the smarte_login tool will be available.\n" +
    "  Sign in via the smarte_login tool, then set SMARTE_API_KEY and restart."
  );
}

// ── Initialize SMARTe client ───────────────────────────────────
const client = isAuthOnly
  ? null
  : new SmarteClient(apiKey!, process.env.SMARTE_BASE_URL);

// ── Registered UI resources ────────────────────────────────────
const UI_RESOURCES = [
  {
    uri: SIGNIN_CARD_RESOURCE_URI,
    name: "SMARTe Sign In",
    description: "Interactive sign-in card for authenticating with SMARTe",
    mimeType: RESOURCE_MIME_TYPE,
  },
];

// ── All registered tools ───────────────────────────────────────
const allTools = [
  ...authTools,
  ...(isAuthOnly ? [] : [...enrichTools, ...discoverTools, ...agentTools]),
];

const enrichToolNames  = new Set(enrichTools.map((t) => t.name));
const discoverToolNames = new Set(discoverTools.map((t) => t.name));
const agentToolNames   = new Set(agentTools.map((t) => t.name));
const authToolNames    = new Set(authTools.map((t) => t.name));

// ── Create MCP server ──────────────────────────────────────────
const server = new Server(
  { name: "smarte-mcp", version: "1.0.0" },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ── List tools ─────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

// ── Call tool ──────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const typedArgs = args as Record<string, unknown>;

  if (authToolNames.has(name)) {
    return handleAuthTool(name, typedArgs);
  }

  if (isAuthOnly) {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          error: true,
          code: "AUTH_REQUIRED",
          message: "SMARTE_API_KEY is not set. Use the smarte_login tool to authenticate first.",
        }),
      }],
    };
  }

  if (enrichToolNames.has(name)) {
    return handleEnrichTool(name, typedArgs, client!);
  }
  if (discoverToolNames.has(name)) {
    return handleDiscoverTool(name, typedArgs, client!);
  }
  if (agentToolNames.has(name)) {
    return handleAgentTool(name, typedArgs, client!);
  }

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        error: true,
        code: "UNKNOWN",
        message: `Tool not found: ${name}`,
      }),
    }],
  };
});

// ── List resources ─────────────────────────────────────────────
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: UI_RESOURCES,
}));

// ── Read resource (serve bundled HTML) ─────────────────────────
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === SIGNIN_CARD_RESOURCE_URI) {
    const htmlPath = path.join(DIST_APP_DIR, "src", "apps", "signin", "mcp-app.html");
    let html: string;
    try {
      html = await fs.readFile(htmlPath, "utf-8");
    } catch {
      html = fallbackHtml("Sign-in app bundle not found. Run: npm run build:app");
    }
    return {
      contents: [
        {
          uri,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
          _meta: {
            ui: {
              prefersBorder: false,
              csp: {
                connectDomains: ["https://api.smarte.pro", "https://app.smarte.pro", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
              },
            },
          },
        },
      ],
    };
  }

  return { contents: [] };
});

// ── Fallback HTML ──────────────────────────────────────────────
function fallbackHtml(msg: string): string {
  return `<!doctype html><html><body style="font-family:system-ui;padding:20px;color:#dc2626">
    <strong>SMARTe MCP App</strong><br/>${msg}
    </body></html>`;
}

// ── Transport modes ────────────────────────────────────────────
const args = process.argv.slice(2);
const useHttp = args.includes("--http");

async function startStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const names = allTools.map((t) => t.name).join(", ");
  console.error(
    `[smarte-mcp] Running on stdio. ${allTools.length} tools: ${names}`
  );
}

async function startHttp() {
  const { default: express } = await import("express");
  const { default: cors } = await import("cors");
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );

  const app = express();
  app.use(cors());
  app.use(express.json());

  const sessions = new Map<string, InstanceType<typeof StreamableHTTPServerTransport>>();

  app.all("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    let transport: InstanceType<typeof StreamableHTTPServerTransport>;
    if (sessionId && sessions.has(sessionId)) {
      transport = sessions.get(sessionId)!;
    } else {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
      });
      const id = transport.sessionId;
      if (id) sessions.set(id, transport);
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", tools: allTools.length });
  });

  const port = Number(process.env.PORT ?? 3100);
  app.listen(port, () => {
    console.error(`[smarte-mcp] HTTP server on http://localhost:${port}/mcp`);
    console.error(`[smarte-mcp] ${allTools.length} tools: ${allTools.map((t) => t.name).join(", ")}`);
  });
}

// ── Entry point ────────────────────────────────────────────────
(useHttp ? startHttp() : startStdio()).catch((err) => {
  console.error("[smarte-mcp] Fatal startup error:", err);
  process.exit(1);
});
