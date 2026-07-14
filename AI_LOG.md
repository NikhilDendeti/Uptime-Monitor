# AI Collaboration Log

## AI Tech Stack

- **Tool**: Claude Code (CLI agent), used directly in this repo's working directory for the
  entire build — planning, scaffolding, styling, and debugging.
- **Model**: Claude Sonnet 5 (`claude-sonnet-5`)

## The Prompts That Shipped It

The build ran in two phases. Phase 1 was a single detailed spec that established the full
architecture and contract up front — Django + MySQL, chosen at the planning stage. Once that
foundation existed, Phase 2 prompts could be terse one-liners — the model already had full
project context, so a short instruction was enough to redirect it precisely. Four prompts, in
order, cover the whole build:

| # | Stage | Prompt | Purpose |
|---|---|---|---|
| 1 | Plan | "Give me the complete plan to build this perfectlly." (+ full assignment brief) | Turn a long spec into a concrete architecture before writing code |
| 2 | Build | "Implemenet it" | Execute the agreed plan end-to-end, unattended |
| 3 | Redesign | Multi-section design-system brief | Execute a precise visual spec exactly, asking before over-scoping |
| 4 | Verify | Open the app in the browser tool and check it over end-to-end (paraphrased) | Confirm frontend and backend actually work together end-to-end, not just in isolation |

---

### 1 — Plan: the assignment brief, pasted directly

**Prompt:**
> *(Full assignment document, pasted verbatim — explicit deliverables: a `/backend` API, a
> `/frontend` dashboard, a `docker-compose.yml` orchestrating both, an `AI_LOG.md`, and a
> `README.md` with a 1-line setup command, up/down testing steps, and a deployment sketch.)*
>
> "Give me the complete plan to build this perfectlly."

Not a vague ask — the brief already specified the exact repo shape, exact deliverables, and exact
verification steps. The test was whether Claude Code would jump straight to code or reason about
the architecture first. It responded with a full architecture proposal, checked line-by-line
against the brief — Django + Django REST for the backend, MySQL for the database, React + Vite
for the frontend, the `MonitoredUrl`/`Check` schema, the REST surface, APScheduler running
in-process for the pinger, the three-service compose shape, and a Terraform sketch for AWS. All
agreed on before a single file existed.

### 2 — Build: "Implemenet it" — executing the agreed plan

**Prompt:**
> "Implemenet it"

Deliberately terse, since the planning already happened in the prior turn — testing whether short
follow-ups stay reliable once context is established, without re-stating the file list, schema, or
API contract. Claude Code scaffolded `/backend` (Django `config/` project + `monitor` app: models,
APScheduler-based pinger and scheduler, DRF views/routes), `/frontend` (React + Vite dashboard
with polling), and the root `docker-compose.yml` wiring backend, frontend, and MySQL together.
Connected Django to MySQL via PyMySQL rather than `mysqlclient`, specifically to avoid needing
native build tools in the Docker image.

**Verified, not assumed:** `python manage.py migrate` clean against the MySQL schema, `npm run
build` clean on the frontend, and a standalone script hitting the actual pinger logic against
`https://example.com` (200, ~300ms) and a deliberately invalid domain (connection error, no
status code) to confirm the up/down branching before calling it done.

### 3 — Redesign: a detailed design-system brief

**Prompt:**
> *(Multi-section brief specifying a "premium SaaS" bar — Linear/Stripe/Notion-level polish, an
> 8px spacing grid, a neutral-first color system, Lucide icons only, subtle motion, and an
> explicit requirement to design for loading/empty/error/offline states — applied to the
> original plain-CSS dashboard.)*

Given as a general design standard rather than a one-off instruction, to see if Claude Code would
guess scope or check first. It asked one clarifying question — redesign the existing app vs. save
this as a standing preference vs. something else — before touching any code; I confirmed "redesign
the existing app." It then added Tailwind v4, `lucide-react`, and `framer-motion` as the only new
dependencies, and rebuilt the dashboard into composable components (`Header`, `AddUrlForm`,
`MonitorList`, `StatusBadge`, etc.).

**Verified, not assumed:** Drove the actual result in a browser — light/dark themes,
desktop/mobile layouts, add/delete flows, empty and offline states — rather than just describing
what the code should do.

### 4 — Verify: driving the real app end-to-end in a browser

**Prompt (paraphrased):**
> Asked Claude Code to open the running app in its browser tool and check it over — not re-run
> the existing unit/build checks, but actually use the app as a real user would and confirm it
> works end to end.

Up to this point, the frontend had only been exercised against a mock API, and the backend only
via `curl` — the two had never actually been wired together and driven as a real user would. This
prompt asked Claude Code to use its browser tool to confirm the integrated app actually works, not
just each half in isolation. It stood up the real Django backend and the real React dev server
simultaneously, then drove an actual end-to-end pass in the browser — adding URLs, watching status
flip from Pending to Up/Down, and deleting entries.

**Result:** This is what surfaced the bug below — a bug neither of the earlier, isolated tests
could have caught.

## Course Corrections

### 1. A deleted row stayed stuck on screen forever — found by using the app, not by reading the code

During that live-browser pass, I deleted a monitored URL and it kept rendering — frozen, stale —
even though the network tab and a direct `curl` to the backend both confirmed it was correctly
gone from the database. Claude Code's first hypothesis was a known Framer Motion pitfall
(animating `height: 'auto'` on a `<motion.tr>`); it fixed that, and the bug was **still**
reproducible after a full page reload with the corrected code, which ruled that theory out cleanly
rather than papering over it. The actual cause was `AnimatePresence` (framer-motion v12) failing
to detect exit-animation completion because the animated element was nested inside a wrapping
component (`MonitorTableRow` / `MonitorCard`) instead of being its direct child, so it never
unmounted the exiting node. The fix was to drop the exit-animation mechanism entirely for list
removal and let plain React reconciliation handle it — correctness over a cosmetic fade. I had it
re-verify across several add/delete cycles afterward rather than trusting the first successful
attempt.

### 2. A silent failure mode: URLs stuck on "Pending" forever instead of showing "Down"

While running the backend locally on my own machine, I hit a real `OSError: Could not find a
suitable TLS CA certificate bundle` — a broken `certifi` install, likely from this project sitting
inside a OneDrive-synced folder. The bug that mattered wasn't the environment issue itself, it was
how the backend handled it: `pinger.py` only caught `requests.RequestException`, so this raw
`OSError` propagated uncaught, and **no** `Check` row was ever written for that ping — not "up,"
not "down," nothing. Every registered URL sat on "Pending" indefinitely with zero indication
anything had gone wrong. I pushed back on treating this as just a local environment quirk to work
around, since the underlying design flaw — one uncaught exception type silently disabling
monitoring for a URL forever — would resurface on any machine, for any transient network issue.
Claude Code broadened the exception handling to catch failures generally, so any failure mode
now resolves to a recorded "Down" check with an error message instead of an ambiguous silent gap.
The environment issue itself was diagnosed alongside this but is a separate, machine-specific fix
(reinstalling `certifi` into the correct virtualenv) — the code fix is what makes the app correct
regardless of what any given machine's environment does.
