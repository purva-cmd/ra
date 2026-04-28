// ============================================================
// SMARTe API client for Next.js server-side use
// This runs in API routes — never in the browser
// ============================================================

import type {
  EnrichContactInput,
  EnrichCompanyInput,
  EnrichEmailInput,
  EnrichMobileInput,
  EnrichTechnographicsInput,
  DiscoverContactsInput,
  DiscoverCompaniesInput,
  BuyingGroupMember,
  AccountSignal,
  SmarteErrorResponse,
  SmarteNoMatchResponse,
  EnrichedContact,
  EnrichedCompany,
  DiscoverContactsResponse,
  DiscoverCompaniesResponse,
  BuyingGroupResponse,
  AccountSignalsResponse,
} from "@/types";

const BASE_URL = process.env.SMARTE_BASE_URL ?? "https://api.smarte.pro/v7";

// ── Endpoint paths ────────────────────────────────────────────
const PATHS = {
  enrich: "/enrich",
  discoverContacts: "/discover/contacts",
  discoverCompanies: "/discover/companies",
  buyingGroup: "/agents/buying-group",
  accountSignals: "/agents/account-signals",
} as const;

async function smarteRequest<T>(
  apiKey: string,
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      apikey: apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error(`SMARTe auth error (${response.status}): Invalid API key`);
    }
    if (response.status === 429) {
      throw new Error(`SMARTe rate limit exceeded. Try again later.`);
    }
    throw new Error(`SMARTe API error (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

function normalizeEnrich<T extends object>(
  raw: unknown
): T | SmarteNoMatchResponse {
  if (!raw || typeof raw !== "object") return { matched: false, accuracy: null };
  const r = raw as Record<string, unknown>;
  if (!r.accuracy && !r.contactEmail && !r.compName && !r.compWebAddress) {
    return { matched: false, accuracy: null };
  }
  return { matched: true, ...r } as unknown as T;
}

// ── Enrich API ─────────────────────────────────────────────────

export async function enrichContact(
  apiKey: string,
  params: EnrichContactInput
): Promise<EnrichedContact | SmarteNoMatchResponse | SmarteErrorResponse> {
  try {
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.enrich, params);
    return normalizeEnrich<EnrichedContact>(raw);
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

export async function enrichCompany(
  apiKey: string,
  params: EnrichCompanyInput
): Promise<EnrichedCompany | SmarteNoMatchResponse | SmarteErrorResponse> {
  try {
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.enrich, params);
    return normalizeEnrich<EnrichedCompany>(raw);
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

export async function enrichEmail(
  apiKey: string,
  params: EnrichEmailInput
): Promise<EnrichedContact | SmarteNoMatchResponse | SmarteErrorResponse> {
  try {
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.enrich, params);
    return normalizeEnrich<EnrichedContact>(raw);
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

export async function enrichMobile(
  apiKey: string,
  params: EnrichMobileInput
): Promise<EnrichedContact | SmarteNoMatchResponse | SmarteErrorResponse> {
  try {
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.enrich, params);
    return normalizeEnrich<EnrichedContact>(raw);
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

export async function enrichTechnographics(
  apiKey: string,
  params: EnrichTechnographicsInput
): Promise<EnrichedCompany | SmarteNoMatchResponse | SmarteErrorResponse> {
  try {
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.enrich, params);
    return normalizeEnrich<EnrichedCompany>(raw);
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

// ── Discover API ───────────────────────────────────────────────

export async function discoverContacts(
  apiKey: string,
  params: DiscoverContactsInput
): Promise<DiscoverContactsResponse | SmarteErrorResponse> {
  try {
    const payload = { limit: 10, offset: 0, ...params, limit: Math.min(params.limit ?? 10, 100) };
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.discoverContacts, payload);
    if (Array.isArray(raw)) {
      return { matched: true, total: raw.length, offset: 0, limit: payload.limit, contacts: raw };
    }
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      return {
        matched: true,
        total: (r.total as number) ?? 0,
        offset: (r.offset as number) ?? 0,
        limit: (r.limit as number) ?? payload.limit,
        contacts: (r.contacts ?? r.data ?? []) as DiscoverContactsResponse["contacts"],
      };
    }
    return { matched: true, total: 0, offset: 0, limit: payload.limit, contacts: [] };
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

export async function discoverCompanies(
  apiKey: string,
  params: DiscoverCompaniesInput
): Promise<DiscoverCompaniesResponse | SmarteErrorResponse> {
  try {
    const payload = { limit: 10, offset: 0, ...params, limit: Math.min(params.limit ?? 10, 100) };
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.discoverCompanies, payload);
    if (Array.isArray(raw)) {
      return { matched: true, total: raw.length, offset: 0, limit: payload.limit, companies: raw };
    }
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      return {
        matched: true,
        total: (r.total as number) ?? 0,
        offset: (r.offset as number) ?? 0,
        limit: (r.limit as number) ?? payload.limit,
        companies: (r.companies ?? r.data ?? []) as DiscoverCompaniesResponse["companies"],
      };
    }
    return { matched: true, total: 0, offset: 0, limit: payload.limit, companies: [] };
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

// ── Agents API ─────────────────────────────────────────────────

export async function getBuyingGroup(
  apiKey: string,
  params: { companyDomain: string; companyName?: string; useCase?: string; icp?: { jobFunctions?: string[]; seniorityLevels?: string[] } }
): Promise<BuyingGroupResponse | SmarteErrorResponse> {
  try {
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.buyingGroup, params);
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      matched: true,
      companyDomain: params.companyDomain,
      companyName: (r.companyName as string) ?? params.companyName,
      useCase: (r.useCase as string) ?? params.useCase,
      generatedAt: (r.generatedAt as string) ?? new Date().toISOString(),
      members: (r.members ?? r.data ?? []) as BuyingGroupMember[],
      summary: r.summary as string | undefined,
    };
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}

export async function getAccountSignals(
  apiKey: string,
  params: { companyDomain: string; lookbackDays?: number }
): Promise<AccountSignalsResponse | SmarteErrorResponse> {
  try {
    const payload = { lookbackDays: 30, ...params };
    const raw = await smarteRequest<unknown>(apiKey, "POST", PATHS.accountSignals, payload);
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      matched: true,
      companyDomain: params.companyDomain,
      companyName: r.companyName as string | undefined,
      generatedAt: (r.generatedAt as string) ?? new Date().toISOString(),
      lookbackDays: payload.lookbackDays,
      accountSummary: (r.accountSummary ?? r.summary ?? "") as string,
      buyingStageEstimate: r.buyingStageEstimate as AccountSignalsResponse["buyingStageEstimate"],
      signals: (r.signals ?? r.data ?? []) as AccountSignal[],
      recommendedActions: r.recommendedActions as string[] | undefined,
    };
  } catch (e) {
    return { error: true, code: "API_ERROR", message: String(e) };
  }
}
