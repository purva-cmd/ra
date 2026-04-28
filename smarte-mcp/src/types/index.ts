// ============================================================
// SMARTe API — TypeScript Types
// Base URL: https://api.smarte.pro/v7
// ============================================================

// ── Accuracy grades returned by the SMARTe enrichment API ──
export type AccuracyGrade = "A+" | "A" | "B" | "C" | null;

// ── Error shapes ─────────────────────────────────────────────
export interface SmarteErrorResponse {
  error: true;
  code: "AUTH_ERROR" | "RATE_LIMIT" | "API_ERROR" | "SERVICE_ERROR" | "NOT_FOUND" | "UNKNOWN";
  message: string;
  retryAfter?: number;
  requestId?: string;
}

export interface SmarteNoMatchResponse {
  matched: false;
  accuracy: null;
}

// ── Enrich API ────────────────────────────────────────────────

export interface EnrichRequest {
  recordId?: string;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactFullName?: string;
  contactJobTitle?: string;
  contactLinkedInUrl?: string;
  contactCountry?: string;
  companyName?: string;
  companyWebAddress?: string;
  companyLinkedInUrl?: string;
}

export interface EnrichContactResponse {
  matched: true;
  accuracy: AccuracyGrade;
  recordId?: string;
  // Contact identifiers
  contactEmail?: string;
  contactEmailVerificationStatus?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactFullName?: string;
  contactJobTitle?: string;
  contactDepartment?: string;
  contactSeniority?: string;
  contactLinkedIn?: string;
  // Contact reach
  contactMobile?: string;
  contactDirectDial?: string;
  phoneType?: string;
  // Company firmographics
  compName?: string;
  compWebAddress?: string;
  compLinkedIn?: string;
  compIndustry?: string;
  compSubIndustry?: string;
  compEmpCount?: number;
  compEmpRange?: string;
  compRevRange?: string;
  compRevMin?: number;
  compRevMax?: number;
  compFoundedYear?: number;
  compType?: string;
  compLegalStatus?: string;
  // Location
  compHQCity?: string;
  compHQState?: string;
  compHQCountry?: string;
  compHQPostalCode?: string;
  compHQRegion?: string;
  // Hierarchy
  compParentName?: string;
  compParentDomain?: string;
  compUltimateParentName?: string;
  compUltimateParentDomain?: string;
  // Codes
  compNAICSCode?: string;
  compSICCode?: string;
  // Technographics
  compTechUsed?: string[];
  compTechCategories?: string[];
  // Raw response passthrough
  [key: string]: unknown;
}

export interface EnrichCompanyResponse {
  matched: true;
  accuracy: AccuracyGrade;
  compName?: string;
  compWebAddress?: string;
  compLinkedIn?: string;
  compIndustry?: string;
  compSubIndustry?: string;
  compEmpCount?: number;
  compEmpRange?: string;
  compRevRange?: string;
  compRevMin?: number;
  compRevMax?: number;
  compFoundedYear?: number;
  compType?: string;
  compLegalStatus?: string;
  compHQCity?: string;
  compHQState?: string;
  compHQCountry?: string;
  compHQPostalCode?: string;
  compHQRegion?: string;
  compParentName?: string;
  compParentDomain?: string;
  compUltimateParentName?: string;
  compUltimateParentDomain?: string;
  compNAICSCode?: string;
  compSICCode?: string;
  compTechUsed?: string[];
  compTechCategories?: string[];
  globalPresence?: string[];
  [key: string]: unknown;
}

export interface EnrichEmailResponse {
  matched: true;
  accuracy: AccuracyGrade;
  contactEmail?: string;
  contactEmailVerificationStatus?: "verified" | "catchall" | "invalid" | "unknown";
  contactFirstName?: string;
  contactLastName?: string;
  compName?: string;
  compWebAddress?: string;
}

export interface EnrichMobileResponse {
  matched: true;
  accuracy: AccuracyGrade;
  contactMobile?: string;
  contactDirectDial?: string;
  phoneType?: "mobile" | "direct" | "switchboard" | "unknown";
  contactFirstName?: string;
  contactLastName?: string;
  compName?: string;
}

export interface EnrichTechnographicsResponse {
  matched: true;
  accuracy: AccuracyGrade;
  compName?: string;
  compWebAddress?: string;
  compTechUsed: string[];
  compTechCategories: string[];
}

export type EnrichResponse =
  | EnrichContactResponse
  | EnrichCompanyResponse
  | EnrichEmailResponse
  | EnrichMobileResponse
  | EnrichTechnographicsResponse
  | SmarteNoMatchResponse
  | SmarteErrorResponse;

// ── Discover API ──────────────────────────────────────────────

export interface DiscoverContactsRequest {
  jobTitles?: string[];
  seniorityLevels?: string[];
  departments?: string[];
  companyNames?: string[];
  companyDomains?: string[];
  industries?: string[];
  employeeCountMin?: number;
  employeeCountMax?: number;
  revenueRange?: string;
  countries?: string[];
  states?: string[];
  keywords?: string[];
  limit?: number;
  offset?: number;
}

export interface DiscoveredContact {
  contactId?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactFullName?: string;
  contactJobTitle?: string;
  contactDepartment?: string;
  contactSeniority?: string;
  contactLinkedIn?: string;
  contactEmail?: string;
  contactMobile?: string;
  compName?: string;
  compWebAddress?: string;
  compIndustry?: string;
  compEmpRange?: string;
  compHQCountry?: string;
  compHQState?: string;
  accuracy?: AccuracyGrade;
  [key: string]: unknown;
}

export interface DiscoverContactsResponse {
  matched: true;
  total: number;
  offset: number;
  limit: number;
  contacts: DiscoveredContact[];
}

export interface DiscoverCompaniesRequest {
  companyNames?: string[];
  industries?: string[];
  employeeCountMin?: number;
  employeeCountMax?: number;
  revenueMin?: string;
  countries?: string[];
  technologies?: string[];
  keywords?: string[];
  limit?: number;
  offset?: number;
}

export interface DiscoveredCompany {
  compId?: string;
  compName?: string;
  compWebAddress?: string;
  compLinkedIn?: string;
  compIndustry?: string;
  compEmpCount?: number;
  compEmpRange?: string;
  compRevRange?: string;
  compHQCity?: string;
  compHQState?: string;
  compHQCountry?: string;
  compTechUsed?: string[];
  compFoundedYear?: number;
  compType?: string;
  accuracy?: AccuracyGrade;
  [key: string]: unknown;
}

export interface DiscoverCompaniesResponse {
  matched: true;
  total: number;
  offset: number;
  limit: number;
  companies: DiscoveredCompany[];
}

// ── Agents API ────────────────────────────────────────────────

export interface BuyingGroupRequest {
  companyDomain: string;
  companyName?: string;
  useCase?: string;
  icp?: {
    jobFunctions?: string[];
    seniorityLevels?: string[];
  };
}

export type BuyingGroupRole = "decision-maker" | "influencer" | "champion" | "evaluator" | "end-user";

export interface BuyingGroupMember {
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  seniority?: string;
  email?: string;
  mobile?: string;
  linkedIn?: string;
  role: BuyingGroupRole;
  confidence: number; // 0–100
  rationale?: string;
}

export interface BuyingGroupResponse {
  matched: true;
  companyDomain: string;
  companyName?: string;
  useCase?: string;
  generatedAt: string;
  members: BuyingGroupMember[];
  summary?: string;
}

export interface AccountSignalsRequest {
  companyDomain: string;
  lookbackDays?: number;
}

export type SignalType =
  | "funding"
  | "hiring"
  | "leadership_change"
  | "product_launch"
  | "expansion"
  | "tech_adoption"
  | "partnership"
  | "earnings"
  | "intent";

export interface AccountSignal {
  type: SignalType;
  title: string;
  summary: string;
  date?: string;
  source?: string;
  relevanceScore: number; // 0–100
}

export interface AccountSignalsResponse {
  matched: true;
  companyDomain: string;
  companyName?: string;
  generatedAt: string;
  lookbackDays: number;
  accountSummary: string;
  buyingStageEstimate?: "awareness" | "consideration" | "decision" | "unknown";
  signals: AccountSignal[];
  recommendedActions?: string[];
}

// ── Utility types for client ──────────────────────────────────

export interface RequestOptions {
  signal?: AbortSignal;
  requestId?: string;
}

export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";
