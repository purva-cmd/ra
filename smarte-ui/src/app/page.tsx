import Link from "next/link";
import { UserSearch, Building2, Users, MessageSquare, ArrowRight, Zap, Database, Globe } from "lucide-react";

const features = [
  {
    href: "/enrich",
    icon: UserSearch,
    label: "Enrich",
    color: "bg-blue-50 text-blue-600",
    description: "Enrich contacts & companies with verified email, mobile, firmographics, and tech stack from 229M+ records.",
    tools: ["enrich_contact", "enrich_company", "enrich_email", "enrich_mobile", "enrich_technographics"],
  },
  {
    href: "/discover",
    icon: Building2,
    label: "Discover",
    color: "bg-purple-50 text-purple-600",
    description: "Search for contacts and companies matching your ICP — titles, seniority, industry, size, and geography.",
    tools: ["discover_contacts", "discover_companies"],
  },
  {
    href: "/agents",
    icon: Users,
    label: "Agents",
    color: "bg-amber-50 text-amber-600",
    description: "Map buying committees and surface AI-synthesized account signals to find in-market accounts.",
    tools: ["get_buying_group", "get_account_signals"],
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "Claude AI",
    color: "bg-brand-50 text-brand-600",
    description: "Natural language interface powered by Claude. Describe what you need and Claude handles the rest.",
    tools: ["All 9 SMARTe tools"],
    highlight: true,
  },
];

const stats = [
  { icon: Database, value: "229M+", label: "Contacts" },
  { icon: Building2, value: "60M+", label: "Companies" },
  { icon: Globe, value: "125+", label: "Countries" },
  { icon: Zap, value: "9", label: "MCP Tools" },
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">SMARTe Intelligence Platform</h1>
        <p className="text-gray-500 mt-1">
          ZoomInfo/Clay-style B2B enrichment and prospecting — powered by Claude and SMARTe&apos;s global database.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-4">
        {features.map(({ href, icon: Icon, label, color, description, tools, highlight }) => (
          <Link
            key={href}
            href={href}
            className={`card p-5 hover:shadow-md transition-shadow group ${highlight ? "border-brand-200 bg-gradient-to-br from-brand-50/50 to-white" : ""}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{label}</h2>
                  {highlight && (
                    <span className="text-[10px] bg-brand-600 text-white px-1.5 py-0.5 rounded font-bold">
                      POWERED BY CLAUDE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-snug">{description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tools.map((t) => (
                <span key={t} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:gap-2 transition-all">
              Open {label} <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Start */}
      <div className="mt-8 card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Quick Start — Example Prompts</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            "Enrich John Smith, VP Sales at Salesforce",
            "Find 20 CTOs at Series B SaaS companies in the US",
            "Who is the buying committee at HubSpot for CRM?",
            "What signals is Stripe showing right now?",
            "Get verified email for Sarah Johnson at stripe.com",
            "Find fintech companies using Salesforce with 100-500 employees",
          ].map((prompt) => (
            <Link
              key={prompt}
              href={`/chat?prompt=${encodeURIComponent(prompt)}`}
              className="text-sm text-gray-600 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 px-3 py-2 rounded-lg border border-gray-100 hover:border-brand-200 transition-colors truncate"
            >
              &ldquo;{prompt}&rdquo;
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
