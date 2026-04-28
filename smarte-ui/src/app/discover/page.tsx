"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, Users, Search, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type {
  DiscoverContactsInput,
  DiscoverCompaniesInput,
  DiscoverContactsResponse,
  DiscoverCompaniesResponse,
  SmarteErrorResponse,
  DiscoveredContact,
  DiscoveredCompany,
} from "@/types";

type DiscoverType = "contacts" | "companies";

function TagInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  const add = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal("");
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2 mb-1.5">
        <input
          className="input flex-1"
          placeholder={placeholder}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} className="btn-secondary px-3">Add</button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="hover:text-brand-900 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<DiscoverType>("contacts");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    DiscoverContactsResponse | DiscoverCompaniesResponse | SmarteErrorResponse | null
  >(null);
  const [rawVisible, setRawVisible] = useState(false);

  // Contacts form
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [seniorityLevels, setSeniorityLevels] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [companyDomains, setCompanyDomains] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [empMin, setEmpMin] = useState("");
  const [empMax, setEmpMax] = useState("");
  const [limit, setLimit] = useState("10");

  // Companies form
  const [compIndustries, setCompIndustries] = useState<string[]>([]);
  const [compCountries, setCompCountries] = useState<string[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [compEmpMin, setCompEmpMin] = useState("");
  const [compEmpMax, setCompEmpMax] = useState("");
  const [compLimit, setCompLimit] = useState("10");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    let params: DiscoverContactsInput | DiscoverCompaniesInput;
    if (activeTab === "contacts") {
      params = {
        ...(jobTitles.length && { jobTitles }),
        ...(seniorityLevels.length && { seniorityLevels }),
        ...(departments.length && { departments }),
        ...(companyDomains.length && { companyDomains }),
        ...(industries.length && { industries }),
        ...(countries.length && { countries }),
        ...(empMin && { employeeCountMin: parseInt(empMin) }),
        ...(empMax && { employeeCountMax: parseInt(empMax) }),
        limit: parseInt(limit) || 10,
        offset: 0,
      };
    } else {
      params = {
        ...(compIndustries.length && { industries: compIndustries }),
        ...(compCountries.length && { countries: compCountries }),
        ...(technologies.length && { technologies }),
        ...(keywords.length && { keywords }),
        ...(compEmpMin && { employeeCountMin: parseInt(compEmpMin) }),
        ...(compEmpMax && { employeeCountMax: parseInt(compEmpMax) }),
        limit: parseInt(compLimit) || 10,
        offset: 0,
      };
    }

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, params }),
      });
      setResult(await res.json());
    } catch (err) {
      toast.error("Request failed: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  const isError = (r: typeof result): r is SmarteErrorResponse =>
    r !== null && "error" in r && (r as SmarteErrorResponse).error === true;

  const contactResult = result && !isError(result) && activeTab === "contacts"
    ? result as DiscoverContactsResponse
    : null;
  const companyResult = result && !isError(result) && activeTab === "companies"
    ? result as DiscoverCompaniesResponse
    : null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <p className="text-gray-500 mt-1">Search for contacts and companies matching your ICP criteria.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([
          { id: "contacts" as const, label: "Find People", icon: Users },
          { id: "companies" as const, label: "Find Companies", icon: Building2 },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setResult(null); }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Filters */}
        <form onSubmit={handleSubmit} className="col-span-2 space-y-3">
          {activeTab === "contacts" ? (
            <>
              <TagInput label="Job Titles" placeholder="VP Sales" value={jobTitles} onChange={setJobTitles} />
              <TagInput label="Seniority" placeholder="VP" value={seniorityLevels} onChange={setSeniorityLevels} />
              <TagInput label="Departments" placeholder="Sales" value={departments} onChange={setDepartments} />
              <TagInput label="Industries" placeholder="SaaS" value={industries} onChange={setIndustries} />
              <TagInput label="Company Domains" placeholder="stripe.com" value={companyDomains} onChange={setCompanyDomains} />
              <TagInput label="Countries" placeholder="US" value={countries} onChange={setCountries} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Min Employees</label><input type="number" className="input" placeholder="50" value={empMin} onChange={e => setEmpMin(e.target.value)} /></div>
                <div><label className="label">Max Employees</label><input type="number" className="input" placeholder="500" value={empMax} onChange={e => setEmpMax(e.target.value)} /></div>
              </div>
              <div><label className="label">Limit (max 100)</label><input type="number" className="input" value={limit} min={1} max={100} onChange={e => setLimit(e.target.value)} /></div>
            </>
          ) : (
            <>
              <TagInput label="Industries" placeholder="FinTech" value={compIndustries} onChange={setCompIndustries} />
              <TagInput label="Countries" placeholder="US" value={compCountries} onChange={setCompCountries} />
              <TagInput label="Technologies" placeholder="Salesforce" value={technologies} onChange={setTechnologies} />
              <TagInput label="Keywords" placeholder="AI" value={keywords} onChange={setKeywords} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Min Employees</label><input type="number" className="input" placeholder="50" value={compEmpMin} onChange={e => setCompEmpMin(e.target.value)} /></div>
                <div><label className="label">Max Employees</label><input type="number" className="input" placeholder="1000" value={compEmpMax} onChange={e => setCompEmpMax(e.target.value)} /></div>
              </div>
              <div><label className="label">Limit (max 100)</label><input type="number" className="input" value={compLimit} min={1} max={100} onChange={e => setCompLimit(e.target.value)} /></div>
            </>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <><LoadingSpinner size="sm" /> Searching…</> : <><Search className="w-4 h-4" /> Search</>}
          </button>
        </form>

        {/* Results */}
        <div className="col-span-3">
          {!result && !loading && (
            <div className="card p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <Search className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm">Set your filters and click Search</p>
            </div>
          )}
          {loading && (
            <div className="card p-8 flex items-center justify-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {isError(result) && (
            <div className="card p-5 border-red-200 bg-red-50">
              <p className="font-semibold text-red-700">{result.code}</p>
              <p className="text-sm text-red-600 mt-1">{result.message}</p>
            </div>
          )}

          {contactResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Found <span className="font-semibold text-gray-900">{contactResult.total}</span> contacts
                  {" "}· showing {contactResult.contacts.length}
                </p>
              </div>
              {contactResult.contacts.map((c: DiscoveredContact, i: number) => (
                <div key={c.contactId ?? i} className="card p-4 flex gap-3 hover:shadow-sm transition-shadow">
                  <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-700">
                      {(c.contactFirstName?.[0] ?? c.contactFullName?.[0] ?? "?").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {c.contactFullName ?? `${c.contactFirstName ?? ""} ${c.contactLastName ?? ""}`.trim() || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">{c.contactJobTitle}</p>
                      </div>
                      {c.contactLinkedIn && (
                        <a href={c.contactLinkedIn as string} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {c.compName && <span className="text-xs text-gray-600">{c.compName as string}</span>}
                      {c.compIndustry && <span className="text-xs text-gray-400">· {c.compIndustry as string}</span>}
                      {c.compEmpRange && <span className="text-xs text-gray-400">· {c.compEmpRange as string} employees</span>}
                      {c.compHQCountry && <span className="text-xs text-gray-400">· {c.compHQCountry as string}</span>}
                    </div>
                    {c.contactEmail && (
                      <p className="text-xs font-mono text-blue-600 mt-1">{c.contactEmail as string}</p>
                    )}
                  </div>
                </div>
              ))}

              {contactResult.contacts.length === 0 && (
                <div className="card p-6 text-center text-gray-400">
                  <p className="text-sm">No contacts matched your filters</p>
                </div>
              )}
            </div>
          )}

          {companyResult && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-gray-500">
                Found <span className="font-semibold text-gray-900">{companyResult.total}</span> companies
                {" "}· showing {companyResult.companies.length}
              </p>
              {companyResult.companies.map((c: DiscoveredCompany, i: number) => (
                <div key={c.compId ?? i} className="card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{c.compName as string}</p>
                      <p className="text-xs text-blue-600 font-mono">{c.compWebAddress as string}</p>
                    </div>
                    <div className="text-right">
                      {c.compRevRange && <p className="text-xs text-gray-500">{c.compRevRange as string}</p>}
                      {c.compEmpRange && <p className="text-xs text-gray-400">{c.compEmpRange as string} employees</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.compIndustry && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.compIndustry as string}</span>}
                    {c.compHQCountry && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{[c.compHQCity, c.compHQCountry].filter(Boolean).join(", ")}</span>}
                    {c.compFoundedYear && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Est. {c.compFoundedYear as number}</span>}
                  </div>
                  {c.compTechUsed && Array.isArray(c.compTechUsed) && c.compTechUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.compTechUsed as string[]).slice(0, 5).map((t: string) => (
                        <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                      {(c.compTechUsed as string[]).length > 5 && (
                        <span className="text-[10px] text-gray-400">+{(c.compTechUsed as string[]).length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result && !loading && !isError(result) && (
            <>
              <button
                onClick={() => setRawVisible((v) => !v)}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-3"
              >
                {rawVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {rawVisible ? "Hide" : "Show"} raw JSON
              </button>
              {rawVisible && (
                <pre className="card p-4 text-xs font-mono text-gray-600 overflow-x-auto bg-gray-50 mt-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
