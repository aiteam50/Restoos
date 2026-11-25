# RestroOS: Level 1 + Level 2

A web app that lets a restaurant run its own orders, kitchen, billing, inventory, purchasing and delivery without Swiggy or Zomato.
This build covers **Level 1** (F-1 to F-9) and **Level 2** (F-10 to F-15) from the PRD.

## Run it

Needs **Node.js 22.13 or newer** (Node 22 LTS or 24 LTS). The database is Node's built-in SQLite, so there is nothing to compile and no database server to install. Node prints an "SQLite is an experimental feature" warning on start; it's harmless.

```bash
npm install
npm run dev
```

In `npm run dev` mode each screen is compiled the first time you open it, so the first click on a screen can take a few seconds (a "Loading…" spinner shows). For a demo, use `npm run demo`.

Open http://localhost:3000. The first start creates `data/restroos.db` and fills it with a demo restaurant: menu with recipes, ingredients, vendors, riders, **4 weeks of simulated order history** (so analytics, learned prep times and reorder forecasts have data), and four orders from today.

**Upgrading from Level 1?** Your existing database is upgraded automatically on start (new tables and columns are added, nothing is deleted) and the demo dishes get recipes. To get the 4-week demo history, run `npm run reset` once. Note that this replaces your database.

| Who | PIN | Lands on |
|---|---|---|
| Priya (Owner) | 1111 | Dashboard, sees everything |
| Rahul (Manager) | 2222 | Dashboard, sees everything |
| Sneha (Cashier) | 3333 | Orders & billing, delivery |
| Imran (Head Chef) | 4444 | Kitchen display, inventory |
| Ravi / Arjun (Riders) | 5555 / 6666 | My deliveries (works well on a phone) |

Customers order at **/order** with no login.

```bash
npm run demo    # fastest for presenting: builds once, then every screen opens instantly
npm run reset   # delete the database and re-seed the demo data (incl. history)
npm test        # unit tests (Vitest)
npm run build && npm start   # production build
```

### Optional: AI-written vendor messages

Purchase orders always get a plain template message. To have Claude word them instead, set an Anthropic API key before starting:

```bash
# macOS / Linux
export ANTHROPIC_API_KEY=sk-ant-...
# Windows (cmd)
set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

The AI only writes the wording. Items, quantities and dates come from RestroOS's own calculation, and a reply that drops or changes any of them is rejected (the template is kept). The model name is in `config.yaml` → `ai.model`.

## Level 2 features and where they are

| PRD | Feature | Screen |
|---|---|---|
| F-9 | **Live updates.** Screens update the instant something changes (Server-Sent Events), with an optional chime for new orders and KOTs. All tabs in a browser share **one** live connection, so any number of tabs can be open. A slow refresh stays on as a fallback. | every staff screen, tracking page |
| F-10 | **Synchronised KOT firing.** The longest dish fires first; shorter ones are held with a countdown and fire later, so the order is ready together (biryani now, milkshake ~10 min later). Prep times are **learned** from real Start→Ready taps (10+ clean samples, within 50% of the menu time). If a station is overloaded, everything fires at once. "Fire now" overrides. | `/kitchen`, `/analytics` |
| F-11 | **Recipes & automatic stock deduction.** Each dish and add-on has a recipe. Accepting an order reserves stock; marking an item Ready deducts it. Stock never goes negative, and any shortfall is logged. | `/menu/item/<id>`, `/inventory` |
| F-12 | **Stock alerts & daily consumption.** Dishes switch to sold out by themselves when stock can't make one more portion, and come back after a stock-in. A daily report shows opening, purchased, used, wasted and closing stock plus count variance, which replaces the nightly manual audit. | `/inventory`, `/inventory/report` |
| F-13 | **AI purchasing assistant.** Three signals (stock vs reorder level, 7-day use, same-weekday use). When 2 of 3 agree, a draft PO per vendor is created with a suggested quantity and needed-by date. The manager approves, edits or skips; then sends it with one tap on WhatsApp or email, and marks goods received to add them to stock. | `/purchasing` |
| F-14 | **Delivery assignment & live tracking.** Accepted delivery orders auto-assign to the free rider idle longest. The rider's phone shares GPS every 15 s; the delivery screen and the customer's tracking page show a live map (OpenStreetMap). | `/delivery`, `/rider`, `/track/<code>` |
| F-15 | **Automation.** Online orders are accepted automatically while the kitchen has fewer than 6 open orders (configurable). | `/orders` (⚡ Auto badge) |
| F-2 L2 | **Analytics & validation report.** Revenue, orders by hour, orders ready together (with vs without sync), kitchen time, top dishes, learned prep times, plus every PRD section 7/8 check against its config threshold. | `/analytics` |

All thresholds live in `config.yaml` (`kitchen`, `decisions`, `automation`, `delivery`, `ai`, `validation`).

**About the demo history.** `npm run reset` creates 4 weeks of *simulated* orders (flagged `is_demo`, labelled on screen) so the charts and forecasts have something to show. Synchronised firing is off for the older two weeks and on for the recent two. In that simulation, sync raises "whole order ready within 3 min" from 16% to 84% (median gap between dishes 8.6 → 1.6 min). The simulation's cooking-time noise is an assumption, so treat this as a demo of the measurement, not as evidence that the feature works. Run a real service to measure it properly.

**GPS on phones.** Browsers only share location on `https://` or `localhost`. On a laptop, or over plain http on your network, use **Simulate ride** on the rider screen to demo tracking. After deploying with https, real GPS works.

## Level 1 features

| PRD | Feature | Screen |
|---|---|---|
| F-1 | PIN login, 5 roles, each role sees only its screens | `/login`, `/staff` |
| F-2 | Owner dashboard: revenue, payments, orders by status, top items, low stock, active deliveries, POs waiting | `/dashboard` |
| F-3 | Menu: categories, items (price, veg, prep time, station), add-on groups, sold-out toggle | `/menu` |
| F-4 | Customer ordering with add-ons, cart, delivery/takeaway, tracking page | `/order`, `/track/<code>` |
| F-5 | Order desk: accept, reject with reason, cancel, counter and phone orders | `/orders`, `/orders/new` |
| F-6 | Billing: discount, GST, packaging, Cash/UPI/Card, printable bill | `/orders/<id>` |
| F-7 | Inventory: ingredients, vendors (with lead time), stock-in, wastage, staff meal, spoilage, count correction | `/inventory` |
| F-8 | Delivery: assign/reassign rider, Picked up → Delivered, rider phone view | `/delivery`, `/rider` |
| F-9 | Kitchen display: KOT cards, stations, Start / Ready per item | `/kitchen` |

## Rules the app enforces

- Prices and totals are calculated on the server, never taken from the browser.
- Orders move only along valid steps (a rider can't pick up food that isn't ready; a paid bill can't be discounted).
- Stock can't go below zero; wastage, spoilage and corrections need a reason.
- Nothing reaches a vendor without a manager approval record.
- Riders only see and update their own deliveries and location.

## Project layout

```
config.yaml          every setting and threshold
lib/                 core logic, no UI
  orders.ts          pricing, order state machine, accept hooks, rider assignment, auto-accept
  kitchen.ts         KOT fire-time planner, learned prep times
  stock.ts           recipes → reserve / deduct, automatic sold-out
  purchasing.ts      3-signal reorder decision, draft / approve / receive POs
  ai.ts              Claude-written vendor message (with fact check)
  events.ts          live update bus (Server-Sent Events at /api/events)
  analytics.ts       charts data;  validation.ts  PRD section 7/8 checks
  reports.ts         daily consumption report
  demo.ts            recipes + simulated history for the demo
  migrate.ts         upgrades a Level 1 database in place
app/                 Next.js screens and server actions (app/actions.ts); app/api/* for live events and rider GPS
components/          UI pieces: order builder, live updates, map, charts, recipe editor
tests/               Vitest unit tests + tests/e2e_flow.py browser test
```

Stack: Next.js 15, React 19, TypeScript, Tailwind CSS, SQLite (`node:sqlite`), Leaflet + OpenStreetMap, Vitest.

Differences from the PRD's plan: SQLite built into Node instead of Prisma (no install-time compiling); Server-Sent Events instead of Socket.IO for live updates (works with plain `next dev` / `next start`, no custom server).

## Tests

- `npm test`: 38 unit tests. Level 1: bills, config, order state machine, pricing, delivery flow, stock. Level 2: fire-time planning, prep-time learning, recipe deduction and shortfalls, auto sold-out, the 2-of-3 reorder rule, PO approve/skip/receive, AI reply fact-check, auto-accept, auto-assign, upgrading a Level 1 database, the consumption report, and the validation checks.
- `tests/e2e_flow.py`: one real-browser run across every role. It checks auto-accept and auto-assign, a live update arriving without reload, the milkshake being held and then fired, milk deducted on Ready, rider GPS and the live map, a PO edited, approved and received into stock, a dish going sold out when stock hits zero and coming back after a stock-in, the reports, recipe editing, billing and the dashboard.
