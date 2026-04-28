# SMARTe UI

> ZoomInfo/Clay-style B2B intelligence platform — powered by Claude and SMARTe's 229M+ contact database.

A full-stack Next.js application with a ZoomInfo-style interface for:
- **Enriching** contacts and companies
- **Discovering** prospects matching your ICP
- **Mapping** buying committees at target accounts
- **Surfacing** account signals for in-market intelligence
- **Natural language** queries powered by Claude (MCP-style tool use)

---

## Prerequisites

- **Node.js 18+**
- **SMARTe API key** — [app.smarte.pro](https://app.smarte.pro)
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com) (for Claude chat)

---

## Setup

```bash
cd smarte-ui
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
SMARTE_API_KEY=your_smarte_api_key
ANTHROPIC_API_KEY=your_anthropic_key
SMARTE_BASE_URL=https://api.smarte.pro/v7
NEXTAUTH_URL=http://localhost:3000
```

---

## Architecture

```
smarte-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── enrich/page.tsx       # Enrich UI (5 modes)
│   │   ├── discover/page.tsx     # Discover UI (contacts + companies)
│   │   ├── agents/page.tsx       # Agents UI (buying group + signals)
│   │   ├── chat/page.tsx         # Claude AI natural language interface
│   │   ├── settings/page.tsx     # API key configuration
│   │   └── api/
│   │       ├── enrich/route.ts   # Enrich API proxy
│   │       ├── discover/route.ts # Discover API proxy
│   │       ├── agents/route.ts   # Agents API proxy
│   │       └── claude/route.ts   # Claude agentic loop
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   └── ui/
│   │       ├── AccuracyBadge.tsx
│   │       ├── ResultCard.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   └── smarte-client.ts      # Server-side SMARTe API client
│   └── types/index.ts            # Shared TypeScript types
```

---

## Claude Integration

The `/chat` page implements a full agentic loop using Claude claude-opus-4-6 with all 9 SMARTe tools. Claude:

1. Receives a natural language query
2. Decides which SMARTe tool(s) to call
3. Calls the tools via the Next.js API routes
4. Synthesizes results into a human-readable response
5. Suggests follow-up actions

This is equivalent to the MCP tool calls Claude makes in Claude Desktop, but embedded directly in the web app.

---

## Build

```bash
npm run build
npm start
```
