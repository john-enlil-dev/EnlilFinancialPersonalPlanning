# Ledger Reporting

Living design doc for in-ledger reporting / insights.

## Goal / motivation
Surface category-level spend breakdown and other insights on the ledger page so the user can answer "where is my money going?" without leaving the page or building a query.

The ledger already has date / direction / category filters. Reporting should respect them.

## Decisions
- **Separate Reports page at `/ledger/reports`.** Reporting lives outside the ledger table; ledger stays focused on row-level entry/edit. Sidebar gets sub-link support so Reports nests under Ledger.
- **Page content: KPI tiles + pie chart + monthly trend bars + insights bullets.** All four sections on one page. Date-range controls drive everything (default: current month).
- **Comparison window for insights:** same length immediately preceding the selected window (e.g. May 1–13 compares to Apr 18–30).
- **Trend window:** last 6 calendar months including the month containing `to`.
- **Chart colors:** reuse `categoryColor(uid)` from `render-category-pill.tsx` so pie/bars/pill share one palette per category.

## Open questions
_None for v1 — building._

## Framings on the table
1. **Inline pie below the table** — single pie chart of expenses by category, computed from the currently-filtered rows. Cheapest, single visualization.
2. **Side rail with pie + KPIs** — pie on the right of the table plus a few headline numbers (total spend, top 3 categories, net for the filter window).
3. **Time-series stacked bars** — for the filtered date range, a stacked bar per month/week showing how each category's spend evolves. Better at trend, worse at single-period totals.
4. **Comparison view** — this filter window vs the prior equivalent window, with category-level deltas highlighted.
5. **Separate Reports page** — new route with multiple chart types selectable (pie, time-series, comparison) — pulls the reporting out of the ledger.
6. **Heuristic insights bar** — text-first bullets: "biggest expense this window", "first spend in category X", "category Y up Z% vs typical", with one small pie chart alongside.

## Out of scope
_None yet._
