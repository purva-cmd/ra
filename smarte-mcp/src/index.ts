#!/usr/bin/env node
// ============================================================
// SMARTe MCP Server
// B2B data enrichment & prospecting via stdio transport
// ============================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";
import { SmarteClient } from "./client/smarte.js";
import { enrichTools, handleEnrichTool } from "./tools/enrich.js";
import { discoverTools, handleDiscoverTool } from "./tools/discover.js";
import { agentTools, handleAgentTool } from "./tools/agents.js";

// Load .env (safe to call even if no file exists)
dotenv.config();

// ── Validate required env vars ────────────────────────────────
const apiKey = process.env.SMARTE_API_KEY;
if (!apiKey || apiKey.trim() === "" || apiKey === "your_smarte_api_key_here") {
  console.error(
    "[smarte-mcp] FATAL: SMARTE_API_KEY environment variable is missing or not set.\n" +
    "  1. Copy .env.example to .env\n" +
    "  2. Set SMARTE_API_KEY=<your key from https://app.smarte.pro>\n" +
    "  3. Or pass it directly: SMARTE_API_KEY=xxx node dist/index.js"
  );
  process.exit(1);
}

// ── Initialize SMARTe client ───────────────────────────────────
const client = new SmarteClient(apiKey, process.env.SMARTE_BASE_URL);

// ── All registered tools ───────────────────────────────────────
const allTools = [...enrichTools, ...discoverTools, ...agentTools];

// Build a fast lookup set for routing
const enrichToolNames = new Set(enrichTools.map((t) => t.name));
const discoverToolNames = new Set(discoverTools.map((t) => t.name));
const agentToolNames = new Set(agentTools.map((t) => t.name));

// ── Create MCP server ──────────────────────────────────────────
const server = new Server(
  {
    name: "smarte-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── List tools handler ─────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

// ── Call tool handler ──────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const typedArgs = args as Record<string, unknown>;

  if (enrichToolNames.has(name)) {
    return handleEnrichTool(name, typedArgs, client);
  }

  if (discoverToolNames.has(name)) {
    return handleDiscoverTool(name, typedArgs, client);
  }

  if (agentToolNames.has(name)) {
    return handleAgentTool(name, typedArgs, client);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          error: true,
          code: "UNKNOWN",
          message: `Tool not found: ${name}. Available tools: ${allTools.map((t) => t.name).join(", ")}`,
        }),
      },
    ],
  };
});

// ── Start server ───────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    "[smarte-mcp] Server running on stdio transport.\n" +
    `[smarte-mcp] ${allTools.length} tools registered: ${allTools.map((t) => t.name).join(", ")}`
  );
}

main().catch((err) => {
  console.error("[smarte-mcp] Fatal startup error:", err);
  process.exit(1);
});
