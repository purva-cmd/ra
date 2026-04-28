"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users, Activity, ChevronDown, ChevronUp, ExternalLink, TrendingUp, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type {
  BuyingGroupResponse,
  AccountSignalsResponse,
  BuyingGroupMember,
  AccountSignal,
  SmarteErrorResponse,
  BuyingGroupRole,
} from "@/types";

const ROLE_COLORS: Record<BuyingGroupRole, string> = {
  "decision-maker": "bg-red-100 text-red-700 border-red-200",
  "champion": "bg-green-100 text-green-700 border-green-200",
  "influencer": "bg-blue-100 text-blue-700 border-blue-200",
  "evaluator": "bg-purple-100 text-purple-700 border-purple-200",
  "end-user": "bg-gray-100 text-gray-600 border-gray-200",
};

const SIGNAL_COLORS: Record<string, string> = {
  funding: "bg-green-50 text-green-700 border-green-200",
  hiring: "bg-blue-50 text-blue-700 border-blue-200",
  leadership_change: "bg-amber-50 text-amber-700 border-amber-200",
  product_launch: "bg-purple-50 text-purple-700 border-purple-200",
  expansion: "bg-teal-50 text-teal-700 border-teal-200",
  tech_adoption: "bg-indigo-50 text-indigo-700 border-indigo-200",
  partnership: "bg-cyan-50 text-cyan-700 border-cyan-200",
  earnings: "bg-emerald-50 text-emerald-700 border-emerald-200",
  intent: "bg-red-50 text-red-700 border-red-200",
};

type AgentType = "buying-group" | "account-signals";

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<AgentType>("buying-group");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuyingGroupResponse | AccountSignalsResponse | SmarteErrorResponse | null>(null);
  const [rawVisible, setRawVisible] = useState(false);

  // Buying group form
  const [bgDomain, setBgDomain] = useState("");
  const [bgCompany, setBgCompany] = useState("");
  const [bgUseCase, setBgUseCase] = useState("");

  // Signals form
  const [sigDomain, setSigDomain] = useState("");
  const [sigLookback, setSigLookback] = useState("30");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const params =
      activeTab === "buying-group"
        ? { companyDomain: bgDomain, companyName: bgCompany || undefined, useCase: bgUseCase || undefined }
        : { companyDomain: sigDomain, lookbackDays: parseInt(sigLookback) || 30 };

    try {
      const res = await fetch("/api/agents", {
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

  const bgResult = result && !isError(result) && activeTab === "buying-group"
    ? result as BuyingGroupResponse
    : null;
  const sigResult = result && !isError(result) && activeTab === "account-signals"
    ? result as AccountSignalsResponse
    : null;

  const buyingStageColors = {
    awareness: "bg-blue-50 text-blue-700",
    consideration: "bg-amber-50 text-amber-700",
    decision: "bg-red-50 text-red-700",
    unknown: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <p className="text-gray-500 mt-1">AI-powered buying committee mapping and account intelligence.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([
          { id: "buying-group" as const, label: "Buying Group", icon: Users },
          { id: "account-signals" as const, label: "Account Signals", icon: Activity },
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
        {/* Form */}
        <form onSubmit={handleSubmit} className="col-span-2 card p-5 space-y-3 self-start">
          {activeTab === "buying-group" ? (
            <>
              <div>
                <label className="label">Company Domain <span className="text-red-400">*</span></label>
                <input className="input" placeholder="hubspot.com" value={bgDomain} onChange={e => setBgDomain(e.target.value)} required />
              </div>
              <div>
                <label className="label">Company Name</label>
                <input className="input" placeholder="HubSpot" value={bgCompany} onChange={e => setBgCompany(e.target.value)} />
              </div>
              <div>
                <label className="label">Use Case</label>
                <input className="input" placeholder="CRM software, data infrastructure…" value={bgUseCase} onChange={e => setBgUseCase(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">What you&apos;re selling — improves role relevance</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Company Domain <span className="text-red-400">*</span></label>
                <input className="input" placeholder="stripe.com" value={sigDomain} onChange={e => setSigDomain(e.target.value)} required />
              </div>
              <div>
                <label className="label">Lookback Days</label>
                <input type="number" className="input" min={7} max={365} value={sigLookback} onChange={e => setSigLookback(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">How many days back to look for signals (7–365)</p>
              </div>
            </>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? (
              <><LoadingSpinner size="sm" /> Analyzing…</>
            ) : activeTab === "buying-group" ? (
              <><Users className="w-4 h-4" /> Map Buying Group</>
            ) : (
              <><Activity className="w-4 h-4" /> Get Signals</>
            )}
          </button>
        </form>

        {/* Results */}
        <div className="col-span-3">
          {!result && !loading && (
            <div className="card p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              {activeTab === "buying-group"
                ? <Users className="w-10 h-10 mb-3 text-gray-200" />
                : <Activity className="w-10 h-10 mb-3 text-gray-200" />}
              <p className="text-sm">
                {activeTab === "buying-group"
                  ? "Enter a company domain to map their buying committee"
                  : "Enter a company domain to surface in-market signals"}
              </p>
            </div>
          )}
          {loading && (
            <div className="card p-8 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {isError(result) && (
            <div className="card p-5 border-red-200 bg-red-50">
              <p className="font-semibold text-red-700">{result.code}</p>
              <p className="text-sm text-red-600 mt-1">{result.message}</p>
            </div>
          )}

          {bgResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{bgResult.companyName ?? bgResult.companyDomain}</h2>
                    {bgResult.useCase && <p className="text-sm text-gray-500">Use case: {bgResult.useCase}</p>}
                  </div>
                  <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full font-medium">
                    {bgResult.members.length} members
                  </span>
                </div>
                {bgResult.summary && <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">{bgResult.summary}</p>}
              </div>

              {bgResult.members.map((m: BuyingGroupMember, i: number) => (
                <div key={i} className="card p-4 flex gap-3 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-500">
                      {((m.name ?? m.firstName ?? "?")[0]).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{m.name ?? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()}</p>
                        <p className="text-xs text-gray-500">{m.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full border", ROLE_COLORS[m.role] ?? ROLE_COLORS["end-user"])}>
                          {m.role.replace("-", " ").toUpperCase()}
                        </span>
                        {m.linkedIn && (
                          <a href={m.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${m.confidence}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400">{m.confidence}%</span>
                      </div>
                      {m.department && <span className="text-xs text-gray-400">{m.department}</span>}
                    </div>
                    {m.email && <p className="text-xs font-mono text-blue-600 mt-1">{m.email}</p>}
                    {m.rationale && <p className="text-xs text-gray-500 mt-1 italic">{m.rationale}</p>}
                  </div>
                </div>
              ))}

              {bgResult.members.length === 0 && (
                <div className="card p-6 text-center text-gray-400">
                  <p className="text-sm">No buying group members found for this company/use case</p>
                </div>
              )}
            </div>
          )}

          {sigResult && (
            <div className="space-y-3 animate-fade-in">
              <div className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{sigResult.companyName ?? sigResult.companyDomain}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Last {sigResult.lookbackDays} days · {sigResult.signals.length} signals found</p>
                  </div>
                  {sigResult.buyingStageEstimate && (
                    <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full", buyingStageColors[sigResult.buyingStageEstimate])}>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {sigResult.buyingStageEstimate.charAt(0).toUpperCase() + sigResult.buyingStageEstimate.slice(1)}
                    </span>
                  )}
                </div>
                {sigResult.accountSummary && (
                  <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">{sigResult.accountSummary}</p>
                )}
              </div>

              {sigResult.signals.map((s: AccountSignal, i: number) => (
                <div key={i} className="card p-4 flex gap-3">
                  <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded border self-start mt-0.5", SIGNAL_COLORS[s.type] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
                    {s.type.replace("_", " ").toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.summary}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {s.date && <span className="text-[11px] text-gray-400">{new Date(s.date).toLocaleDateString()}</span>}
                      {s.source && <span className="text-[11px] text-gray-400">· {s.source}</span>}
                      <div className="flex items-center gap-1 ml-auto">
                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${s.relevanceScore}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400">{s.relevanceScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sigResult.signals.length === 0 && (
                <div className="card p-6 text-center text-gray-400">
                  <AlertCircle className="w-8 h-8 mb-2 mx-auto text-gray-200" />
                  <p className="text-sm">No signals found in the last {sigResult.lookbackDays} days</p>
                </div>
              )}

              {sigResult.recommendedActions && sigResult.recommendedActions.length > 0 && (
                <div className="card p-4 border-brand-200 bg-brand-50">
                  <p className="text-sm font-semibold text-brand-800 mb-2">Recommended Actions</p>
                  <ul className="space-y-1">
                    {sigResult.recommendedActions.map((action: string, i: number) => (
                      <li key={i} className="text-sm text-brand-700 flex items-start gap-2">
                        <span className="text-brand-400 mt-0.5">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
