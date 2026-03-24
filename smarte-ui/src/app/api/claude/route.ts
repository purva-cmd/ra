import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Tool definitions mirroring the MCP server for the UI chat
const SMARTE_TOOLS: Anthropic.Tool[] = [
  {
    name: "enrich_contact",
    description: "Enrich a person record with email, mobile, firmographics, and technographics from SMARTe's 229M+ contact database.",
    input_schema: {
      type: "object",
      properties: {
        contactEmail: { type: "string", description: "Contact email address" },
        contactFirstName: { type: "string", description: "First name" },
        contactLastName: { type: "string", description: "Last name" },
        contactJobTitle: { type: "string", description: "Job title" },
        contactLinkedInUrl: { type: "string", description: "LinkedIn URL" },
        companyName: { type: "string", description: "Company name" },
        companyWebAddress: { type: "string", description: "Company domain (e.g. salesforce.com)" },
        contactCountry: { type: "string", description: "Contact country" },
      },
    },
  },
  {
    name: "enrich_company",
    description: "Enrich a company with firmographics, technographics, and hierarchy data.",
    input_schema: {
      type: "object",
      properties: {
        companyName: { type: "string", description: "Company name" },
        companyWebAddress: { type: "string", description: "Company domain" },
        companyLinkedInUrl: { type: "string", description: "Company LinkedIn URL" },
      },
    },
  },
  {
    name: "enrich_email",
    description: "Find and verify a business email for a contact.",
    input_schema: {
      type: "object",
      properties: {
        contactFirstName: { type: "string", description: "First name" },
        contactLastName: { type: "string", description: "Last name" },
        companyWebAddress: { type: "string", description: "Company domain" },
        contactJobTitle: { type: "string", description: "Job title (optional)" },
      },
      required: ["contactFirstName", "contactLastName", "companyWebAddress"],
    },
  },
  {
    name: "enrich_mobile",
    description: "Get direct dial / mobile number for a contact.",
    input_schema: {
      type: "object",
      properties: {
        contactEmail: { type: "string", description: "Contact email (preferred)" },
        contactFirstName: { type: "string", description: "First name" },
        contactLastName: { type: "string", description: "Last name" },
        companyWebAddress: { type: "string", description: "Company domain" },
      },
    },
  },
  {
    name: "enrich_technographics",
    description: "Get the technology stack used by a company.",
    input_schema: {
      type: "object",
      properties: {
        companyWebAddress: { type: "string", description: "Company domain (required)" },
        companyName: { type: "string", description: "Company name" },
      },
      required: ["companyWebAddress"],
    },
  },
  {
    name: "discover_contacts",
    description: "Search for people matching ICP criteria — titles, seniority, industry, company size, geography.",
    input_schema: {
      type: "object",
      properties: {
        jobTitles: { type: "array", items: { type: "string" }, description: "Job title filters" },
        seniorityLevels: { type: "array", items: { type: "string" }, description: "Seniority levels" },
        departments: { type: "array", items: { type: "string" }, description: "Departments" },
        companyDomains: { type: "array", items: { type: "string" }, description: "Company domains for ABM" },
        industries: { type: "array", items: { type: "string" }, description: "Industry filters" },
        employeeCountMin: { type: "number", description: "Min employees" },
        employeeCountMax: { type: "number", description: "Max employees" },
        countries: { type: "array", items: { type: "string" }, description: "Countries (ISO-2)" },
        states: { type: "array", items: { type: "string" }, description: "US states" },
        keywords: { type: "array", items: { type: "string" }, description: "Keywords" },
        limit: { type: "number", description: "Results to return (max 100)", default: 10 },
        offset: { type: "number", description: "Pagination offset", default: 0 },
      },
    },
  },
  {
    name: "discover_companies",
    description: "Search for companies matching firmographic criteria — industry, size, revenue, tech stack.",
    input_schema: {
      type: "object",
      properties: {
        industries: { type: "array", items: { type: "string" }, description: "Industries" },
        employeeCountMin: { type: "number", description: "Min employees" },
        employeeCountMax: { type: "number", description: "Max employees" },
        countries: { type: "array", items: { type: "string" }, description: "Countries" },
        technologies: { type: "array", items: { type: "string" }, description: "Tech stack filter" },
        keywords: { type: "array", items: { type: "string" }, description: "Keywords" },
        limit: { type: "number", description: "Results to return (max 100)", default: 10 },
        offset: { type: "number", description: "Pagination offset", default: 0 },
      },
    },
  },
  {
    name: "get_buying_group",
    description: "Identify the buying committee at a target account — decision-makers, influencers, champions.",
    input_schema: {
      type: "object",
      properties: {
        companyDomain: { type: "string", description: "Company domain (required)" },
        companyName: { type: "string", description: "Company name" },
        useCase: { type: "string", description: "What you're selling (e.g. 'CRM software')" },
        icp: {
          type: "object",
          properties: {
            jobFunctions: { type: "array", items: { type: "string" } },
            seniorityLevels: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["companyDomain"],
    },
  },
  {
    name: "get_account_signals",
    description: "Get AI-synthesized account intelligence — in-market signals, buying stage estimate, recommended actions.",
    input_schema: {
      type: "object",
      properties: {
        companyDomain: { type: "string", description: "Company domain (required)" },
        lookbackDays: { type: "number", description: "Days to look back (default: 30)", default: 30 },
      },
      required: ["companyDomain"],
    },
  },
];

const SYSTEM_PROMPT = `You are a B2B sales intelligence assistant powered by SMARTe — a ZoomInfo/Clay-style platform with 229M+ contacts and 60M+ companies.

You help users:
1. **Enrich contacts** — get verified emails, mobile numbers, firmographics
2. **Enrich companies** — get industry, revenue, employee count, tech stack
3. **Discover prospects** — search for people and companies matching ICP criteria
4. **Map buying groups** — identify the full buying committee at a target account
5. **Get account signals** — surface in-market signals and buying stage intelligence

When a user makes a request:
- Use the appropriate SMARTe tool(s) to fulfill it
- If multiple contacts or companies are needed, call tools in sequence
- Present results in a clean, readable format with the most important data highlighted
- Include accuracy grades (A+/A/B/C) when returned — they indicate match confidence
- Suggest logical follow-up actions (e.g. "Want me to get mobile numbers for these contacts?")

Be concise but thorough. Think like a ZoomInfo power user or a Clay operator.`;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlock[];
}

export async function POST(req: NextRequest) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const smarteKey = req.headers.get("x-smarte-api-key") ?? process.env.SMARTE_API_KEY ?? "";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages } = body as { messages: ConversationMessage[] };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing 'messages' array" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  // Agentic loop — Claude calls tools until it reaches a final text response
  const conversationMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content as string,
  }));

  let finalResponse = "";
  const toolCallsLog: Array<{ tool: string; input: unknown; output: unknown; duration: number }> = [];

  let currentMessages = [...conversationMessages];

  for (let iteration = 0; iteration < 10; iteration++) {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: SMARTE_TOOLS,
      messages: currentMessages,
    });

    if (response.stop_reason === "end_turn") {
      // Extract final text
      finalResponse = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((b) => b.text)
        .join("\n");
      break;
    }

    if (response.stop_reason === "tool_use") {
      // Execute tool calls
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      // Add assistant's response to conversation
      currentMessages.push({ role: "assistant", content: response.content });

      // Execute each tool and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const start = Date.now();
        let toolOutput: unknown;

        try {
          toolOutput = await executeSmarteTool(smarteKey, toolUse.name, toolUse.input as Record<string, unknown>);
        } catch (e) {
          toolOutput = { error: true, message: String(e) };
        }

        const duration = Date.now() - start;
        toolCallsLog.push({ tool: toolUse.name, input: toolUse.input, output: toolOutput, duration });

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolOutput, null, 2),
        });
      }

      // Add tool results to conversation
      currentMessages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason
    break;
  }

  return NextResponse.json({
    response: finalResponse,
    toolCalls: toolCallsLog,
  });
}

// ── Execute a SMARTe tool by name ─────────────────────────────
async function executeSmarteTool(
  apiKey: string,
  toolName: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (toolName.startsWith("enrich_")) {
    const typeMap: Record<string, string> = {
      enrich_contact: "contact",
      enrich_company: "company",
      enrich_email: "email",
      enrich_mobile: "mobile",
      enrich_technographics: "technographics",
    };
    const type = typeMap[toolName];
    const res = await fetch(`${baseUrl}/api/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-smarte-api-key": apiKey,
      },
      body: JSON.stringify({ type, params }),
    });
    return res.json();
  }

  if (toolName.startsWith("discover_")) {
    const typeMap: Record<string, string> = {
      discover_contacts: "contacts",
      discover_companies: "companies",
    };
    const type = typeMap[toolName];
    const res = await fetch(`${baseUrl}/api/discover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-smarte-api-key": apiKey,
      },
      body: JSON.stringify({ type, params }),
    });
    return res.json();
  }

  if (toolName === "get_buying_group" || toolName === "get_account_signals") {
    const typeMap: Record<string, string> = {
      get_buying_group: "buying-group",
      get_account_signals: "account-signals",
    };
    const type = typeMap[toolName];
    const res = await fetch(`${baseUrl}/api/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-smarte-api-key": apiKey,
      },
      body: JSON.stringify({ type, params }),
    });
    return res.json();
  }

  return { error: true, message: `Unknown tool: ${toolName}` };
}
