// ============================================================
// SMARTe MCP — Enrich Tools
// Wraps the /enrich endpoint as 5 focused MCP tools
// ============================================================

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { SmarteClient } from "../client/smarte.js";
import { EnrichRequest, SmarteErrorResponse } from "../types/index.js";
import {
  SmarteAuthError,
  SmarteRateLimitError,
  SmarteAPIError,
  SmarteServiceError,
} from "../client/smarte.js";

// ── Tool definitions ──────────────────────────────────────────

export const enrichTools: Tool[] = [
  {
    name: "enrich_contact",
    description: `Enrich a person record with professional details, verified email, mobile/direct dial, firmographics, and technographics from SMARTe's 229M+ contact database across 125+ countries.

Works like ZoomInfo's contact enrich — pass what you know about a person and their company, and SMARTe returns a complete profile with accuracy grade (A+, A, B, C).

Best inputs: contactEmail OR (contactFirstName + contactLastName + companyWebAddress)
More fields = higher match accuracy.

Returns: email verification status, mobile/direct dial, job title, seniority, department, company name, industry, employee count, revenue range, technographics, LinkedIn URL, and HQ location.

Use this when: you have a partial contact and want to complete their profile, or when building a prospect list and need full contact details.`,
    inputSchema: {
      type: "object",
      properties: {
        recordId: {
          type: "string",
          description: "Optional internal record ID to correlate responses with your CRM records",
        },
        contactEmail: {
          type: "string",
          description: "Contact's business email address. High-confidence identifier.",
        },
        contactFirstName: {
          type: "string",
          description: "Contact's first name",
        },
        contactLastName: {
          type: "string",
          description: "Contact's last name",
        },
        contactFullName: {
          type: "string",
          description: "Contact's full name (alternative to first + last)",
        },
        contactJobTitle: {
          type: "string",
          description: "Contact's current job title (e.g. 'VP of Sales', 'CTO')",
        },
        contactLinkedInUrl: {
          type: "string",
          description: "Contact's LinkedIn profile URL — highly reliable identifier",
        },
        contactCountry: {
          type: "string",
          description: "Contact's country (ISO-2 code preferred, e.g. 'US', 'GB')",
        },
        companyName: {
          type: "string",
          description: "Name of the company the contact works at",
        },
        companyWebAddress: {
          type: "string",
          description: "Company website domain (e.g. 'salesforce.com'). Strong identifier.",
        },
      },
      additionalProperties: false,
    },
  },

  {
    name: "enrich_company",
    description: `Enrich a company record with firmographics, technographics, financials, corporate hierarchy, and geographic presence.

Works like Clearbit's Company Enrichment — pass a domain or company name and get back a full firmographic profile.

Returns: industry, sub-industry, employee count/range, revenue range, founded year, legal status, company type, NAICS/SIC codes, tech stack, HQ city/state/country, global regions, parent/ultimate parent org.

Use this when: you have a company name or domain and need full firmographic data for account scoring, ICP matching, or routing.`,
    inputSchema: {
      type: "object",
      properties: {
        companyName: {
          type: "string",
          description: "Company name (e.g. 'Salesforce', 'HubSpot Inc.')",
        },
        companyWebAddress: {
          type: "string",
          description: "Company website domain — most reliable identifier (e.g. 'salesforce.com')",
        },
        companyLinkedInUrl: {
          type: "string",
          description: "Company LinkedIn page URL",
        },
        recordId: {
          type: "string",
          description: "Optional internal record ID for correlation",
        },
      },
      additionalProperties: false,
    },
  },

  {
    name: "enrich_email",
    description: `Find and verify a business email address for a specific contact at a company.

Pass the person's name + company domain and SMARTe will return their verified business email if available.

Returns: email address, verification status (verified/catchall/invalid/unknown), and accuracy grade.

Use this when: you have a person's name and company but need their email for outreach.`,
    inputSchema: {
      type: "object",
      properties: {
        contactFirstName: {
          type: "string",
          description: "Contact's first name (required with contactLastName)",
        },
        contactLastName: {
          type: "string",
          description: "Contact's last name (required with contactFirstName)",
        },
        companyWebAddress: {
          type: "string",
          description: "Company domain — required for email lookup (e.g. 'hubspot.com')",
        },
        contactJobTitle: {
          type: "string",
          description: "Job title — improves match accuracy when multiple people share a name",
        },
        contactEmail: {
          type: "string",
          description: "Partial/guessed email to verify (optional)",
        },
      },
      required: ["contactFirstName", "contactLastName", "companyWebAddress"],
      additionalProperties: false,
    },
  },

  {
    name: "enrich_mobile",
    description: `Get direct dial or mobile phone number for a contact.

Enterprise Plus feature — returns mobile and/or direct dial numbers when available.

Returns: contactMobile, contactDirectDial, phoneType (mobile/direct/switchboard/unknown).

Use this when: you need to call a contact directly and have their email or name + company.`,
    inputSchema: {
      type: "object",
      properties: {
        contactEmail: {
          type: "string",
          description: "Contact's email — highest confidence lookup",
        },
        contactFirstName: {
          type: "string",
          description: "Contact's first name (use with lastName + companyWebAddress if no email)",
        },
        contactLastName: {
          type: "string",
          description: "Contact's last name",
        },
        companyWebAddress: {
          type: "string",
          description: "Company domain (e.g. 'stripe.com')",
        },
        contactLinkedInUrl: {
          type: "string",
          description: "LinkedIn URL — alternative high-confidence identifier",
        },
      },
      additionalProperties: false,
    },
  },

  {
    name: "enrich_technographics",
    description: `Get the full technology stack used by a company — tools, platforms, and software.

Works like Clearbit Reveal or BuiltWith — pass a company domain and get back an array of technologies they use, organized by category.

Returns: compTechUsed (array of tech names like 'Salesforce', 'AWS', 'React'), compTechCategories.

Use this when: you want to qualify a prospect based on their tech stack (e.g. find companies using Salesforce before pitching a Salesforce integration).`,
    inputSchema: {
      type: "object",
      properties: {
        companyWebAddress: {
          type: "string",
          description: "Company domain — required (e.g. 'netflix.com')",
        },
        companyName: {
          type: "string",
          description: "Company name — helps resolve ambiguous domains",
        },
      },
      required: ["companyWebAddress"],
      additionalProperties: false,
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────

type ToolResult = { content: Array<{ type: "text"; text: string }> };

function ok(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function handleError(err: unknown): ToolResult {
  if (err instanceof SmarteAuthError) {
    return ok({
      error: true,
      code: err.code,
      message: err.message,
      requestId: err.requestId,
    } satisfies SmarteErrorResponse & { requestId?: string });
  }
  if (err instanceof SmarteRateLimitError) {
    return ok({
      error: true,
      code: err.code,
      message: err.message,
      retryAfter: err.retryAfter,
      requestId: err.requestId,
    } satisfies SmarteErrorResponse & { requestId?: string });
  }
  if (err instanceof SmarteAPIError || err instanceof SmarteServiceError) {
    return ok({
      error: true,
      code: err.code,
      message: err.message,
      requestId: err.requestId,
    } satisfies SmarteErrorResponse & { requestId?: string });
  }
  return ok({
    error: true,
    code: "UNKNOWN",
    message: err instanceof Error ? err.message : String(err),
  } satisfies SmarteErrorResponse);
}

export async function handleEnrichTool(
  toolName: string,
  args: Record<string, unknown>,
  client: SmarteClient
): Promise<ToolResult> {
  const params = args as EnrichRequest;

  try {
    switch (toolName) {
      case "enrich_contact": {
        const result = await client.enrichContact(params);
        return ok(result);
      }

      case "enrich_company": {
        const result = await client.enrichCompany({
          companyName: params.companyName,
          companyWebAddress: params.companyWebAddress,
          companyLinkedInUrl: params.companyLinkedInUrl,
          recordId: params.recordId,
        });
        return ok(result);
      }

      case "enrich_email": {
        const result = await client.enrichEmail({
          contactFirstName: params.contactFirstName,
          contactLastName: params.contactLastName,
          companyWebAddress: params.companyWebAddress,
          contactJobTitle: params.contactJobTitle,
          contactEmail: params.contactEmail,
        });
        return ok(result);
      }

      case "enrich_mobile": {
        const result = await client.enrichMobile({
          contactEmail: params.contactEmail,
          contactFirstName: params.contactFirstName,
          contactLastName: params.contactLastName,
          companyWebAddress: params.companyWebAddress,
          contactLinkedInUrl: params.contactLinkedInUrl,
        });
        return ok(result);
      }

      case "enrich_technographics": {
        const result = await client.enrichTechnographics({
          companyWebAddress: params.companyWebAddress,
          companyName: params.companyName,
        });
        return ok(result);
      }

      default:
        return ok({ error: true, code: "UNKNOWN", message: `Unknown enrich tool: ${toolName}` });
    }
  } catch (err) {
    return handleError(err);
  }
}
