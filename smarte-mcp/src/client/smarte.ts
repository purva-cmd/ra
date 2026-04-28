// ============================================================
// SMARTe HTTP Client
// Handles auth, error mapping, retries, and request logging
// ============================================================

import {
  EnrichRequest,
  EnrichContactResponse,
  EnrichCompanyResponse,
  EnrichEmailResponse,
  EnrichMobileResponse,
  EnrichTechnographicsResponse,
  DiscoverContactsRequest,
  DiscoverContactsResponse,
  DiscoverCompaniesRequest,
  DiscoverCompaniesResponse,
  BuyingGroupRequest,
  BuyingGroupResponse,
  AccountSignalsRequest,
  AccountSignalsResponse,
  SmarteNoMatchResponse,
  RequestOptions,
} from "../types/index.js";

// ── Endpoint paths ────────────────────────────────────────────
// TODO: Verify exact paths against live API docs when accessible
const PATHS = {
  enrich: "/enrich",
  discoverContacts: "/discover/contacts",
  discoverCompanies: "/discover/companies",
  buyingGroup: "/agents/buying-group",
  accountSignals: "/agents/account-signals",
} as const;

// ── Custom error classes ──────────────────────────────────────
export class SmarteAuthError extends Error {
  readonly code = "AUTH_ERROR" as const;
  constructor(message: string, public readonly requestId?: string) {
    super(message);
    this.name = "SmarteAuthError";
  }
}

export class SmarteRateLimitError extends Error {
  readonly code = "RATE_LIMIT" as const;
  constructor(
    message: string,
    public readonly retryAfter: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "SmarteRateLimitError";
  }
}

export class SmarteAPIError extends Error {
  readonly code = "API_ERROR" as const;
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "SmarteAPIError";
  }
}

export class SmarteServiceError extends Error {
  readonly code = "SERVICE_ERROR" as const;
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "SmarteServiceError";
  }
}

// ── Logger ────────────────────────────────────────────────────
const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info").toLowerCase();
const LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function log(level: "debug" | "info" | "warn" | "error", ...args: unknown[]) {
  if ((LEVELS[level] ?? 1) >= (LEVELS[LOG_LEVEL] ?? 1)) {
    const prefix = `[smarte-mcp] [${level.toUpperCase()}]`;
    if (level === "error") console.error(prefix, ...args);
    else console.error(prefix, ...args); // Use stderr so MCP stdio is unaffected
  }
}

// ── Main client class ─────────────────────────────────────────
export class SmarteClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl ?? process.env.SMARTE_BASE_URL ?? "https://api.smarte.pro/v7").replace(
      /\/$/,
      ""
    );
  }

  // ── Core request method with retry logic ───────────────────
  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    opts?: RequestOptions,
    attempt = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const requestId = opts?.requestId ?? `smarte-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    log("debug", `${method} ${url} (attempt ${attempt + 1}) requestId=${requestId}`);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          apikey: this.apiKey,
          "X-Request-Id": requestId,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: opts?.signal,
      });
    } catch (err) {
      throw new SmarteServiceError(
        `Network error reaching SMARTe API: ${err instanceof Error ? err.message : String(err)}`,
        0,
        requestId
      );
    }

    // ── Rate limit: retry with exponential backoff ──────────
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : Math.pow(2, attempt);

      if (attempt < 3) {
        const delayMs = [1000, 2000, 4000][attempt] ?? 4000;
        log("warn", `Rate limited. Retrying in ${delayMs}ms (attempt ${attempt + 1}/3) requestId=${requestId}`);
        await sleep(delayMs);
        return this.request<T>(method, path, body, opts, attempt + 1);
      }

      throw new SmarteRateLimitError(
        `SMARTe rate limit exceeded after 3 retries. requestId=${requestId}`,
        retryAfterSec,
        requestId
      );
    }

    // ── Auth error ──────────────────────────────────────────
    if (response.status === 401 || response.status === 403) {
      throw new SmarteAuthError(
        `SMARTe authentication failed (${response.status}). Check SMARTE_API_KEY. requestId=${requestId}`,
        requestId
      );
    }

    // ── Server errors ───────────────────────────────────────
    if (response.status >= 500) {
      const body = await safeText(response);
      throw new SmarteServiceError(
        `SMARTe service error (${response.status}): ${body}. requestId=${requestId}`,
        response.status,
        requestId
      );
    }

    // ── Client errors ───────────────────────────────────────
    if (response.status >= 400) {
      const body = await safeText(response);
      throw new SmarteAPIError(
        `SMARTe API error (${response.status}): ${body}. requestId=${requestId}`,
        response.status,
        requestId
      );
    }

    // ── Success ─────────────────────────────────────────────
    let data: T;
    try {
      data = (await response.json()) as T;
    } catch {
      throw new SmarteAPIError(
        `Invalid JSON from SMARTe API. requestId=${requestId}`,
        response.status,
        requestId
      );
    }

    // Log accuracy when present
    if (data && typeof data === "object" && "accuracy" in data) {
      log("info", `SMARTe response accuracy=${(data as Record<string, unknown>).accuracy} requestId=${requestId}`);
    }

    return data;
  }

  // ── Normalize raw API response to typed shape ──────────────
  private normalizeEnrichResponse<T extends { accuracy?: string | null }>(
    raw: unknown
  ): T | SmarteNoMatchResponse {
    if (!raw || typeof raw !== "object") {
      return { matched: false, accuracy: null };
    }

    const r = raw as Record<string, unknown>;

    // SMARTe returns null accuracy or empty response when no match
    if (!r.accuracy && !r.contactEmail && !r.compName && !r.compWebAddress) {
      return { matched: false, accuracy: null };
    }

    return { matched: true, ...r } as unknown as T;
  }

  // ── Enrich methods ─────────────────────────────────────────

  async enrichContact(
    params: EnrichRequest,
    opts?: RequestOptions
  ): Promise<EnrichContactResponse | SmarteNoMatchResponse> {
    const raw = await this.request<Record<string, unknown>>("POST", PATHS.enrich, params, opts);
    return this.normalizeEnrichResponse<EnrichContactResponse>(raw);
  }

  async enrichCompany(
    params: EnrichRequest,
    opts?: RequestOptions
  ): Promise<EnrichCompanyResponse | SmarteNoMatchResponse> {
    const raw = await this.request<Record<string, unknown>>("POST", PATHS.enrich, params, opts);
    return this.normalizeEnrichResponse<EnrichCompanyResponse>(raw);
  }

  async enrichEmail(
    params: EnrichRequest,
    opts?: RequestOptions
  ): Promise<EnrichEmailResponse | SmarteNoMatchResponse> {
    const raw = await this.request<Record<string, unknown>>("POST", PATHS.enrich, params, opts);
    return this.normalizeEnrichResponse<EnrichEmailResponse>(raw);
  }

  async enrichMobile(
    params: EnrichRequest,
    opts?: RequestOptions
  ): Promise<EnrichMobileResponse | SmarteNoMatchResponse> {
    const raw = await this.request<Record<string, unknown>>("POST", PATHS.enrich, params, opts);
    return this.normalizeEnrichResponse<EnrichMobileResponse>(raw);
  }

  async enrichTechnographics(
    params: EnrichRequest,
    opts?: RequestOptions
  ): Promise<EnrichTechnographicsResponse | SmarteNoMatchResponse> {
    const raw = await this.request<Record<string, unknown>>("POST", PATHS.enrich, params, opts);
    return this.normalizeEnrichResponse<EnrichTechnographicsResponse>(raw);
  }

  // ── Discover methods ───────────────────────────────────────

  async discoverContacts(
    params: DiscoverContactsRequest,
    opts?: RequestOptions
  ): Promise<DiscoverContactsResponse> {
    // Apply defaults
    const payload: DiscoverContactsRequest = {
      limit: Math.min(params.limit ?? 10, 100),
      offset: 0,
      ...params,
    };

    const raw = await this.request<unknown>("POST", PATHS.discoverContacts, payload, opts);

    if (Array.isArray(raw)) {
      return { matched: true, total: raw.length, offset: payload.offset ?? 0, limit: payload.limit ?? 10, contacts: raw };
    }

    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      return {
        matched: true,
        total: (r.total as number) ?? 0,
        offset: (r.offset as number) ?? 0,
        limit: (r.limit as number) ?? 10,
        contacts: (r.contacts as DiscoverContactsResponse["contacts"]) ?? (r.data as DiscoverContactsResponse["contacts"]) ?? [],
      };
    }

    return { matched: true, total: 0, offset: 0, limit: payload.limit ?? 10, contacts: [] };
  }

  async discoverCompanies(
    params: DiscoverCompaniesRequest,
    opts?: RequestOptions
  ): Promise<DiscoverCompaniesResponse> {
    const payload: DiscoverCompaniesRequest = {
      limit: Math.min(params.limit ?? 10, 100),
      offset: 0,
      ...params,
    };

    const raw = await this.request<unknown>("POST", PATHS.discoverCompanies, payload, opts);

    if (Array.isArray(raw)) {
      return { matched: true, total: raw.length, offset: payload.offset ?? 0, limit: payload.limit ?? 10, companies: raw };
    }

    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      return {
        matched: true,
        total: (r.total as number) ?? 0,
        offset: (r.offset as number) ?? 0,
        limit: (r.limit as number) ?? 10,
        companies: (r.companies as DiscoverCompaniesResponse["companies"]) ?? (r.data as DiscoverCompaniesResponse["companies"]) ?? [],
      };
    }

    return { matched: true, total: 0, offset: 0, limit: payload.limit ?? 10, companies: [] };
  }

  // ── Agents methods ─────────────────────────────────────────

  async getBuyingGroup(
    params: BuyingGroupRequest,
    opts?: RequestOptions
  ): Promise<BuyingGroupResponse> {
    const raw = await this.request<unknown>("POST", PATHS.buyingGroup, params, opts);
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

    return {
      matched: true,
      companyDomain: params.companyDomain,
      companyName: (r.companyName as string) ?? params.companyName,
      useCase: (r.useCase as string) ?? params.useCase,
      generatedAt: (r.generatedAt as string) ?? new Date().toISOString(),
      members: (r.members as BuyingGroupResponse["members"]) ?? (r.data as BuyingGroupResponse["members"]) ?? [],
      summary: r.summary as string | undefined,
    };
  }

  async getAccountSignals(
    params: AccountSignalsRequest,
    opts?: RequestOptions
  ): Promise<AccountSignalsResponse> {
    const payload: AccountSignalsRequest = {
      lookbackDays: 30,
      ...params,
    };

    const raw = await this.request<unknown>("POST", PATHS.accountSignals, payload, opts);
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

    return {
      matched: true,
      companyDomain: params.companyDomain,
      companyName: r.companyName as string | undefined,
      generatedAt: (r.generatedAt as string) ?? new Date().toISOString(),
      lookbackDays: payload.lookbackDays ?? 30,
      accountSummary: (r.accountSummary as string) ?? (r.summary as string) ?? "",
      buyingStageEstimate: r.buyingStageEstimate as AccountSignalsResponse["buyingStageEstimate"],
      signals: (r.signals as AccountSignalsResponse["signals"]) ?? (r.data as AccountSignalsResponse["signals"]) ?? [],
      recommendedActions: r.recommendedActions as string[] | undefined,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "(could not read response body)";
  }
}
