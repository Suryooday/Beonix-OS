<div align="center">

<img src="https://img.shields.io/badge/Beonix-Business%20OS-6366f1?style=for-the-badge&logo=sparkles&logoColor=white" alt="Beonix" />

# Beonix OS

### The AI-Powered Business Operating System for Modern Teams

**One platform. Every business function. Fully automated.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-API-e0234e?style=flat-square&logo=nestjs)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 💡 What is Beonix?

Imagine running your entire business — customer tracking, invoicing, compliance, payments, team workflows, and AI automation — **all from one screen, with one AI assistant at the center.**

That's Beonix.

Most businesses today use 10-15 different apps: a CRM here, an invoice tool there, a separate compliance tracker, a team chat app... and they still end up drowning in spreadsheets. Beonix replaces all of that.

> **Beonix is not a chatbot. It's an operating system for your business — powered by AI.**

---

## ✨ What Can It Actually Do?

### 🤖 AI Assistant — The Brain
Ask it anything about your business. It knows everything.

```
You: "How many leads did we recover this month?"
Beonix: "You recovered 14 leads worth ₹4.2L. Top channel: WhatsApp."

You: "/act send payment reminders to all overdue invoices"
Beonix: "Done. 7 personalized reminders sent via WhatsApp & email."
```

It doesn't just answer — it **acts**. Use commands like:
- `/search` — find anything in your business data
- `/analyze` — get instant business analysis
- `/act` — execute real actions (send reminders, approve payroll, etc.)
- `/workflow` — trigger automated workflows

---

### 📋 CRM & Lead Recovery
Stop losing customers you already paid to acquire.

- **Visual pipeline** — drag leads through deal stages
- **AI lead scoring** — automatically ranks leads by conversion probability
- **Recovery workflows** — auto-follows up on cold or at-risk leads
- **Activity timeline** — full history of every interaction

---

### 🧠 Memory Engine
Your business has a long-term memory now.

- Upload contracts, SOPs, meeting notes, policies — any document
- **Ask questions** and get answers pulled from your own documents
- AI remembers past conversations and decisions
- Never lose institutional knowledge again

---

### ⚙️ Operations & Workflows
Automate the repetitive stuff.

- Build multi-step workflows with a visual drag-and-drop editor
- Trigger workflows based on events (new lead, overdue invoice, deadline)
- Run workflows manually or on a schedule
- Track every execution with full logs

---

### 💰 Capital — Finance Made Simple
Your financial command center.

- **Invoice management** — create, track, and chase overdue invoices automatically
- **GST payments** — submit tax filings directly from the platform
- **Payroll approvals** — one-click approval with full audit trail
- **Dunning workflows** — AI sends escalating payment reminders so you don't have to
- **Transaction history** — everything recorded and searchable

---

### 📜 Compliance
Never miss a deadline or regulatory notice again.

- Tracks GST, MCA, and other regulatory deadlines
- AI flags risks before they become fines
- Stores all compliance documents in one place
- Real-time risk exposure dashboard

---

### 🔌 Integrations
Connect the tools you already use.

| Integration | What it enables |
|-------------|----------------|
| **Google Gemini** | Primary AI reasoning engine |
| **Groq** | Fast AI inference for real-time responses |
| **Twilio** | WhatsApp & SMS outreach |
| **Stripe** | Payment processing |
| **Google Drive** | Document sync |

---

### 🔔 Real-Time Notifications
Everything updates live — no refresh needed.

- Instant alerts when a lead closes, invoice is paid, or workflow runs
- Priority-based notification system (Low → Critical)
- Delivered via WebSocket — appears on screen the moment it happens

---

## 🏗️ How It's Built (For Developers)

Beonix is a **TypeScript monorepo** built with modern, production-grade technology.

```
beonix/
├── apps/
│   ├── web/          → Next.js 15 frontend (React, TanStack Query, Zustand)
│   └── api/          → NestJS backend (REST API + WebSocket gateway)
├── packages/
│   ├── database/     → Prisma ORM + PostgreSQL schema
│   └── schemas/      → Shared Zod validation schemas
└── docker/           → Production Docker & Nginx config
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TanStack Query, Zustand |
| **Backend** | NestJS, Prisma ORM, Socket.IO |
| **Database** | PostgreSQL 15, Redis 7 |
| **Vector Memory** | Qdrant (semantic search) |
| **Auth** | Clerk (multi-tenant, SSO, MFA) |
| **AI** | Google Gemini, Groq |
| **Queue** | BullMQ (async job processing) |
| **Deployment** | Docker Compose, Nginx reverse proxy |
| **Build System** | Turborepo (monorepo caching) |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:
- [Node.js 20+](https://nodejs.org)
- [pnpm 9+](https://pnpm.io) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the database)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/Suryooday/Beonix-OS.git
cd Beonix-OS
```

---

### Step 2 — Set up environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Open `.env` and fill in:

```ini
# Database (leave as-is for local Docker setup)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beonix"
REDIS_URL="redis://:redispassword@localhost:6379"

# Auth — get from https://clerk.com (free account)
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# AI — get from https://aistudio.google.com (free)
GEMINI_API_KEY=AIza...

# Optional but recommended
GROQ_API_KEY=gsk_...          # https://console.groq.com (free)
```

---

### Step 3 — Start the database

```bash
docker compose -f docker-compose.production.yml up postgres redis -d
```

---

### Step 4 — Install dependencies

```bash
pnpm install
```

---

### Step 5 — Set up the database schema

```bash
pnpm --filter database db:push
```

---

### Step 6 — Start the development servers

```bash
pnpm dev
```

This starts:
- **Frontend** → [http://localhost:3000](http://localhost:3000)
- **API** → [http://localhost:3001](http://localhost:3001)

---

## 🐳 Production Deployment (Docker)

To run the full production stack (frontend + API + database + Nginx):

```bash
docker compose -f docker-compose.production.yml up --build -d
```

The app will be available at `http://localhost` (port 80).

---

## 📁 Key Files & Folders

| Path | What it is |
|------|-----------|
| `apps/web/app/(dashboard)/` | All dashboard pages (CRM, Capital, etc.) |
| `apps/web/hooks/useDashboardData.ts` | All API query/mutation hooks |
| `apps/api/src/modules/` | All backend feature modules |
| `packages/database/prisma/schema.prisma` | The full database schema |
| `docs/INFRASTRUCTURE.md` | Full deployment & DevOps guide |
| `docker-compose.production.yml` | Full production Docker stack |

---

## 🔒 Security

- **Multi-tenant** — every user's data is completely isolated by organization
- **RBAC** — role-based access control (Owner → Admin → Manager → Employee)
- **MFA** — managed by Clerk's secure authentication center
- **Audit logs** — every action is recorded with timestamp, IP, and user
- **Session management** — view and revoke active sessions in real-time

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Custom AI model fine-tuning per organization
- [ ] Advanced analytics & forecasting dashboards
- [ ] Multi-currency & multi-language support
- [ ] Public API for third-party integrations
- [ ] White-label / reseller mode

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create your branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Suryooday](https://github.com/Suryooday)

---

<div align="center">

**Built with ❤️ to give every business the power of an AI-first operating system.**

[⭐ Star this repo](https://github.com/Suryooday/Beonix-OS) · [🐛 Report a bug](https://github.com/Suryooday/Beonix-OS/issues) · [💡 Request a feature](https://github.com/Suryooday/Beonix-OS/issues)

</div>
