# SMARTe MCP Server

> B2B data enrichment and prospecting via the [Model Context Protocol](https://modelcontextprotocol.io/).
> Gives Claude (or any MCP-compatible AI) ZoomInfo/Clay-style access to 229M+ contacts, 60M+ companies across 125+ countries.

---

## Prerequisites

- **Node.js 18+**
- **SMARTe API key** — get one at [app.smarte.pro](https://app.smarte.pro)
- **Claude Desktop** (or any MCP client)

---

## Installation

```bash
git clone <this-repo>
cd smarte-mcp
npm install
npm run build
```

Copy the example env file and add your key:

```bash
cp .env.example .env
# Edit .env and set SMARTE_API_KEY=your_key_here
```

---

## Claude Desktop Configuration

Add the following to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "smarte": {
      "command": "node",
      "args": ["/absolute/path/to/smarte-mcp/dist/index.js"],
      "env": {
        "SMARTE_API_KEY": "your_smarte_api_key_here"
      }
    }
  }
}
```

Replace `/absolute/path/to/smarte-mcp` with the actual path where you cloned this repo.

---

## Available Tools

### Enrich API

| Tool | Description | Key Inputs |
|------|-------------|------------|
| `enrich_contact` | Full contact profile with email, mobile, firmographics | Email or (name + company domain) |
| `enrich_company` | Company firmographics, tech stack, hierarchy | Domain or company name |
| `enrich_email` | Find/verify business email for a person | First + last name + company domain |
| `enrich_mobile` | Get direct dial / mobile number | Email or (name + domain) |
| `enrich_technographics` | Technology stack used by a company | Company domain |

### Discover API

| Tool | Description | Key Inputs |
|------|-------------|------------|
| `discover_contacts` | Search for people matching ICP criteria | Titles, seniority, industry, company size, geo |
| `discover_companies` | Search for companies matching firmographic filters | Industry, size, revenue, tech stack, geo |

### Agents API

| Tool | Description | Key Inputs |
|------|-------------|------------|
| `get_buying_group` | Map the full buying committee at a target account | Company domain + use case |
| `get_account_signals` | AI-synthesized account intelligence & in-market signals | Company domain |

---

## Example Claude Prompts

```
Enrich this contact: John Smith, VP Sales at Salesforce
```

```
Find 20 CTOs at Series B SaaS companies in the US with 50-200 employees
```

```
Who are the buying committee members at HubSpot for a CRM deal?
```

```
What signals is Stripe showing that suggest they're in-market for data infrastructure?
```

```
Get the verified email for Sarah Johnson at stripe.com, she's their Head of Marketing
```

```
What technologies does Databricks use?
```

```
Find 10 VP of Engineering contacts at fintech companies in New York using AWS
```

```
Enrich this company: databricks.com — I need their full firmographic profile
```

---

## Development

```bash
# Run in development mode (ts-node)
npm run dev

# Type-check without building
npm run typecheck

# Build for production
npm run build

# Run built server
npm start
```

---

## Architecture

```
smarte-mcp/
├── src/
│   ├── index.ts          # MCP server entrypoint (stdio transport)
│   ├── tools/
│   │   ├── enrich.ts     # 5 enrich tools + handlers
│   │   ├── discover.ts   # 2 discover tools + handlers
│   │   └── agents.ts     # 2 agents tools + handlers
│   ├── client/
│   │   └── smarte.ts     # SmarteClient — typed HTTP client
│   └── types/
│       └── index.ts      # All TypeScript types
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Accuracy Grades

SMARTe returns an accuracy grade with enrichment results:

| Grade | Meaning |
|-------|---------|
| `A+` | Exact verified match |
| `A` | High-confidence match |
| `B` | Moderate-confidence match |
| `C` | Low-confidence / inferred match |
| `null` | No match found |

---

## Credit Usage

Each enrichment API call consumes SMARTe credits:

- `enrich_contact` — 1 credit per matched record
- `enrich_email` — 1 credit per matched email
- `enrich_mobile` — 1-2 credits per matched mobile/direct dial
- `enrich_company` — 0.5 credits per matched company
- `discover_contacts` — credits based on records returned
- `get_buying_group` — credits based on members returned

Check your usage at [app.smarte.pro](https://app.smarte.pro).

---

## Error Handling

All tools return structured errors — never raw exceptions:

```json
{ "error": true, "code": "RATE_LIMIT", "message": "Rate limit exceeded", "retryAfter": 30 }
{ "error": true, "code": "AUTH_ERROR", "message": "Invalid API key" }
{ "matched": false, "accuracy": null }
```

The client automatically retries on 429 (rate limit) with exponential backoff: 1s → 2s → 4s.

---

## Troubleshooting

**`SMARTE_API_KEY` not set error on startup**
→ Make sure your `.env` file exists and contains `SMARTE_API_KEY=your_actual_key`

**`401 Authentication failed`**
→ Your API key is invalid or expired. Regenerate at [app.smarte.pro](https://app.smarte.pro)

**`{ "matched": false, "accuracy": null }`**
→ No record was found for the inputs provided. Try adding more identifying fields (e.g. add company domain when searching by name).

**Tool not showing in Claude**
→ Restart Claude Desktop after editing the config file. Check the MCP server logs in Claude Desktop settings.

**Rate limit errors**
→ The server automatically retries up to 3 times with backoff. If you consistently hit limits, contact SMARTe to upgrade your plan.

---

## License

MIT
