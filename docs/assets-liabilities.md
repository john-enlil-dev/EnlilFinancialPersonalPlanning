# Assets & Liabilities

## Goal / motivation
Second domain primitive of the financial planning app: a record of what the user owns and owes, alongside the existing cash-flow ledger (`LineItem` / `Category` / `RecurringTemplate`). Will eventually drive net-worth views and forward projections that combine balances + cash flow.

## Design space (diverge)
- **A. Flat snapshot — `Asset` + `Liability`, current value only.** Two entities, each with `Name`, `Value`, `AsOfDate`. User overwrites the value when they next reconcile. No history, no growth, no link to line items. Smallest viable shape. Net worth = `sum(assets) - sum(liabilities)`.
- **B. Snapshot + history (`*Snapshot` rows).** `Asset` and `Liability` are stable identities; `AssetSnapshot` / `LiabilitySnapshot` rows record `(EntityUID, Date, Value)`. New reconciliation = new snapshot row. Net worth charts plot over time.
- **C. Account-centric.** Replace abstract "asset/liability" with an `Account` entity (Checking, Credit Card, Mortgage, 401k, Brokerage). `Account.Type` determines asset vs liability. Line items optionally reference `AccountUID` so cash flow and net worth share a primitive. Single-entry preserved (line items still don't transfer balances automatically).
- **D. Two-tier: holdings for investments, balances for everything else.** Investment assets (brokerage, 401k) modeled as a list of `Holding` rows (ticker + units + price); non-investment assets (house, cash, car) and liabilities (mortgage, credit cards) stay simple balance-as-of-date. Tracks market growth without forcing every balance to be a holdings list.
- **E. Liability-as-loan with amortization.** Liabilities aren't just balances — they're loan structures (`Principal`, `InterestRate`, `Term`, `PaymentAmount`, derived amortization schedule). The mortgage `RecurringTemplate` could auto-derive from the loan. Assets stay flat (option A).
- **F. Projection-first.** Assets and liabilities exist primarily to feed forward projection. Each carries `Value` + optional `GrowthRate` (asset) / `InterestRate` (liability). System projects net worth N months out by combining asset growth, liability interest, and the existing cash-flow horizon.

## Decisions
- **Framing D — two-tier: holdings for investments, simple balance for everything else.** Confirmed by user 2026-05-08. Investment assets carry a list of `Holding` rows (ticker + units + price); non-investment assets and liabilities stay as a single balance-as-of-date value. Reason: long-term usefulness — tracks market movement on the things that move with the market, without forcing a holdings list on things that don't.
- **Long-Term Assets internal structure: nested containers + holdings, alongside single-value items.** Confirmed by user 2026-05-08. A Long-Term Asset row is either (i) a container row (e.g., "Vanguard Brokerage") that has N child Holding rows where container value = sum of holdings, or (ii) a single-value item row (house, jewelry, art) with a manually entered value.
- **Long-Term Assets table layout: two tables.** Confirmed by user 2026-05-08. `LongTermContainer` (Name, has child `Holding` rows) and `LongTermItem` (Name, Value, AsOfDate) are separate entities with their own controllers and DTOs. Reason: highest type safety, no nullable-field gymnastics — each table represents one shape cleanly. Boilerplate cost accepted.
- **Snapshot history on every entity.** Confirmed by user 2026-05-08. Each value-bearing entity gets a child `*Snapshot` table of `(Date, Value)` rows; updates append a new snapshot row rather than overwriting. Reason: powers net-worth-over-time charting and historical reconstruction; without snapshots we lose all trend data the moment a value is updated.
- **Cached current value, snapshots are the source of truth.** Confirmed by user 2026-05-08. Each entity carries `CurrentValue` + `CurrentAsOfDate` as a denormalized cache; the snapshot table is authoritative. Save flow: append a snapshot row, then update the cached fields on the parent in the same transaction. Reason: fast reads (no aggregation on the hot path) and a single source of truth (snapshot log) — accepts one extra write per save in exchange.
- **Long-Term Container snapshot grain: leaf-only (per-Holding).** Confirmed by user 2026-05-08. `HoldingSnapshot(Date, Units, PricePerUnit)` is the only snapshot for the container/holdings tree. The Container's `CurrentValue` is the cached sum of the latest snapshot per Holding. Historical container value at any past date = aggregation across HoldingSnapshot rows near that date. Reason: highest fidelity, preserves per-position history; accepts the cost of aggregating for historical roll-up queries.
- **Snapshot trigger: every save appends a new row.** Confirmed by user 2026-05-08. No same-day deduping, no separate "reconcile" action — every value-mutating save writes a new snapshot row. Reason: full audit trail; chart-cleanup / windowing / dedup is a downstream reporting concern that can be solved with data analysis later if charts get noisy.
- **`Holding` field shape locked.** Confirmed by user 2026-05-08. `UID` (Guid PK), `LongTermContainerUID` (Guid FK), `Name` (string, required), `Symbol` (string, optional), `Units` (decimal, fractional supported), `PricePerUnit` (decimal), `AsOfDate` (DateOnly — when this position was last updated). `Value` is computed as `Units * PricePerUnit` — no cached column at the leaf since the math is trivial.
- **Cost basis / cap-gains tracking out of scope for this iteration.** Confirmed by user 2026-05-08. Reason: not needed for net-worth-over-time charting; can be added later (holding-level or lot-level) if a tax-implications view is built.
- **`LongTermContainer` field shape locked.** Confirmed by user 2026-05-08. `UID` (Guid PK), `Name` (string, required), `Institution` (string, optional — e.g., "Vanguard", "Fidelity"), `CurrentValue` (decimal, cached = sum of latest holding values), `CurrentAsOfDate` (DateOnly, cached = max of holdings' `AsOfDate`s). `Institution` is the broker/custodian name; useful for filtering and disambiguating multiple containers.
- **`LongTermItem` field shape locked.** Confirmed by user 2026-05-08. `UID` (Guid PK), `Name` (string, required — e.g., "Family House"), `Subtype` (string, optional, free-form — e.g., "House", "Art", "Jewelry"), `CurrentValue` (decimal, cached), `CurrentAsOfDate` (DateOnly, cached). `Subtype` is intentionally a free-form string, not an enum and not a lookup table; the **UI uses a react-select Creatable** to autocomplete from existing distinct `Subtype` values so the user can reuse "House" / "Art" without the system enforcing a fixed taxonomy. Reason: zero schema overhead now, easy to formalize later by normalizing the strings into a lookup if a taxonomy emerges in practice.
- **Snapshot table shapes locked for Long-Term Assets.** Confirmed implicitly by the prior decisions 2026-05-08.
  - `HoldingSnapshot`: `UID` (Guid PK), `HoldingUID` (Guid FK), `Date` (DateOnly), `Units` (decimal), `PricePerUnit` (decimal). `Value` is not stored — computed from `Units * PricePerUnit` on read.
  - `LongTermItemSnapshot`: `UID` (Guid PK), `LongTermItemUID` (Guid FK), `Date` (DateOnly), `Value` (decimal).
- **Retirement Assets: parallel pattern, separate tables.** Confirmed by user 2026-05-08. `RetirementContainer` + `RetirementHolding` (+ their snapshots) mirror the Long-Term shape, with retirement-specific fields (tax treatment) added on the container. Reason: keeps the per-category partition consistent — each category remains its own table tree — and avoids softening the explicit category boundary by collapsing into a shared discriminator-based table.
- **`RetirementContainer` field shape locked.** Confirmed by user 2026-05-08. `UID` (Guid PK), `Name` (string, required), `Institution` (string, optional), `AccountType` (`AccountType` int-backed enum: `Traditional401k=1, Roth401k=2, TraditionalIRA=3, RothIRA=4, HSA=5, Pension=6, Other=7`), `CurrentValue` (decimal, cached), `CurrentAsOfDate` (DateOnly, cached). Single account-type enum captures tax behavior implicitly (Traditional vs Roth split is in the enum values themselves).
- **`RetirementHolding` and its snapshot mirror Long-Term.** Confirmed implicitly 2026-05-08 from the parallel-pattern decision. `RetirementHolding`: `UID`, `RetirementContainerUID`, `Name` (required), `Symbol` (optional), `Units`, `PricePerUnit`, `AsOfDate`. `RetirementHoldingSnapshot`: `UID`, `RetirementHoldingUID`, `Date`, `Units`, `PricePerUnit`.
- **`SimpleAsset` field shape locked.** Confirmed by user 2026-05-08. `UID` (Guid PK), `Name` (string, required), `Subtype` (string, optional, free-form, **react-select Creatable** UX same as `LongTermItem`), `CurrentValue` (decimal, cached), `CurrentAsOfDate` (DateOnly, cached). Snapshot: `SimpleAssetSnapshot(UID, SimpleAssetUID, Date, Value)`.
- **`CreditCardDebt` field shape locked.** Confirmed by user 2026-05-08 ("let's really dive in deep"). `UID` (Guid PK), `Name` (string, required — e.g., "Chase Sapphire"), `Institution` (string, optional), `APR` (decimal, e.g., `0.2399` for 23.99%), `CreditLimit` (decimal), `MinimumPayment` (decimal), `CurrentBalance` (decimal, cached — positive = amount owed), `CurrentAsOfDate` (DateOnly, cached). Snapshot: `CreditCardDebtSnapshot(UID, CreditCardDebtUID, Date, Balance)`. Reason: full shape supports interest projection, credit utilization tracking, and minimum-payment planning out of the box.
- **Line item ↔ asset/liability linkage lives on a separate M2M join entity, not on `LineItem`.** Confirmed by user 2026-05-08 ("this could be a M2M table potentially to keep from impacting line items"). `LineItem` gets zero new columns. New entity `LineItemAllocation`:
  - `UID` (Guid PK)
  - `LineItemUID` (Guid FK → `LineItem`, required)
  - `LinkedEntityUID` (Guid, required — points at the A/L entity, polymorphic)
  - `LinkedEntityType` (int-backed enum: `SimpleAsset=1, Savings=2, CreditCardDebt=3, MortgageDebt=4, LongTermContainer=5, LongTermItem=6, RetirementContainer=7`) — discriminator that resolves the polymorphic FK; validated in app code (no DB-level FK)
  - `ComponentType` (string, optional, free-form, **react-select Creatable** — labels like "Principal", "Interest", "Escrow", "PMI"; user can reuse existing values or invent new ones; can be normalized later)
  - `Amount` (decimal, required) — the portion of the parent line item allocated to this slot
  - `AffectsLinkedBalance` (bool, default `false`) — when `true`, saving this allocation appends a balance snapshot on the linked entity
  A simple linked line item is one allocation row. A mortgage payment with 4 components is 4 allocation rows under the same `LineItem`, each with its own `ComponentType` and `AffectsLinkedBalance`. No constraint that allocation amounts sum to `LineItem.Amount` — allocations are commentary on the cash flow, not its substitute. Reason: per-component flexibility (mortgage Principal vs Interest vs Escrow vs PMI), zero impact on `LineItem`'s schema, and naturally extensible to future tax-deduction tracking by reading the relevant `ComponentType`.
- **Mortgage interest-as-tax-write-off explicitly deferred.** Confirmed by user 2026-05-08 ("defer this consideration"). Do not design or build deduction tracking now; revisit when a tax-implications view is added.
- **Holding price source: manual only for v1.** Confirmed by user 2026-05-08 ("for now"). User types the price they see on the broker's site; no market-data API integration, no scheduled refresh job. Reason: zero external dependencies, no API keys / rate limits / vendor selection — can layer (b) optional refresh button or (c) scheduled job on top later without changing the schema.
- **Imports (CSV / Plaid) out of scope for v1.** Confirmed by user 2026-05-08. Manual entry only. Reason: same stance as line items; defer the integration cost (auth, rate limits, account linking) until manual entry is shown to be insufficient in practice.
- **UI shape: three new nav entries — Assets, Liabilities, Net Worth.** Confirmed by user 2026-05-08.
  - `/assets` — page with 4 tabs: Long-Term Assets, Retirement Assets, Simple Assets, Savings. Each tab is the CRUD list for that category.
  - `/liabilities` — page with 2 tabs: Credit Card Debt, Mortgage Debt. Each tab is the CRUD list for that category.
  - `/net-worth` — read-only visualization: chart of net worth over time (driven by snapshot history), plus a summary header showing total assets / total liabilities / net worth. No CRUD.
  Existing nav (Dashboard / Ledger / Templates / Categories) is preserved; three new entries are appended. Reason: keeps top-nav legible (4 → 7 entries, not 11), groups the six categories under their natural asset/liability split, and gives the cross-cutting net-worth view its own home rather than burying it on a tab.

- **`Savings` field shape locked — full depth.** Confirmed by user 2026-05-08 ("full depth here too, thought we may strip it down later"). `UID` (Guid PK), `Name` (string, required), `Institution` (string, optional), `Subtype` (string, optional, free-form, **react-select Creatable** — e.g., "HYSA", "Money Market", "CD"), `CompoundingFrequency` (`CompoundingFrequency` int-backed enum: `Daily=1, Monthly=2, Quarterly=3, Annual=4`), `CurrentRate` (decimal, cached APY), `CurrentRateAsOfDate` (DateOnly, cached), `CurrentValue` (decimal, cached), `CurrentValueAsOfDate` (DateOnly, cached). Two snapshot tables: `SavingsValueSnapshot(UID, SavingsUID, Date, Value)` and `SavingsRateSnapshot(UID, SavingsUID, Date, Rate)`. Reason: matches the rest of the system's depth — captures rate fluctuation over time, supports projection-accurate compounding math, and lets the user tag account variants without enforcing a taxonomy. Field set may be trimmed in a future pass once usage patterns reveal which fields the user actually fills in.

- **`MortgageDebt` field shape locked — full depth.** Confirmed by user 2026-05-08 ("full depth"). Core fields: `UID` (Guid PK), `Name` (string, required), `Institution` (string, optional), `OriginalPrincipal` (decimal), `InterestRate` (decimal), `TermMonths` (int), `StartDate` (DateOnly), `LoanType` (`LoanType` int-backed enum: `Fixed=1, ARM=2, Other=3`), `MonthlyPaymentPI` (decimal — principal + interest portion), `CurrentBalance` (decimal, cached — positive = amount owed), `CurrentAsOfDate` (DateOnly, cached). Cash-flow breakdown: `EscrowMonthly` (decimal — taxes + insurance held in escrow), `PMIMonthly` (decimal — mortgage insurance). Cash-flow link: `LinkedRecurringTemplateUID` (Guid?, FK to `RecurringTemplate`) so the monthly mortgage payment in the ledger is tied to the mortgage entity. Snapshot: `MortgageDebtSnapshot(UID, MortgageDebtUID, Date, Balance)`. Stored amortization schedule: `AmortizationEntry(UID, MortgageDebtUID, PaymentNumber, Date, Principal, Interest, RemainingBalance)` precomputed at mortgage save time. Reason: full shape supports interest-cost projection, total-monthly-outflow planning, cash-flow ledger integration, and fast historical/forward amortization views without per-query recomputation. ARM-specific rate-adjustment data (caps, adjustment dates) deferred to a later iteration; `LoanType=ARM` is captured as metadata only for now.
- **Partition into six explicit categories.** Confirmed by user 2026-05-08. The data model is split along functional/tax-treatment lines, not a single generic Asset/Liability split:
  - **Long-Term Assets** — heterogeneous bucket spanning both taxable investments (stocks) AND long-term possessions (houses, jewelry, art). Confirmed by user 2026-05-08. Excludes tax-advantaged retirement accounts (those go in Retirement Assets).
  - **Retirement Assets** — tax-advantaged (401k / IRA / Roth IRA), tax treatment matters.
  - **Simple Assets** — flat value, no holdings, no interest.
  - **Credit Card Debt** — revolving balance.
  - **Mortgage Debt** — loan with structured terms.
  - **Savings** — likely interest-bearing cash (HYSA / savings account); separate from Simple Assets for interest tracking.
  Reason: each category carries different fields (holdings, tax flags, loan structure, interest rate), so partitioning at the data-model layer keeps each row clean rather than forcing one mega-entity with mostly-null columns.

## Open questions
_(none — initial design complete 2026-05-08, ready to scope into implementation slices.)_

## Mortgage payment-history scope (added 2026-05-08, design in progress)
**Goal:** click into a specific mortgage to back-fill historical payments, capture per-payment breakdowns (principal / interest / escrow / PMI / extra principal), and analyze cost over time.

**Existing primitives to reuse:** `LineItem` + `LineItemAllocation`. The allocation entity was designed exactly for this — one $2,500 mortgage `LineItem` with N child allocation rows, each tagged with `ComponentType` (free-form: "Principal", "Interest", "Escrow", "PMI", "Extra Principal") and `AffectsLinkedBalance`. No new tables needed. Open question is the UI / UX shape, not the schema.

### Decisions
- **UI shape: drill-in detail page at `/liabilities/mortgages/:uid`.** Confirmed by user 2026-05-08. Click a mortgage row in the liabilities table → navigate to a full-screen detail view; back-link returns to `/liabilities`.
- **Back-fill ergonomics: single-row form with "Add another".** Confirmed by user 2026-05-08. Type one payment, save, form clears, repeat. Payment history sorts **descending by date** (newest at top, oldest at bottom).
- **Analytics depth: full breakdown.** Confirmed by user 2026-05-08. Summary cards (totals per component + lifetime + avg monthly), stacked area chart over time, year-over-year breakdown table, projected payoff comparison vs original schedule.
- **Balance-affect on mortgage payments: deferred / not auto-applied.** All payment allocations save with `AffectsLinkedBalance=false` for now. Reason: the existing `BalanceAffectService` derives the sign from `Direction` × asset/liability, which works for credit-card charges but produces the wrong sign for mortgage payments (Expense → liability should reduce, not increase, when it's a payment toward the loan). Future fix: per-`ComponentType` sign mapping or an explicit per-allocation sign field. For now the user keeps `MortgageDebt.CurrentBalance` accurate by editing the mortgage directly.
- **Component types for mortgage payments (free-form, suggested):** `Principal`, `Interest`, `Escrow`, `PMI`, `Extra Principal`. Stored as strings via the existing `LineItemAllocation.ComponentType` field.

### Open questions
- _(none — ready to implement.)_

## Savings transaction-history scope (added 2026-05-08)
**Goal:** click into a Savings account to capture deposits, withdrawals, interest accruals over time. Each withdrawal carries a "why" so the user can read the timeline as a story — what was the balance at each point, what came in, what came out, and why.

**Existing primitives to reuse:** same as mortgage — `LineItem` + `LineItemAllocation` already supports `LinkedEntityType.Savings`. Per-transaction `ComponentType` describes the transaction type; `Description` on the LineItem captures the "why".

### Decisions
- **UI shape: drill-in detail page at `/assets/savings/:uid`.** Confirmed by user 2026-05-08. Mirrors the mortgage detail-page pattern — Overview / Line Items tabs, summary header, year cards, charts, transaction history table, add-transaction modal.
- **Transaction component types: `Deposit`, `Withdrawal`, `Interest`, `Fee`, `Transfer`.** Confirmed by user 2026-05-08. Stored in the existing `LineItemAllocation.ComponentType` string field.
- **"Why" capture: `LineItem.Description`** (existing free-form field). No new schema for the description itself.
- **New `Tag: string?` column on `LineItemAllocation`** (max 100). Confirmed by user 2026-05-08. Savings-specific grouping that's separate from the global Categories table. UI uses react-select Creatable with options derived from existing distinct `Tag` values — no DB lookup table for v1. Field is generic at the schema layer; its v1 use is savings transaction grouping (e.g., "Vacation", "Emergency fund", "Bonus") for future per-tag metrics.
- **Direction auto-derived from `ComponentType`** — Deposit / Interest → `Income`; Withdrawal / Fee / Transfer → `Expense`. The user doesn't pick direction manually.
- **Balance trajectory derived from `currentValue` + transaction history.** Same forward-walk pattern as the mortgage detail page; no manual `SavingsValueSnapshot` entry required for the chart.
- **Each transaction is one LineItem with one LineItemAllocation** (single-component, not multi-component breakdown). Mortgage uses multi-component because each payment has 4-5 inherent pieces; savings transactions are atomic.
- **Balance-affect deferred / not auto-applied** (same stance as mortgage). All allocations save with `AffectsLinkedBalance=false`. The user keeps `Savings.CurrentValue` accurate by editing the savings row directly.

### Open questions
- _(none — ready to implement.)_

## Credit Card transaction-history scope (added 2026-05-08)
**Goal:** parallel of the savings detail page for credit card debts. Click into a credit card to capture charges, payments, interest, fees, refunds. Read the timeline as a story — balance growth/shrinkage, what was charged, what was paid down, fee/interest impact.

**Existing primitives to reuse:** `LineItem` + `LineItemAllocation` with `LinkedEntityType.CreditCardDebt`. `Tag` column already added.

### Decisions
- **UI shape: drill-in detail page at `/liabilities/credit-cards/:uid`.** Mirrors mortgage/savings.
- **Transaction component types: `Charge`, `Payment`, `Interest`, `Fee`, `Refund`.** Stored in `LineItemAllocation.ComponentType`.
- **Sign convention inverted from savings (this is debt):** `Charge / Interest / Fee` → balance up; `Payment / Refund` → balance down.
- **Color convention also inverted:** net positive (debt grew) = red, net negative (debt paid down) = green.
- **`LineItem.Direction` follows the picked category** (same as savings).
- **Balance-affect deferred** — `AffectsLinkedBalance=false` on every allocation. User keeps `CreditCardDebt.CurrentBalance` accurate by editing the card directly.
- **`TagPill` extracted to a shared component** (`UI/functions/render-tag-pill.tsx`) for reuse between savings and credit card pages.

### Open questions
- _(none — ready to implement.)_

## Out of scope (this iteration)
- Multi-currency
- Soft delete / audit history
- Plaid / bank feed integration (deferred to a later iteration)
- CSV / file-based imports (deferred to a later iteration)
- Cost-basis / cap-gains tracking on Holdings
- Mortgage interest as a tax write-off (and similar interest-as-deduction concepts)
- ARM-specific rate-adjustment fields (caps, adjustment dates) on `MortgageDebt`
