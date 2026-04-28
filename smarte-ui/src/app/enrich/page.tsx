"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserSearch, Building2, Mail, Phone, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";
import { AccuracyBadge } from "@/components/ui/AccuracyBadge";
import { ResultCard, Field, Divider } from "@/components/ui/ResultCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type {
  EnrichedContact,
  EnrichedCompany,
  SmarteNoMatchResponse,
  SmarteErrorResponse,
} from "@/types";

type EnrichType = "contact" | "company" | "email" | "mobile" | "technographics";

const TABS: { id: EnrichType; label: string; icon: React.ElementType }[] = [
  { id: "contact", label: "Contact", icon: UserSearch },
  { id: "company", label: "Company", icon: Building2 },
  { id: "email", label: "Email", icon: Mail },
  { id: "mobile", label: "Mobile", icon: Phone },
  { id: "technographics", label: "Tech Stack", icon: Cpu },
];

type AnyResult = (EnrichedContact | EnrichedCompany | SmarteNoMatchResponse | SmarteErrorResponse) & Record<string, unknown>;

function isError(r: AnyResult): r is SmarteErrorResponse {
  return "error" in r && r.error === true;
}
function isNoMatch(r: AnyResult): r is SmarteNoMatchResponse {
  return "matched" in r && r.matched === false;
}

export default function EnrichPage() {
  const [activeTab, setActiveTab] = useState<EnrichType>("contact");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnyResult | null>(null);
  const [rawVisible, setRawVisible] = useState(false);

  // Form state per tab
  const [contactForm, setContactForm] = useState({
    contactEmail: "", contactFirstName: "", contactLastName: "",
    contactJobTitle: "", companyName: "", companyWebAddress: "", contactLinkedInUrl: "",
  });
  const [companyForm, setCompanyForm] = useState({
    companyName: "", companyWebAddress: "", companyLinkedInUrl: "",
  });
  const [emailForm, setEmailForm] = useState({
    contactFirstName: "", contactLastName: "", companyWebAddress: "", contactJobTitle: "",
  });
  const [mobileForm, setMobileForm] = useState({
    contactEmail: "", contactFirstName: "", contactLastName: "", companyWebAddress: "",
  });
  const [techForm, setTechForm] = useState({ companyWebAddress: "", companyName: "" });

  const getParams = (): Record<string, unknown> => {
    switch (activeTab) {
      case "contact": return Object.fromEntries(Object.entries(contactForm).filter(([, v]) => v));
      case "company": return Object.fromEntries(Object.entries(companyForm).filter(([, v]) => v));
      case "email": return Object.fromEntries(Object.entries(emailForm).filter(([, v]) => v));
      case "mobile": return Object.fromEntries(Object.entries(mobileForm).filter(([, v]) => v));
      case "technographics": return Object.fromEntries(Object.entries(techForm).filter(([, v]) => v));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, params: getParams() }),
      });
      const data = await res.json() as AnyResult;
      setResult(data);
    } catch (err) {
      toast.error("Request failed: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  const r = result as (EnrichedContact & EnrichedCompany & SmarteNoMatchResponse & SmarteErrorResponse & Record<string, unknown>) | null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Enrich</h1>
        <p className="text-gray-500 mt-1">Get verified contact details, firmographics, and technographics.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setResult(null); }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Form */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit} className="card p-5 space-y-3">
            {activeTab === "contact" && (
              <>
                <div><label className="label">Email</label><input className="input" placeholder="john@salesforce.com" value={contactForm.contactEmail} onChange={e => setContactForm(f => ({...f, contactEmail: e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">First Name</label><input className="input" placeholder="John" value={contactForm.contactFirstName} onChange={e => setContactForm(f => ({...f, contactFirstName: e.target.value}))} /></div>
                  <div><label className="label">Last Name</label><input className="input" placeholder="Smith" value={contactForm.contactLastName} onChange={e => setContactForm(f => ({...f, contactLastName: e.target.value}))} /></div>
                </div>
                <div><label className="label">Job Title</label><input className="input" placeholder="VP Sales" value={contactForm.contactJobTitle} onChange={e => setContactForm(f => ({...f, contactJobTitle: e.target.value}))} /></div>
                <div><label className="label">Company</label><input className="input" placeholder="Salesforce" value={contactForm.companyName} onChange={e => setContactForm(f => ({...f, companyName: e.target.value}))} /></div>
                <div><label className="label">Domain</label><input className="input" placeholder="salesforce.com" value={contactForm.companyWebAddress} onChange={e => setContactForm(f => ({...f, companyWebAddress: e.target.value}))} /></div>
                <div><label className="label">LinkedIn URL</label><input className="input" placeholder="linkedin.com/in/..." value={contactForm.contactLinkedInUrl} onChange={e => setContactForm(f => ({...f, contactLinkedInUrl: e.target.value}))} /></div>
              </>
            )}
            {activeTab === "company" && (
              <>
                <div><label className="label">Company Name</label><input className="input" placeholder="Salesforce" value={companyForm.companyName} onChange={e => setCompanyForm(f => ({...f, companyName: e.target.value}))} /></div>
                <div><label className="label">Domain <span className="text-red-400">*</span></label><input className="input" placeholder="salesforce.com" value={companyForm.companyWebAddress} onChange={e => setCompanyForm(f => ({...f, companyWebAddress: e.target.value}))} /></div>
                <div><label className="label">LinkedIn URL</label><input className="input" placeholder="linkedin.com/company/..." value={companyForm.companyLinkedInUrl} onChange={e => setCompanyForm(f => ({...f, companyLinkedInUrl: e.target.value}))} /></div>
              </>
            )}
            {activeTab === "email" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">First Name <span className="text-red-400">*</span></label><input className="input" placeholder="Sarah" value={emailForm.contactFirstName} onChange={e => setEmailForm(f => ({...f, contactFirstName: e.target.value}))} /></div>
                  <div><label className="label">Last Name <span className="text-red-400">*</span></label><input className="input" placeholder="Johnson" value={emailForm.contactLastName} onChange={e => setEmailForm(f => ({...f, contactLastName: e.target.value}))} /></div>
                </div>
                <div><label className="label">Company Domain <span className="text-red-400">*</span></label><input className="input" placeholder="stripe.com" value={emailForm.companyWebAddress} onChange={e => setEmailForm(f => ({...f, companyWebAddress: e.target.value}))} /></div>
                <div><label className="label">Job Title</label><input className="input" placeholder="Head of Marketing" value={emailForm.contactJobTitle} onChange={e => setEmailForm(f => ({...f, contactJobTitle: e.target.value}))} /></div>
              </>
            )}
            {activeTab === "mobile" && (
              <>
                <div><label className="label">Email (preferred)</label><input className="input" placeholder="contact@company.com" value={mobileForm.contactEmail} onChange={e => setMobileForm(f => ({...f, contactEmail: e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">First Name</label><input className="input" placeholder="John" value={mobileForm.contactFirstName} onChange={e => setMobileForm(f => ({...f, contactFirstName: e.target.value}))} /></div>
                  <div><label className="label">Last Name</label><input className="input" placeholder="Smith" value={mobileForm.contactLastName} onChange={e => setMobileForm(f => ({...f, contactLastName: e.target.value}))} /></div>
                </div>
                <div><label className="label">Company Domain</label><input className="input" placeholder="company.com" value={mobileForm.companyWebAddress} onChange={e => setMobileForm(f => ({...f, companyWebAddress: e.target.value}))} /></div>
              </>
            )}
            {activeTab === "technographics" && (
              <>
                <div><label className="label">Company Domain <span className="text-red-400">*</span></label><input className="input" placeholder="netflix.com" value={techForm.companyWebAddress} onChange={e => setTechForm(f => ({...f, companyWebAddress: e.target.value}))} /></div>
                <div><label className="label">Company Name</label><input className="input" placeholder="Netflix" value={techForm.companyName} onChange={e => setTechForm(f => ({...f, companyName: e.target.value}))} /></div>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-1">
              {loading ? <><LoadingSpinner size="sm" /> Enriching…</> : "Enrich"}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="col-span-3">
          {!result && !loading && (
            <div className="card p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <UserSearch className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm">Fill in the form and click Enrich to see results</p>
            </div>
          )}
          {loading && (
            <div className="card p-8 flex items-center justify-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {result && !loading && (
            <div className="space-y-3 animate-fade-in">
              {isError(r!) && (
                <div className="card p-5 border-red-200 bg-red-50">
                  <p className="font-semibold text-red-700">{r!.code}</p>
                  <p className="text-sm text-red-600 mt-1">{r!.message}</p>
                </div>
              )}
              {isNoMatch(r!) && (
                <div className="card p-5 border-yellow-200 bg-yellow-50">
                  <p className="font-semibold text-yellow-700">No match found</p>
                  <p className="text-sm text-yellow-600 mt-1">Try adding more fields (e.g. company domain) to improve match rate.</p>
                </div>
              )}
              {!isError(r!) && !isNoMatch(r!) && r && (
                <>
                  {/* Contact info */}
                  {(r.contactEmail || r.contactFullName || r.contactFirstName) && (
                    <ResultCard
                      title={r.contactFullName ?? `${r.contactFirstName ?? ""} ${r.contactLastName ?? ""}`.trim() || "Contact"}
                      subtitle={r.contactJobTitle ?? undefined}
                      badge={<AccuracyBadge accuracy={(r.accuracy as string | null) as import("@/types").AccuracyGrade} />}
                    >
                      <Field label="Email" value={r.contactEmail as string} />
                      <Field label="Email Status" value={r.contactEmailVerificationStatus as string} />
                      <Field label="Mobile" value={r.contactMobile as string} mono />
                      <Field label="Direct Dial" value={r.contactDirectDial as string} mono />
                      <Field label="Department" value={r.contactDepartment as string} />
                      <Field label="Seniority" value={r.contactSeniority as string} />
                      <Field label="LinkedIn" value={r.contactLinkedIn as string} />
                      <Field label="Country" value={r.contactCountry as string} />
                    </ResultCard>
                  )}

                  {/* Company info */}
                  {(r.compName || r.compWebAddress) && (
                    <ResultCard
                      title={r.compName as string ?? "Company"}
                      subtitle={r.compWebAddress as string}
                      badge={!r.contactEmail ? <AccuracyBadge accuracy={(r.accuracy as string | null) as import("@/types").AccuracyGrade} /> : undefined}
                    >
                      <Field label="Industry" value={r.compIndustry as string} />
                      <Field label="Employees" value={r.compEmpRange as string ?? r.compEmpCount as number} />
                      <Field label="Revenue" value={r.compRevRange as string} />
                      <Field label="Founded" value={r.compFoundedYear as number} />
                      <Field label="Type" value={r.compType as string} />
                      <Field label="HQ" value={[r.compHQCity, r.compHQState, r.compHQCountry].filter(Boolean).join(", ")} />
                      <Divider />
                      <Field label="NAICS" value={r.compNAICSCode as string} mono />
                      <Field label="SIC" value={r.compSICCode as string} mono />
                    </ResultCard>
                  )}

                  {/* Tech stack */}
                  {r.compTechUsed && Array.isArray(r.compTechUsed) && r.compTechUsed.length > 0 && (
                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Technology Stack ({r.compTechUsed.length})</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(r.compTechUsed as string[]).map((tech: string) => (
                          <span key={tech} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw JSON toggle */}
                  <button
                    onClick={() => setRawVisible((v) => !v)}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {rawVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {rawVisible ? "Hide" : "Show"} raw JSON
                  </button>
                  {rawVisible && (
                    <pre className="card p-4 text-xs font-mono text-gray-600 overflow-x-auto bg-gray-50">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
