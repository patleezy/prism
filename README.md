# Prism

> Simulate a full consumer focus group using AI personas. Directional research insights in minutes, not weeks.

Prism is a single-page app that lets you run AI-powered consumer research. Define a brief, generate a panel of personas, simulate their responses in parallel, and get synthesized insights — all without recruiting, scheduling, or moderating a single human.

Live at **[heyprism.app](https://heyprism.app)**

---

## How it works

**Step 1 — Brief**
Pick a research type, enter your product category, and write your question. Optionally choose a panel template or use question chips to get started fast.

**Step 2 — Panel**
Claude generates 8 diverse AI personas with demographics and psychographics. You can edit or swap any persona before continuing.

**Step 3 — Simulate**
All personas respond in parallel. Each response includes a warm-up answer, core response, follow-up, purchase intent score (1–10), willingness-to-pay range, and top objection.

**Step 4 — Results**
Claude synthesizes everything into an executive summary, thematic clusters, key metrics, and recommended actions. Export as TXT, PDF, or email.

---

## Features

- **4 research types** — Concept testing, Price sensitivity (Van Westendorp), Message testing, Open-ended
- **6 panel templates** — Auto-generate, Gen Z Consumers, B2B Decision Makers, Budget-Conscious Parents, Early Adopters, Luxury Buyers, Skeptical Mainstream
- **10 persona archetypes** — Status Seeker, Social Validator, Budget Stretcher, Lifestyle Aligner, Skeptic, Practical Optimizer, Power User, Value Maximizer, Reluctant Upgrader, Loyalist
- **Export options** — TXT report, PDF (print), Email (mailto)
- **Session management** — Save up to 20 sessions to localStorage, auto-save in-progress sessions with 2-hour resume window
- **Dark & light theme**
- **Zero dependencies** — no npm packages, no build step

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES6+), HTML5, inline CSS |
| Backend | Node.js, Vercel serverless functions |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Deployment | Vercel |
| Storage | Browser `localStorage` |
| Dependencies | None |

---

## Local development

**Requirements:** [Vercel CLI](https://vercel.com/docs/cli), an Anthropic API key

```bash
git clone https://github.com/patleezy/prism.git
cd prism
```

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Start the dev server:
```bash
vercel dev
```

Open `http://localhost:3000`. Changes to `index.html` or `api/chat.js` are reflected immediately — there is no build step.

---

## Deployment

Prism deploys automatically via Vercel on every push to `main`.

1. Connect the repo to a Vercel project
2. Add `ANTHROPIC_API_KEY` in **Project Settings → Environment Variables**
3. Push to `main` — Vercel handles the rest

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key — set in Vercel, never committed |

---

## Architecture

All frontend code lives in a single `index.html` file (~1700 lines). There is no bundler or build step — the file is served as-is by Vercel's static hosting.

The backend is a thin serverless proxy at `api/chat.js` that:
- Accepts POST requests only
- Rate-limits to 25 requests/hour per IP
- Rejects bodies over 32KB
- Forces the model to `claude-sonnet-4-20250514` regardless of what the client sends
- Caps `max_tokens` at 4000

The `ANTHROPIC_API_KEY` never touches the client — all Claude calls go through this proxy.

---

## Repository structure

```
/
├── index.html      # Entire frontend: HTML + CSS + JavaScript
├── api/
│   └── chat.js     # Vercel serverless backend — proxies Claude API calls
├── vercel.json     # Deployment config
└── og.jpg          # Open Graph image
```
