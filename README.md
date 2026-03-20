# Request Triage Bot

An AI-powered internal request intake, classification, and routing system built for pharmaceutical companies. Requests are automatically classified by urgency and category using GPT-4o, stored with vector embeddings for semantic similarity search, and routed to the appropriate team via an N8N automation workflow.

## Architecture

```
User submits request → Next.js API → GPT-4o classifies (urgency, category, team)
                                   → text-embedding-3-small generates embedding
                                   → Supabase stores request + embedding
                                   → N8N webhook triggers automation
                                        ├─ CRITICAL/HIGH → escalation path
                                        └─ MEDIUM/LOW → standard path
```

## Key Features

- **AI Classification** — GPT-4o analyzes request content to determine urgency (CRITICAL/HIGH/MEDIUM/LOW), category, and routing team. Detects critical situations from context (patient safety, FDA deadlines, adverse events) even when users don't explicitly flag urgency.
- **Semantic Similarity Search** — Vector embeddings (text-embedding-3-small, 1536 dimensions) enable finding similar past requests using cosine similarity via pgvector.
- **N8N Automation Backbone** — Webhook-triggered workflow routes CRITICAL/HIGH requests through an escalation path and MEDIUM/LOW through standard processing. Extensible with Slack, email, Jira, or any N8N-supported integration.
- **Triage Dashboard** — Filterable table view of all requests with status, urgency, and category filters. Status updates (NEW → IN_PROGRESS → COMPLETED/REJECTED).
- **Smart Intake Form** — Submission form that displays AI classification results and similar past requests immediately after submission.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui (Card, Table, Badge, Input, Textarea, Button, Label) |
| Database | Supabase (PostgreSQL + pgvector with HNSW index) |
| AI | OpenAI GPT-4o (classification), text-embedding-3-small (embeddings) |
| Automation | N8N (webhook-based workflow orchestration) |
| Security | Row Level Security (RLS), server-only admin client, service role separation |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── requests/
│   │   │   ├── route.ts          # POST: submit + classify, GET: list requests
│   │   │   └── [id]/route.ts     # PATCH: update request status
│   │   └── search/route.ts       # POST: semantic similarity search
│   ├── dashboard/page.tsx        # Triage dashboard with filters
│   ├── submit/page.tsx           # Request submission form
│   ├── search/page.tsx           # Semantic search interface
│   ├── page.tsx                  # Landing page
│   └── layout.tsx                # Root layout with navbar
├── components/
│   ├── navbar.tsx                # Navigation bar
│   ├── request-form.tsx          # Smart intake form with AI results
│   ├── request-table.tsx         # Filterable request dashboard table
│   ├── search-panel.tsx          # Semantic search UI with similarity scores
│   └── ui/                      # shadcn/ui components
└── lib/
    ├── types.ts                  # TypeScript types (Request, ClassificationResult, etc.)
    ├── openai.ts                 # AI classification + embedding generation
    ├── supabase.ts               # Browser-only Supabase client (anon key)
    ├── supabase-admin.ts         # Server-only admin client (service role key)
    └── utils.ts                  # Utility functions
supabase-schema.sql               # Database schema (pgvector, RLS, indexes, triggers)
```

## Setup

### Prerequisites

- Node.js 18+
- Supabase project with pgvector enabled
- OpenAI API key
- N8N instance (cloud or self-hosted) — optional

### 1. Install dependencies

```bash
cd request-triage-bot
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/your-webhook-id
```

### 3. Set up the database

Run the contents of `supabase-schema.sql` in the Supabase SQL Editor. This creates:
- `requests` table with pgvector embedding column
- HNSW index for fast vector similarity search
- `match_requests` RPC function for similarity queries
- Row Level Security policies
- Auto-updating `updated_at` trigger

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

### `POST /api/requests`
Submit a new request. The API classifies it with AI, generates an embedding, stores it in Supabase, finds similar past requests, and fires a webhook to N8N.

**Request body:**
```json
{
  "title": "Safety database export failing",
  "description": "The adverse event reporting export has been failing since Monday...",
  "requester_name": "Jane Smith",
  "requester_email": "jane@pharma.com",
  "department": "Medical Affairs"
}
```

**Response (201):**
```json
{
  "success": true,
  "request_id": "uuid",
  "classification": {
    "category": "Tool/Application",
    "urgency": "CRITICAL",
    "routed_team": "IT Operations",
    "ai_summary": "...",
    "reasoning": "..."
  },
  "similar_requests": [...]
}
```

### `GET /api/requests?status=NEW&urgency=CRITICAL`
List requests with optional filters (`status`, `urgency`, `category`).

### `PATCH /api/requests/[id]`
Update a request's status (`NEW`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`).

### `POST /api/search`
Semantic similarity search. Finds past requests similar to a query string.

## AI Urgency Classification

The system detects urgency from **content signals**, not just keywords. A request titled "Update database export" that mentions FDA deadlines in the description will be correctly flagged as CRITICAL.

| Urgency | Triggers |
|---------|----------|
| **CRITICAL** | Patient safety, adverse events, FDA/EMA deadlines, GxP violations, product recalls, data breaches in safety systems |
| **HIGH** | Revenue impact, executive requests, deadlines < 1 week, security incidents, clinical trial risks |
| **MEDIUM** | Important but no immediate deadline, operational improvements |
| **LOW** | Exploratory, nice-to-have, no business pressure |

## N8N Workflow

The N8N workflow receives classified requests via webhook and routes them based on urgency:

```
Webhook (POST) → IF (urgency = CRITICAL OR HIGH)
                    ├─ True  → Escalation actions (alerts, tickets, notifications)
                    └─ False → Standard processing (logging, acknowledgment)
```

The webhook payload includes all classification fields flat on the body:

```json
{
  "request_id": "uuid",
  "title": "...",
  "description": "...",
  "requester_name": "...",
  "requester_email": "...",
  "department": "...",
  "category": "Tool/Application",
  "urgency": "CRITICAL",
  "routed_team": "IT Operations",
  "ai_summary": "...",
  "reasoning": "..."
}
```

**N8N IF node expression:** `{{ $json.body.urgency }}` equals `CRITICAL` (OR) `HIGH`

## Security

- **Client/Server separation**: Browser client uses anon key; API routes use a server-only admin client with `import "server-only"` guard
- **Row Level Security (RLS)**: Enabled on the `requests` table
- **Environment variables**: Secrets stored in `.env.local` (gitignored), template provided in `.env.example`
- **Input validation**: Required fields checked before processing
- **Fire-and-forget webhook**: N8N webhook errors don't block request submission
