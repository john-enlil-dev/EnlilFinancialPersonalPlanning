# Line Items

## Goal / motivation
First domain primitive of the financial planning app: a record of money flowing in or out. **Single-entry, not double-entry** — this is a planner, not an accounting system. Line items will populate historical-cash-flow views now and serve as the substrate for forward projections later.

## Design space (diverge)
- **A. Minimal `LineItem` + enum direction.** One entity, `Direction: Income | Expense` int-backed enum, amount always positive. No categories, accounts, or recurrence. Smallest viable shape.
- **B. Signed-amount `LineItem`, no direction field.** Same as A but the sign of `Amount` carries the direction. One column does the work; trades explicit type for terseness.
- **C. `LineItem` + `Category` upfront.** A's shape plus a foreign key to a `Category` table (Salary, Groceries, Rent, ...). Adds one more entity on day one but bakes categorization in instead of bolting it on.
- **D. `LineItem` + `Account` upfront.** A's shape plus a foreign key to an `Account` (Checking, Cash, Credit Card, ...). Sets us up for per-account balances later. Still single-entry within each account.
- **E. `RecurringTemplate` + materialized `LineItem`.** Capture the schedule first ("$3,000 paycheck every other Friday"), let line items fall out of it. Better fit for projection but a bigger upfront primitive.
- **F. Import-only.** No manual entry — only CSV / Plaid / bank feeds populate the table. Reduces UI to "review and correct." Probably wrong for MVP but worth naming so we can rule it out.

## Decisions
- **Framing: A + C + E.** Confirmed by user 2026-04-30. Three entities:
  - `LineItem` — A's minimal shape with a `Direction: Income | Expense` int-backed enum.
  - `Category` — separate entity (from C); `LineItem.CategoryUID` is a foreign key.
  - `RecurringTemplate` — captures schedule-driven items like rent and mortgage (from E).

- **`RecurringTemplate` *seeds* `LineItem`s.** Confirmed by user 2026-04-30. When a template's schedule fires it creates a real, independent `LineItem` row with an audit-only `SourceTemplateUID` back-reference. Once created the line item is fully mutable — edits to the template only affect future seedings. Reason: matches "planner not accounting" — adjusting this month's mortgage to reflect the actual payment shouldn't fight the schedule.

- **Recurrence model: fixed cadence enum (option A), plus a `CustomDays` member.** Confirmed by user 2026-04-30. Enum will likely include `Daily | Weekly | BiWeekly | Monthly | Quarterly | Annually | CustomDays`. Monthly is the dominant case (rent, mortgage). `CustomDays` covers "every N days" cases like "every 20 days."
- **Per-cadence settings: Shape 2 (distinct configuration per cadence).** Confirmed by user 2026-04-30. Each cadence has its own configuration fields (Monthly = day-of-month or "last day"; Weekly = day-of-week; BiWeekly = day-of-week + start anchor; Quarterly = month-of-quarter + day-of-month; Annually = month + day; CustomDays = interval + start date). Reason: better UX, handles edge cases like "31st of every month" cleanly.

- **Modeling approach: (1) flat table with nullable per-cadence columns + `Cadence` discriminator.** Confirmed by user 2026-04-30. Reason: anticipating many cadences and a desire to interpret them in service code (single dispatch point) rather than building a class per cadence. Validation will live in app code: "if Cadence == Monthly, DayOfMonth XOR UseLastDayOfMonth must be set," etc.

- **Materialization: (β) eagerly to a 12-month horizon, with an explicit `EndDate` on each template.** Confirmed by user 2026-04-30. Saving/editing a template seeds rows up to `min(today + 12 months, EndDate)`. Reason: the user needs to plan against future cash flow (mortgage, rent), and `EndDate` covers known stop points like a lease ending. Edits to a template wipe and re-seed unmodified future rows; manually edited future rows are preserved (rule TBD on how "manually edited" is detected — likely a `WasManuallyEdited` flag flipped on first user mutation).

- **`Category` is direction-typed with `Both` allowed.** Confirmed by user 2026-04-30 (revised from initial "Universal" pick same day). `Category.Direction: Income | Expense | Both` (int-backed enum). UI filters the category dropdown by the line item's direction — `Income`-typed and `Both`-typed categories show when entering an income line item; `Expense`-typed and `Both`-typed show when entering an expense. Reason: most categories are one-sided ("Salary" only makes sense as income, "Groceries" only as expense), so the typing prevents nonsense pairings — but legitimate bidirectional cases like "Rent" (paying a landlord vs. receiving from a tenant) are explicitly modeled rather than left to convention.

- **`LineItem` field shape locked.** Confirmed by user 2026-04-30. `UID` (Guid PK), `Direction` (`{Income=1, Expense=2}` int enum), `Amount` (`decimal(18,2)`, always positive — sign implied by `Direction`), `Date` (`DateOnly`), `Description` (`string?`, max 500), `CategoryUID` (Guid FK), `SourceTemplateUID` (Guid?, FK to `RecurringTemplate`, null for manual entries), `WasManuallyEdited` (`bool`, default `false`; flips on first user mutation of a seeded row so re-seeds skip it).
- **`Category` field shape locked.** Confirmed by user 2026-04-30. `UID` (Guid PK), `Name` (string max 100, required, unique case-insensitive), `Direction` (`CategoryDirection { Income=1, Expense=2, Both=3 }` — separate from `LineItem.Direction` so the type system rules out a "Both" line item), `Description` (string? max 500), `IsArchived` (bool, default false; archived = hidden from new-entry dropdowns, historical rows still render the name).

- **`RecurringTemplate` field shape locked.** Confirmed by user 2026-04-30.
  - **Common:** `UID` (Guid PK), `Name` (string max 100, required), `Direction` (same `Direction` enum as `LineItem`), `CategoryUID` (Guid FK; UI filters by `Direction` + `Both`), `Amount` (`decimal(18,2)`, always positive), `Description` (string? max 500, copied verbatim onto each seeded `LineItem`; subsequent edits don't propagate either way), `StartDate` (`DateOnly`, first eligible firing date), `EndDate` (`DateOnly?`, optional stop), `Cadence` (`Cadence` int-backed enum: `Daily=1, Weekly=2, BiWeekly=3, Monthly=4, Quarterly=5, Annually=6, CustomDays=7`).
  - **Per-cadence (all nullable):** `DayOfMonth` (`int?`, **constrained to 1-28** — see decision below), `UseLastDayOfMonth` (`bool`; for end-of-month cases use this instead of trying to set `DayOfMonth` to 29/30/31), `DayOfWeek` (`DayOfWeek?`), `MonthOfQuarter` (`int?`, 1-3 = first/second/third month of each quarter), `MonthOfYear` (`int?`, 1-12), `IntervalDays` (`int?`, >0).
  - **Validation per cadence in app code:** Daily = nothing extra; Weekly = `DayOfWeek` required; BiWeekly = `DayOfWeek` required (cycle anchored to `StartDate`, but `StartDate.DayOfWeek == DayOfWeek` is **not** enforced — see decision below); Monthly = `DayOfMonth` XOR `UseLastDayOfMonth`; Quarterly = `MonthOfQuarter` + (`DayOfMonth` XOR `UseLastDayOfMonth`); Annually = `MonthOfYear` + (`DayOfMonth` XOR `UseLastDayOfMonth`); CustomDays = `IntervalDays > 0`.
- **`DayOfMonth` is constrained to 1-28; UI prevents selecting 29-31.** Confirmed by user 2026-04-30. Reason: avoids the "30th in February" ambiguity without auto-fallback magic. End-of-month cases use `UseLastDayOfMonth = true` explicitly. Drops one source of behavioral surprise.
- **BiWeekly `StartDate.DayOfWeek == DayOfWeek` cross-check deferred.** Confirmed by user 2026-04-30. The two fields are accepted independently; we'll add the consistency check later if it bites in practice.

- **UI shape: (III) dashboard-first with month scoping.** Confirmed by user 2026-04-30. Three pages:
  - `/` (dashboard) — summary panels for a single selected month, with a month picker to navigate between months. Default = current month.
  - `/ledger` — full `LineItem` list with filters (date range, direction, category). Drill-down target from dashboard panels.
  - `/templates` — `RecurringTemplate` CRUD.

- **Dashboard is a placeholder for this iteration.** Confirmed by user 2026-04-30. Real summary work (graphs, widgets, drill-downs) deferred to a later iteration once we have data to look at. The page renders a "Dashboard — coming soon" stub with nav links to `/ledger` and `/templates`. Reason: ship the data infrastructure first, design the dashboard against real numbers second. Drill-down behavior (click a summary panel to filter the ledger) is captured as a future-work hook.

- **Architecture locked.** Confirmed by user 2026-04-30.
  - **Project structure:** `Controllers/` + `Managers/` + `Services/` + `Data/` (with `Entities/` and `Configurations/`) + `Dtos/` + `Validation/`.
  - **Validation: FluentValidation.** A validator per request DTO. Cross-field rules (per-cadence XOR constraints on `RecurringTemplate`) live there.
  - **Background jobs: Hangfire** (`Hangfire.AspNetCore` + `Hangfire.SqlServer`) on the same SQL Server as the app. Used for the eager horizon-extension job that re-runs daily to seed any newly-in-window occurrences. Re-seed-on-template-edit stays synchronous on the save call (fast, deterministic, predictable to the user).

## Open questions
- File structure for the React side.
- DTO shape per entity (Create/Update/Response separation).
- Field shape on each entity (Amount precision, Date type, etc.).
- Materialization timing — on-demand at query time, on a background pass, or eagerly N months ahead?
- UI shape (one ledger view? separate income/expense tabs? per-category breakdown?).

## Out of scope (this iteration)
- Multi-currency
- Soft delete / audit history
- Recurring schedules unless framing E is picked
- Imports unless framing F is picked
