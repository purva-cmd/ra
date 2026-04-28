// ============================================================
// SMARTe MCP — Discover Tools
// Contact and company prospecting / search
// ============================================================

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { SmarteClient } from "../client/smarte.js";
import {
  DiscoverContactsRequest,
  DiscoverCompaniesRequest,
  SmarteErrorResponse,
} from "../types/index.js";
import {
  SmarteAuthError,
  SmarteRateLimitError,
  SmarteAPIError,
  SmarteServiceError,
} from "../client/smarte.js";

// ── Tool definitions ──────────────────────────────────────────

export const discoverTools: Tool[] = [
  {
    name: "discover_contacts",
    description: `Search SMARTe's 229M+ contact database for people matching your Ideal Customer Profile (ICP).

Works like Clay's "Find People" or ZoomInfo's People Search — specify filters for title, seniority, company size, industry, and geography, and get back a list of matching contacts.

Returns: contact names, titles, departments, seniority levels, LinkedIn URLs, company names, industries, employee ranges, and HQ locations.

Use this when:
- You want to build a prospect list from scratch ("Find me 50 VPs of Engineering at Series B fintech companies in the US")
- You're looking for specific personas at target accounts ("Who are the IT Decision Makers at Nike?")
- You need to fill a pipeline with qualified leads matching an ICP

Tip: Combine with enrich_contact to get emails and mobile numbers for the returned contacts.`,
    inputSchema: {
      type: "object",
      properties: {
        jobTitles: {
          type: "array",
          items: { type: "string" },
          description: 'Job title keywords or exact titles (e.g. ["VP Sales", "Head of Revenue", "Chief Revenue Officer"])',
        },
        seniorityLevels: {
          type: "array",
          items: {
            type: "string",
            enum: ["C-Suite", "VP", "Director", "Manager", "Senior", "Individual Contributor"],
          },
          description: 'Seniority filter (e.g. ["VP", "C-Suite"])',
        },
        departments: {
          type: "array",
          items: { type: "string" },
          description: 'Functional departments (e.g. ["Sales", "Engineering", "Marketing", "Finance", "IT", "Operations"])',
        },
        companyNames: {
          type: "array",
          items: { type: "string" },
          description: "Specific company names to search within (e.g. for ABM)",
        },
        companyDomains: {
          type: "array",
          items: { type: "string" },
          description: "Company domains for precise company targeting (e.g. [\"stripe.com\", \"plaid.com\"])",
        },
        industries: {
          type: "array",
          items: { type: "string" },
          description: 'Industry filters (e.g. ["SaaS", "FinTech", "Healthcare", "Manufacturing"])',
        },
        employeeCountMin: {
          type: "number",
          description: "Minimum company employee count (e.g. 50)",
        },
        employeeCountMax: {
          type: "number",
          description: "Maximum company employee count (e.g. 500)",
        },
        revenueRange: {
          type: "string",
          description: 'Annual revenue range filter (e.g. "$10M-$50M", "$1B+")',
        },
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Country filter using ISO-2 codes or full names (e.g. ["US", "GB", "CA"])',
        },
        states: {
          type: "array",
          items: { type: "string" },
          description: 'US state filter (e.g. ["CA", "NY", "TX"])',
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Free-text keywords to match against profiles",
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 10, max: 100)",
          default: 10,
          minimum: 1,
          maximum: 100,
        },
        offset: {
          type: "number",
          description: "Pagination offset — number of results to skip (default: 0)",
          default: 0,
          minimum: 0,
        },
      },
      additionalProperties: false,
    },
  },

  {
    name: "discover_companies",
    description: `Search for companies matching your target account criteria — firmographics, size, industry, geography, and technology stack.

Works like ZoomInfo Company Search or Apollo's Account Search — specify filters and get a list of qualified target accounts.

Returns: company name, domain, industry, employee count/range, revenue range, HQ location, tech stack, and founding year.

Use this when:
- Building a target account list ("Find me 20 healthcare SaaS companies with 100-500 employees in the US")
- Doing technographic prospecting ("Which companies use Salesforce AND are in the financial services space?")
- Researching a market segment before an outbound campaign

Tip: Combine with discover_contacts to find decision-makers at these companies.`,
    inputSchema: {
      type: "object",
      properties: {
        companyNames: {
          type: "array",
          items: { type: "string" },
          description: "Search by specific company names",
        },
        industries: {
          type: "array",
          items: { type: "string" },
          description: 'Industry filters (e.g. ["SaaS", "FinTech", "Healthcare IT", "Retail"])',
        },
        employeeCountMin: {
          type: "number",
          description: "Minimum number of employees",
        },
        employeeCountMax: {
          type: "number",
          description: "Maximum number of employees",
        },
        revenueMin: {
          type: "string",
          description: 'Minimum annual revenue (e.g. "$10M", "$100M")',
        },
        countries: {
          type: "array",
          items: { type: "string" },
          description: 'Countries where HQ is located (e.g. ["US", "UK", "Germany"])',
        },
        technologies: {
          type: "array",
          items: { type: "string" },
          description: 'Technology stack filter — find companies using specific tools (e.g. ["Salesforce", "AWS", "HubSpot"])',
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Free-text keywords matching company descriptions",
        },
        limit: {
          type: "number",
          description: "Number of results to return (default: 10, max: 100)",
          default: 10,
          minimum: 1,
          maximum: 100,
        },
        offset: {
          type: "number",
          description: "Pagination offset (default: 0)",
          default: 0,
          minimum: 0,
        },
      },
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

export async function handleDiscoverTool(
  toolName: string,
  args: Record<string, unknown>,
  client: SmarteClient
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "discover_contacts": {
        const params = args as DiscoverContactsRequest;
        const result = await client.discoverContacts(params);
        return ok(result);
      }

      case "discover_companies": {
        const params = args as DiscoverCompaniesRequest;
        const result = await client.discoverCompanies(params);
        return ok(result);
      }

      default:
        return ok({ error: true, code: "UNKNOWN", message: `Unknown discover tool: ${toolName}` });
    }
  } catch (err) {
    return handleError(err);
  }
}
