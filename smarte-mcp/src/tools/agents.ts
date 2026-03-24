// ============================================================
// SMARTe MCP — Agents Tools
// Buying Group identification and Account Signals intelligence
// ============================================================

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { SmarteClient } from "../client/smarte.js";
import {
  BuyingGroupRequest,
  AccountSignalsRequest,
  SmarteErrorResponse,
} from "../types/index.js";
import {
  SmarteAuthError,
  SmarteRateLimitError,
  SmarteAPIError,
  SmarteServiceError,
} from "../client/smarte.js";

// ── Tool definitions ──────────────────────────────────────────

export const agentTools: Tool[] = [
  {
    name: "get_buying_group",
    description: `Identify the complete buying committee for a target account — decision-makers, influencers, champions, and evaluators — using AI.

Works like 6sense's Buying Stage AI + ZoomInfo's Scoops — given a company domain and optionally a use case, SMARTe's AI maps the full buying group with roles, confidence scores, and contact details.

Returns: list of buying group members, each with name, title, email, mobile, LinkedIn, role (decision-maker/influencer/champion/evaluator/end-user), confidence score (0-100), and rationale.

Use this when:
- Starting an enterprise deal and need to map the stakeholders ("Who is the buying committee at Salesforce for a data infrastructure purchase?")
- Building multi-threaded outreach — you need all the personas, not just one champion
- Doing account-based marketing (ABM) — identify the whole committee before a campaign

Tip: Follow up with enrich_contact to get verified contact details for each member.`,
    inputSchema: {
      type: "object",
      properties: {
        companyDomain: {
          type: "string",
          description: "Company website domain — required (e.g. 'hubspot.com', 'stripe.com')",
        },
        companyName: {
          type: "string",
          description: "Company name — improves accuracy if domain is ambiguous",
        },
        useCase: {
          type: "string",
          description: "The product/solution category you are selling (e.g. 'CRM software', 'cloud security', 'data warehousing', 'HR software'). Strongly recommended — improves role relevance.",
        },
        icp: {
          type: "object",
          description: "Optional ICP filters to scope the buying group to specific personas",
          properties: {
            jobFunctions: {
              type: "array",
              items: { type: "string" },
              description: 'Job functions to focus on (e.g. ["IT", "Finance", "Operations"])',
            },
            seniorityLevels: {
              type: "array",
              items: { type: "string" },
              description: 'Seniority levels to include (e.g. ["C-Suite", "VP", "Director"])',
            },
          },
          additionalProperties: false,
        },
      },
      required: ["companyDomain"],
      additionalProperties: false,
    },
  },

  {
    name: "get_account_signals",
    description: `Get AI-synthesized account intelligence — what's happening at a company right now and why they may be in-market.

Works like Bombora + G2 Intent rolled into one — pulls funding events, leadership changes, hiring surges, product launches, tech adoptions, partnerships, and more, then synthesizes them into a buying stage estimate and recommended actions.

Returns: account summary, list of signals (each with type, title, summary, date, source, relevance score), buying stage estimate (awareness/consideration/decision), and recommended outreach actions.

Signal types: funding, hiring, leadership_change, product_launch, expansion, tech_adoption, partnership, earnings, intent.

Use this when:
- Prioritizing accounts — focus outreach on accounts showing in-market signals
- Personalizing outreach — reference a recent event that triggered your reach out
- Account reviews — get a quick briefing on what's happening at a target account
- Trigger-based sequences — fire a workflow when a high-value signal appears`,
    inputSchema: {
      type: "object",
      properties: {
        companyDomain: {
          type: "string",
          description: "Company domain — required (e.g. 'databricks.com', 'figma.com')",
        },
        lookbackDays: {
          type: "number",
          description: "How many days back to look for signals (default: 30, range: 7-365)",
          default: 30,
          minimum: 7,
          maximum: 365,
        },
      },
      required: ["companyDomain"],
      additionalProperties: false,
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────

type ToolResult = { content: Array<{ type: "text"; text: string }> };

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handleError(err: unknown): ToolResult {
  if (err instanceof SmarteAuthError) {
    return ok({ error: true, code: err.code, message: err.message, requestId: err.requestId } satisfies SmarteErrorResponse & { requestId?: string });
  }
  if (err instanceof SmarteRateLimitError) {
    return ok({ error: true, code: err.code, message: err.message, retryAfter: err.retryAfter, requestId: err.requestId } satisfies SmarteErrorResponse & { requestId?: string });
  }
  if (err instanceof SmarteAPIError || err instanceof SmarteServiceError) {
    return ok({ error: true, code: err.code, message: err.message, requestId: err.requestId } satisfies SmarteErrorResponse & { requestId?: string });
  }
  return ok({ error: true, code: "UNKNOWN", message: err instanceof Error ? err.message : String(err) } satisfies SmarteErrorResponse);
}

export async function handleAgentTool(
  toolName: string,
  args: Record<string, unknown>,
  client: SmarteClient
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "get_buying_group": {
        const params = args as BuyingGroupRequest;
        const result = await client.getBuyingGroup(params);
        return ok(result);
      }

      case "get_account_signals": {
        const params = args as AccountSignalsRequest;
        const result = await client.getAccountSignals(params);
        return ok(result);
      }

      default:
        return ok({ error: true, code: "UNKNOWN", message: `Unknown agent tool: ${toolName}` });
    }
  } catch (err) {
    return handleError(err);
  }
}
