# Dashboard

Living design doc for the dashboard page (route: `/`).

## Goal / motivation
The dashboard is the first screen the user sees. It should answer the questions the user opens the app to ask, without making them navigate first.

Today it is a placeholder grid of cards linking to Ledger, Templates, and Categories.

## Decisions
- **Primary job: cash runway / near-term forecast + cashflow this month.** Both flow-oriented framings anchor the page. Net worth, goals, bills, and activity are out of scope for this iteration.
- **Composition: fused timeline.** One chart runs from start of current month through forecast horizon — current month is actuals + pending, future is projected from templates. Category breakdown sits beside it.
- **Chart shape: bars + line overlay.** Bars = net cashflow per bucket. Line = running balance. May refine later.
- **Horizon + granularity: 3 months, weekly buckets (~13 bars).** Reason: focus is improving minute (week-by-week) finances in service of long-term goals — weekly granularity surfaces paycheck/bill cadence, 3 months keeps the template projection accurate.
- **Ledger is the cash account; savings are holdings.** All cashflow/runway reporting derives from the LineItem ledger. Savings entities represent holdings (like investments) and do NOT feed cash balance. Running balance at any date = cumulative sum of ledger line items (income − expense) with date ≤ target.
- **Forecast feed: ledger + templates, merged.** Future portion of the chart includes future-dated manual ledger items AND projected recurring-template instances. Logic must avoid double-counting when a template instance has already been materialized into the ledger.
  - **Implementation note:** `TemplateSeederService.SeedHorizonAsync` already materializes templates into `LineItems` out to a 12-month horizon. Dashboard services only need to query `LineItems` — no dedupe required.
- **Category panel: this-month vs baseline.** List of categories with this-month total alongside a baseline (e.g. "$432 vs $500 typical, ↑12%"). Surfaces where the month is off-trend.
- **Baseline: trailing 3-month average per category.** Smooths short-term noise while still responding to lifestyle changes within a quarter.
- **Page layout: tile row above the chart.** A row of headline number tiles sits at the top, then the chart, then the category panel.
- **Tile set: flow-focused.** *Income this month*, *Expense this month*, *Net this month*, *Net next 30 days (projected)*. Anchors the page on cashflow direction.
- **Bar visualization: side-by-side income/expense per week.** Two thinner bars per week — one income (up, green), one expense (up, red). Reads gross flows directly, allows side-by-side comparison.
- **Running-balance line: weekly (week-end) points.** Matches the bar granularity. 13 points across the horizon.
- **Chart library: Recharts.** Already installed in `client/package.json` (`recharts ^2.15.0`). Use `BarChart` + `Bar` for income/expense and a `Line` overlay for running balance.
- **Category panel scope: expense categories only.** Income variance is usually noise; the panel exists to surface overspending. ("Both"-direction categories appear when they have expense activity this month.)
- **Category panel sort: biggest absolute variance first.** `|this-month − baseline|` descending. Surfaces whatever shifted most in dollar terms — big stable buckets sink, real movers float up.
- **Page layout: chart full-width, category panel underneath.** Chart fills `.main-content`; category panel is a full-width section below. Maximizes chart size for 26 side-by-side bars.
- **Backend endpoints: three, one per widget.** `GET /api/dashboard/tiles`, `GET /api/dashboard/timeline`, `GET /api/dashboard/category-variance`. Each refreshes independently with its own React Query key.
- **Backend structure: per-widget services.** `DashboardTilesService`, `DashboardTimelineService`, `DashboardCategoryVarianceService` — each owns one endpoint's logic and is independently testable. Controller is thin, just dispatches to the service.
- **Tile content: value + delta vs trailing 3-month average.** Each tile shows the current number and a small "↑X% vs typical ($Y)" line. "Next 30 days" tile compares projected net cashflow against trailing 3-month average net.
- **Drill-downs: none for now.** Dashboard is read-only in this iteration; nothing on the page is clickable. Revisit if/when ledger filtering supports the needed query params.
- **Empty/sparse-data: explicit "not enough data" copy per widget.** When a widget can't be computed (e.g. <3 months of history for category variance, no templates for forecast), it still renders but shows a short message explaining what unlocks it.
- **Chart tooltip: week label + income + expense + net + end-of-week running balance.** Four lines. Matches the data shown on the chart itself.
- **"As of" date: always today.** No date picker, no URL param. Services should still accept an `asOf` parameter internally for testability, but the controller hard-codes `DateTime.Today` (server clock).

## Open questions
_None — design is locked. Ready to break into implementation tasks._

## Framings on the table
1. **Cash runway / near-term forecast** — "how much money will I have at end of month / end of quarter, given recurring templates and known line items"
2. **Net worth snapshot + trend** — "what do I own minus what I owe, and is it trending up"
3. **Cashflow this month** — "income vs expense this month, by category, plus what's still upcoming"
4. **Bills & obligations radar** — "what's due in the next 30 days, what's overdue, what's been paid"
5. **Goals progress** — "savings goals, debt-paydown goals, with progress bars and projected completion dates"
6. **Activity feed + alerts** — "newest entries, anomalies (category over budget, unusually large item, account balance below threshold)"

## Out of scope
_None yet._
