import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { useApp, App, McpUiHostContext } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import "./mcp-app.css";

// ── Types ────────────────────────────────────────────────────

type AuthResponse =
  | { success: true; apiKey: string; email: string; message: string }
  | { success: false; error: string; hint?: string };

type Phase = "signin" | "loading" | "success" | "error";

// ── Icons ────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L3 6v8l7 4 7-4V6L10 2z" fill="white" fillOpacity="0.9"/>
      <path d="M10 6l-4 2.4v4.8L10 15.6l4-2.4V8.4L10 6z" fill="white" fillOpacity="0.5"/>
      <circle cx="10" cy="10" r="2" fill="white"/>
    </svg>
  );
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
    </svg>
  ) : (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  );
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
    </svg>
  );
}

function AlertIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>
    </svg>
  );
}

// ── Success view ─────────────────────────────────────────────

function SuccessView({
  apiKey,
  email,
  onOpenApp,
}: {
  apiKey: string;
  email: string;
  onOpenApp: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [apiKey]);

  const masked = apiKey.length > 16
    ? apiKey.slice(0, 8) + "•".repeat(Math.min(apiKey.length - 16, 16)) + apiKey.slice(-8)
    : apiKey;

  return (
    <>
      <div className="success-icon">
        <CheckIcon size={24} />
      </div>
      <div className="success-heading">Signed in successfully</div>
      <div className="success-sub">Welcome back, {email}</div>

      <div style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Your API Key</label>
          <div className="api-key-box">
            <span className="api-key-value" title={apiKey}>{masked}</span>
            <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy}>
              {copied ? <CheckIcon size={12} /> : <CopyIcon />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="setup-steps">
          Add to your MCP config or <code>.env</code> file:
          <br />
          <code>SMARTE_API_KEY={masked}</code>
          <br /><br />
          Or restart the MCP server with:
          <br />
          <code>SMARTE_API_KEY=your-key node dist/index.js</code>
        </div>
      </div>

      <button className="btn-secondary" onClick={onOpenApp}>
        <ExternalLinkIcon /> Open SMARTe Dashboard
      </button>
    </>
  );
}

// ── Main sign-in form ─────────────────────────────────────────

function SignInCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phase, setPhase] = useState<Phase>("signin");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorHint, setErrorHint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authedEmail, setAuthedEmail] = useState("");

  const { app, isConnected, error: connectError } = useApp({
    appInfo: { name: "SMARTe Sign In", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (appInstance: App) => {
      // Apply host theme
      appInstance.onhostcontextchanged = (ctx: Partial<McpUiHostContext>) => {
        if (ctx.theme) {
          document.documentElement.setAttribute("data-theme", ctx.theme);
        }
      };
    },
  });

  const openApp = useCallback(() => {
    if (app) {
      app.openLink({ url: "https://app.smarte.pro" }).catch(() => {
        window.open("https://app.smarte.pro", "_blank");
      });
    } else {
      window.open("https://app.smarte.pro", "_blank");
    }
  }, [app]);

  const openSignin = useCallback(() => {
    if (app) {
      app.openLink({ url: "https://app.smarte.pro/signin" }).catch(() => {
        window.open("https://app.smarte.pro/signin", "_blank");
      });
    } else {
      window.open("https://app.smarte.pro/signin", "_blank");
    }
  }, [app]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password) return;
      if (!isConnected || !app) {
        setErrorMsg("Not connected to MCP server. Please try again.");
        setPhase("error");
        return;
      }

      setPhase("loading");
      setErrorMsg("");
      setErrorHint("");

      try {
        const result: CallToolResult = await app.callServerTool({
          name: "smarte_authenticate",
          arguments: { email: email.trim(), password },
        });

        // Parse the text response
        let authRes: { success: boolean; apiKey?: string; error?: string; hint?: string } = {
          success: false,
          error: "Unexpected response from server.",
        };

        for (const block of result.content) {
          if (block.type === "text") {
            try {
              authRes = JSON.parse(block.text);
            } catch {
              authRes = { success: false, error: block.text };
            }
            break;
          }
        }

        if (result.isError) {
          const msg = result.content[0]?.type === "text" ? result.content[0].text : "Authentication failed.";
          setErrorMsg(msg);
          setPhase("error");
          return;
        }

        if (authRes.success && authRes.apiKey) {
          setApiKey(authRes.apiKey);
          setAuthedEmail(email.trim());
          setPhase("success");
        } else {
          setErrorMsg(authRes.error ?? "Authentication failed.");
          setErrorHint(authRes.hint ?? "");
          setPhase("error");
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
        setPhase("error");
      }
    },
    [email, password, app, isConnected]
  );

  const retrySignin = () => {
    setPhase("signin");
    setErrorMsg("");
    setErrorHint("");
    setPassword("");
  };

  return (
    <div className="card">
      {/* Logo */}
      <div className="logo-row">
        <div className="logo-mark">
          <LogoIcon />
        </div>
        <div className="logo-wordmark">
          SMART<span>e</span>
        </div>
        <span className="tagline">B2B Intelligence</span>
      </div>

      {phase === "success" ? (
        <SuccessView apiKey={apiKey} email={authedEmail} onOpenApp={openApp} />
      ) : (
        <>
          <div className="card-title">Welcome back</div>
          <div className="card-subtitle">
            Sign in to your SMARTe account to access the B2B intelligence API.
          </div>

          {connectError && (
            <div className="alert error" style={{ marginBottom: 16 }}>
              <AlertIcon />
              <span>MCP connection failed: {connectError.message}</span>
            </div>
          )}

          {phase === "error" && (
            <div className="alert error" style={{ marginBottom: 16 }}>
              <AlertIcon />
              <div>
                <div>{errorMsg}</div>
                {errorHint && (
                  <div style={{ marginTop: 4, opacity: 0.85 }}>{errorHint}</div>
                )}
              </div>
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={phase === "loading"}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="field-row">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="has-toggle"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={phase === "loading"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  <EyeIcon show={showPw} />
                </button>
              </div>
            </div>

            <div className="forgot-row">
              <button type="button" className="link" onClick={openSignin}>
                Forgot password?
              </button>
            </div>

            {phase === "error" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" className="btn-primary" onClick={retrySignin}>
                  Try again
                </button>
                <button type="button" className="btn-secondary" onClick={openSignin}>
                  <ExternalLinkIcon /> Sign in at app.smarte.pro
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={phase === "loading" || !email.trim() || !password}
              >
                {phase === "loading" ? (
                  <>
                    <span className="spinner" /> Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            )}
          </form>

          <div className="divider" style={{ margin: "20px 0" }}>or</div>

          <button type="button" className="btn-secondary" onClick={openSignin}>
            <ExternalLinkIcon /> Open sign-in page in browser
          </button>

          <div className="card-footer">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="link"
              onClick={() => {
                if (app) {
                  app.openLink({ url: "https://app.smarte.pro/signup" }).catch(() =>
                    window.open("https://app.smarte.pro/signup", "_blank")
                  );
                } else {
                  window.open("https://app.smarte.pro/signup", "_blank");
                }
              }}
            >
              Get started free
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Mount ────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SignInCard />
  </React.StrictMode>
);
