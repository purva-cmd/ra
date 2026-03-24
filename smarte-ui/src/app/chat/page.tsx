"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Send, Bot, User, ChevronDown, ChevronUp, Zap, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface ToolCall {
  tool: string;
  input: unknown;
  output: unknown;
  duration: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

const EXAMPLE_PROMPTS = [
  "Enrich John Smith, VP Sales at Salesforce (salesforce.com)",
  "Find 10 CTOs at SaaS companies in the US with 50-200 employees",
  "Who's the buying committee at HubSpot for a CRM deal?",
  "What signals is Stripe showing in the last 30 days?",
  "Get the tech stack for netflix.com",
  "Find fintech companies using Salesforce with 100-500 employees",
];

function ToolCallBadge({ tc, expanded, onToggle }: { tc: ToolCall; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="my-1 border border-gray-200 rounded-lg overflow-hidden text-xs">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-brand-500" />
          <span className="font-mono font-medium text-brand-700">{tc.tool}</span>
          <span className="text-gray-400">{tc.duration}ms</span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {expanded && (
        <div className="bg-white divide-y divide-gray-100">
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Input</p>
            <pre className="text-xs text-gray-700 overflow-x-auto font-mono whitespace-pre-wrap">
              {JSON.stringify(tc.input, null, 2)}
            </pre>
          </div>
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Output</p>
            <pre className="text-xs text-gray-700 overflow-x-auto font-mono whitespace-pre-wrap">
              {JSON.stringify(tc.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());

  const toggleTool = (i: number) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const isUser = msg.role === "user";
  return (
    <div className={clsx("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={clsx(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser ? "bg-brand-600" : "bg-gray-100"
        )}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-600" />}
      </div>

      {/* Content */}
      <div className={clsx("max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {/* Tool calls (assistant only) */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1">
            {msg.toolCalls.map((tc, i) => (
              <ToolCallBadge
                key={i}
                tc={tc}
                expanded={expandedTools.has(i)}
                onToggle={() => toggleTool(i)}
              />
            ))}
          </div>
        )}

        {/* Message text */}
        {msg.content && (
          <div
            className={clsx(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
              isUser
                ? "bg-brand-600 text-white rounded-tr-sm"
                : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
            )}
          >
            {msg.content}
          </div>
        )}

        <p className={clsx("text-[11px] text-gray-400 mt-1", isUser ? "text-right" : "text-left")}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(searchParams.get("prompt") ?? "");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json() as { response: string; toolCalls: ToolCall[] };

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        toolCalls: data.toolCalls,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      toast.error("Failed to get response: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function autoResize() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Claude + SMARTe</h1>
            <p className="text-xs text-gray-400">9 tools · 229M+ contacts · ZoomInfo/Clay-style AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-brand-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">SMARTe AI Assistant</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Ask me anything about contacts, companies, or accounts. I&apos;ll use SMARTe&apos;s 229M+ database to find what you need.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs text-gray-600 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-200 px-3 py-2 rounded-lg transition-colors"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking and using SMARTe tools…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="input w-full resize-none pr-10 py-2.5 min-h-[44px] max-h-[160px] overflow-y-auto leading-normal"
              placeholder="Ask Claude anything about contacts, companies, or accounts… (Enter to send)"
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="btn-primary h-11 px-4 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 text-center">
          Claude will call SMARTe tools automatically. Each enrichment call consumes SMARTe credits.
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
