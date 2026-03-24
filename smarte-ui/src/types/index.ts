// ============================================================
// SMARTe UI — Shared TypeScript Types
// ============================================================

export type AccuracyGrade = "A+" | "A" | "B" | "C" | null;

// ── API Error / No-match responses ────────────────────────────
export interface SmarteErrorResponse {
  error: true;
  code: string;
  message: string;
  retryAfter?: number;
}

export interface SmarteNoMatchResponse {
  matched: false;
  accuracy: null;
}

// ── Enrich ────────────────────────────────────────────────────
export interface EnrichContactInput {
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
}

export interface EnrichCompanyInput {
  companyName?: string;
  companyWebAddress?: string;
  companyLinkedInUrl?: string;
  recordId?: string;
}

export interface EnrichEmailInput {
  contactFirstName: string;
  contactLastName: string;
  companyWebAddress: string;
  contactJobTitle?: string;
}

export interface EnrichMobileInput {
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  companyWebAddress?: string;
  contactLinkedInUrl?: string;
}

export interface EnrichTechnographicsInput {
  companyWebAddress: string;
  companyName?: string;
}

export interface EnrichedContact {
  matched: true;
  accuracy: AccuracyGrade;
  contactEmail?: string;
  contactEmailVerificationStatus?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactFullName?: string;
  contactJobTitle?: string;
  contactDepartment?: string;
  contactSeniority?: string;
  contactLinkedIn?: string;
  contactMobile?: string;
  contactDirectDial?: string;
  compName?: string;
  compWebAddress?: string;
  compIndustry?: string;
  compEmpCount?: number;
  compEmpRange?: string;
  compRevRange?: string;
  compHQCity?: string;
  compHQState?: string;
  compHQCountry?: string;
  compTechUsed?: string[];
  [key: string]: unknown;
}

export interface EnrichedCompany {
  matched: true;
  accuracy: AccuracyGrade;
  compName?: string;
  compWebAddress?: string;
  compIndustry?: string;
  compEmpCount?: number;
  compEmpRange?: string;
  compRevRange?: string;
  compHQCity?: string;
  compHQState?: string;
  compHQCountry?: string;
  compFoundedYear?: number;
  compType?: string;
  compNAICSCode?: string;
  compSICCode?: string;
  compTechUsed?: string[];
  compTechCategories?: string[];
  [key: string]: unknown;
}

// ── Discover ──────────────────────────────────────────────────
export interface DiscoverContactsInput {
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
  compName?: string;
  compWebAddress?: string;
  compIndustry?: string;
  compEmpRange?: string;
  compHQCountry?: string;
  [key: string]: unknown;
}

export interface DiscoverContactsResponse {
  matched: true;
  total: number;
  offset: number;
  limit: number;
  contacts: DiscoveredContact[];
}

export interface DiscoverCompaniesInput {
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
  compIndustry?: string;
  compEmpCount?: number;
  compEmpRange?: string;
  compRevRange?: string;
  compHQCity?: string;
  compHQState?: string;
  compHQCountry?: string;
  compTechUsed?: string[];
  compFoundedYear?: number;
  [key: string]: unknown;
}

export interface DiscoverCompaniesResponse {
  matched: true;
  total: number;
  offset: number;
  limit: number;
  companies: DiscoveredCompany[];
}

// ── Agents ────────────────────────────────────────────────────
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
  confidence: number;
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
  relevanceScore: number;
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

// ── Claude Chat ───────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  duration: number;
}

// ── UI State ──────────────────────────────────────────────────
export type ActiveTab = "dashboard" | "enrich" | "discover" | "agents" | "chat";

export interface OrgConfig {
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
}
