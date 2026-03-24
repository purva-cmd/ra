"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Key, Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const [smarteKey, setSmarteKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showSmarte, setShowSmarte] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);

  async function testConnection() {
    if (!smarteKey) {
      toast.error("Enter a SMARTe API key first");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-smarte-api-key": smarteKey,
        },
        body: JSON.stringify({
          type: "company",
          params: { companyWebAddress: "salesforce.com" },
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (data.error) {
        setTestResult("error");
        toast.error("Connection failed: " + String(data.message));
      } else {
        setTestResult("ok");
        toast.success("SMARTe API key is valid!");
      }
    } catch (err) {
      setTestResult("error");
      toast.error("Connection failed: " + String(err));
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your API keys and preferences.</p>
      </div>

      <div className="space-y-5">
        {/* SMARTe API Key */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-gray-900">SMARTe API Key</h2>
            <a
              href="https://app.smarte.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-brand-600 hover:underline flex items-center gap-1"
            >
              Get key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="relative">
            <input
              type={showSmarte ? "text" : "password"}
              className="input pr-10"
              placeholder="sk-smarte-..."
              value={smarteKey}
              onChange={(e) => { setSmarteKey(e.target.value); setTestResult(null); }}
            />
            <button
              type="button"
              onClick={() => setShowSmarte((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSmarte ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Used for all enrichment and discovery calls. Stored in your environment (
            <code className="bg-gray-100 px-1 rounded text-gray-600">SMARTE_API_KEY</code>).
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={testConnection}
              disabled={testing || !smarteKey}
              className="btn-secondary"
            >
              {testing ? "Testing…" : "Test Connection"}
            </button>
            {testResult === "ok" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" /> Connected
              </span>
            )}
            {testResult === "error" && (
              <span className="flex items-center gap-1 text-sm text-red-500">
                <XCircle className="w-4 h-4" /> Failed
              </span>
            )}
          </div>
        </div>

        {/* Anthropic API Key */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Anthropic API Key</h2>
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-brand-600 hover:underline flex items-center gap-1"
            >
              Get key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="relative">
            <input
              type={showAnthropic ? "text" : "password"}
              className="input pr-10"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowAnthropic((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Required for the Claude AI chat interface. Uses Claude claude-opus-4-6 for agentic tool calls.
            Stored as <code className="bg-gray-100 px-1 rounded text-gray-600">ANTHROPIC_API_KEY</code>.
          </p>
        </div>

        {/* Environment Setup */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Environment Setup</h2>
          <p className="text-sm text-gray-500 mb-3">
            For production, set these in your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:
          </p>
          <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg font-mono overflow-x-auto">
{`# .env.local
SMARTE_API_KEY=your_smarte_api_key
ANTHROPIC_API_KEY=your_anthropic_key
SMARTE_BASE_URL=https://api.smarte.pro/v7
NEXTAUTH_URL=http://localhost:3000`}
          </pre>
        </div>

        {/* MCP Config */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">MCP Server Config (Claude Desktop)</h2>
          <p className="text-sm text-gray-500 mb-3">
            To use SMARTe tools directly in Claude Desktop, add this to your config:
          </p>
          <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "smarte": {
      "command": "node",
      "args": ["/path/to/smarte-mcp/dist/index.js"],
      "env": {
        "SMARTE_API_KEY": "your_key"
      }
    }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
