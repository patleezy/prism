# CLAUDE.md — Prism Codebase Guide

## Project Overview

**Prism** (`heyprism.app`) is a single-page application for AI-powered consumer focus groups. Users define a research brief, generate a panel of AI personas, simulate their responses, and receive synthesized insights — all powered by the Anthropic Claude API.

---

## Repository Structure

```
/
├── index.html        # Entire frontend: HTML + inline CSS + JavaScript (1700+ lines)
├── api/
│   └── chat.js       # Vercel serverless backend — proxies Claude API calls
├── vercel.json       # Vercel deployment config (API route rewrites)
├── og.jpg            # Open Graph / social preview image
└── .gitignore        # Ignores .env, node_modules/, .vercel/
```

**Key fact**: There is no build step, no package.json, no bundler. The project deploys directly. Everything runs in-browser or as a Vercel serverless function.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES6+), HTML5, inline CSS |
| Backend | Node.js, Vercel serverless functions |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Deployment | Vercel (static site + serverless) |
| Storage | Browser `localStorage` |
| Dependencies | None (zero npm packages) |

---

## Architecture: Single-File Frontend

All frontend code lives in `index.html`. JavaScript is organized into named sections separated by `// ── SECTION NAME ──` comments:

| Section | Approx. Line | Purpose |
|---|---|---|
| STATE | ~844 | Central state object |
| HELPERS | ~851 | Formatting, emoji assignment, JSON parsing |
| NAV | ~968 | Screen transitions, step tracking |
| CHIPS | ~1008 | Research question template chips |
| TYPE CARDS | ~1052 | Research type selection |
| TOOLTIPS | ~1061 | Dynamic tooltip positioning |
| BRIEF | ~1103 | Research brief form submission |
| PANEL GENERATION | ~1125 | AI persona creation via Claude |
| PANEL TEMPLATES | ~1166 | Pre-built audience segment definitions |
| SIMULATION | ~1249 | Parallel persona response collection |
| SYNTHESIS | ~1315 | AI-powered insight aggregation |
| RESULTS RENDERING | ~1335 | Dashboard and metrics display |
| EXPORTS | ~1384 | TXT, Email, PDF export logic |
| SESSIONS | ~1493 | localStorage session management |
| API | ~1612 | Claude API wrapper (`callClaude`) |
| PROGRESS PERSISTENCE | ~1627 | Auto-save in-progress sessions |

---

## Core User Flow

```
Step 01 — Brief
  → user picks research type + enters category + question
  → optional: use a panel template or write custom brief

Step 02 — Panel
  → Claude generates 8 personas (JSON) with demographics + psychographics
  → user can edit/swap individual personas before proceeding

Step 03 — Simulation
  → all personas respond in parallel (Promise.all with 120ms UI stagger)
  → each response: warm-up, core answer, follow-up, purchase intent (1–10), WTP range, top objection
  → auto-saves progress to localStorage after each persona

Step 04 — Results
  → Claude synthesizes insights: executive summary, thematic clusters, metrics
  → exports available: TXT report, Email (mailto), PDF (window.print)
  → user can save session to localStorage
```

---

## Claude API Integration

Three API calls occur during a research session:

### 1. Panel Generation
- **Temperature**: 0.7
- **Max tokens**: 1000
- **Output**: JSON array of 8 persona objects
- Each persona: `name`, `age`, `income`, `location`, `occupation`, `values`, `categoryRelationship`, `likelyStance`, `archetype`

### 2. Persona Responses (parallel, one per persona)
- **Temperature**: 0.75
- **Max tokens**: 950
- **Output**: JSON with `warmUp`, `coreAnswer`, `followUp`, `purchaseIntent` (1–10), `wtp` (range string), `topObjection`

### 3. Synthesis
- **Temperature**: 0.4 (lower for consistency)
- **Max tokens**: 2500
- **Output**: JSON with `executiveSummary`, `themes[]`, `keyMetrics`, `segmentInsights`, `topObjections`

All calls go through `callClaude(system, messages, opts)` in the API section of `index.html`, which POSTs to `/api/chat`.

---

## Backend: `api/chat.js`

The backend is a thin security proxy. It:
- Accepts **POST only** (405 otherwise)
- **Rate limits** to 25 requests/hour per IP
- Rejects bodies **over 32KB** (413)
- **Forces** `model: "claude-sonnet-4-20250514"` — client cannot override this
- **Caps** `max_tokens` at 4000
- Forwards to `https://api.anthropic.com/v1/messages` using `ANTHROPIC_API_KEY`

**Environment variable required**: `ANTHROPIC_API_KEY` (set in Vercel project settings, never committed)

---

## State Management

A single `state` object holds all session data:

```js
state = {
  step: 1,          // Current step (1–4)
  brief: {},        // Research brief (category, question, type)
  panel: [],        // Array of persona objects
  responses: [],    // Array of persona response objects
  synthesis: {}     // Synthesized results object
}
```

State is not persisted to a store; it lives in memory. Sessions are serialized to `localStorage` on save.

---

## Data Persistence

| Key | Purpose | Expiry |
|---|---|---|
| `prism_sessions` | Saved completed sessions (max 20) | Permanent |
| `prism_in_progress` | Auto-saved in-progress session | 2 hours |

On page load, if `prism_in_progress` exists and is not expired, the user is offered a resume prompt.

---

## Persona System

**10 archetypes** used across all panels:
Status Seeker, Social Validator, Budget Stretcher, Lifestyle Aligner, Skeptic, Practical Optimizer, Power User, Value Maximizer, Reluctant Upgrader, Loyalist

**6 panel templates** (pre-defined demographic/psychographic profiles):
Auto-generate (AI-driven), Gen Z Consumers, B2B Decision Makers, Budget-Conscious Parents, Early Adopters, Luxury Buyers, Skeptical Mainstream

**Research types** each provide distinct per-persona instructions:
- `concept` — honest evaluation, excitement vs. concerns
- `price` — Van Westendorp methodology (too cheap / acceptable / expensive / too expensive)
- `message` — Clarity (1–5), Relevance (1–5), Motivation to act (1–5)
- `open` — personal, experience-driven free-form response

---

## Theme System

CSS custom properties control the full UI theme. Two themes are supported: `dark` (default) and `light`, toggled via `toggleTheme()` which sets `[data-theme]` on `<html>`.

Key CSS variables:
```css
--bg         /* background */
--surface    /* card/panel surfaces */
--accent     /* primary gold (#c8b560 dark / #7a5f10 light) */
--accent2    /* cyan highlights */
--accent3    /* coral/red accents */
--text        /* primary text */
--muted      /* secondary text */
```

---

## Commit Conventions

Follow the existing prefix style:

| Prefix | Use for |
|---|---|
| `feat:` | New features or capabilities |
| `fix:` | Bug fixes |
| `polish:` | UX refinements, copy tweaks, visual improvements |
| `ux:` | Larger user experience changes |
| `security:` | Security hardening |
| `v2:` / `vN:` | Major version rewrites |

---

## Development Workflow

**No build step needed.** To work on this project:

1. Edit `index.html` or `api/chat.js` directly
2. Test locally with `vercel dev` (requires Vercel CLI + `ANTHROPIC_API_KEY` in `.env.local`)
3. Deploy by pushing to `main` (Vercel auto-deploys)

**Environment setup for local dev:**
```bash
# .env.local (never commit this)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Key Conventions

- **No external dependencies** — do not add npm packages to the frontend. Keep zero-dependency philosophy.
- **Single-file frontend** — all frontend changes go in `index.html`. Do not split into separate JS/CSS files.
- **Section markers** — when adding new JavaScript, place it in the appropriate `// ── SECTION ──` block or add a new named section.
- **safeParseJSON** — always use this helper when parsing Claude API responses; never use `JSON.parse` directly on AI output.
- **Model is locked server-side** — never change the model in client-side `callClaude` opts; the backend ignores it anyway.
- **Rate limits are real** — 25 req/hour per IP. Factor this in when testing; parallel calls during simulation consume multiple requests per session.
- **localStorage max** — sessions list is capped at 20. See `saveSession()` for pruning logic.
- **No CSS files** — all styles are in the `<style>` block in `index.html`. Use CSS variables for new colors.
- **Responsive first** — use the existing media query breakpoints. Test mobile layouts when making UI changes.

---

## What NOT to Do

- Do not add a build system, bundler, or transpiler
- Do not introduce npm packages (frontend)
- Do not split `index.html` into multiple files
- Do not hardcode `ANTHROPIC_API_KEY` anywhere in code
- Do not bypass the backend proxy to call the Anthropic API directly from the frontend
- Do not change `model` in `api/chat.js` without updating the constant in a single place
- Do not exceed the existing `max_tokens` caps without also updating the backend limit
