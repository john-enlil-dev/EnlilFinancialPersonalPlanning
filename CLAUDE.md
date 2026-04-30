# Project Rules

## No Brittle Unit Tests
Tests must survive refactors that don't change behavior.
- **Test behavior, not implementation.** Assert on observable outputs (HTTP status + body shape, rendered text, side-effects). Do not assert on private fields, internal method call order, or CSS class names.
- **Query by role/label/text in frontend tests.** Use `getByRole`, `getByLabelText`, `getByText`. No CSS-class or DOM-structure selectors. For Playwright, use `getByRole`/`getByLabel`/`getByText` or stable `data-testid` — never raw CSS selectors.
- **Mock at boundaries, not internals.** Replace the HTTP client, external services, the clock. Do NOT mock the managers/services/components under test or your own DbContext collaborators.
- **No sleeps, no `waitForTimeout`, no hardcoded delays.** Use auto-waiting assertions or `findBy*` queries.
- **One behavior per test** with minimal setup. Shared setup goes in builders/fixtures, not test bodies.
- **No broad snapshots.** Assert on the specific fields that matter for the behavior under test.
- **Deterministic data via builders.** Use a `TestDataBuilder`/factory with sensible defaults; tests override only the fields they assert on.
- **Isolate state.** Fresh in-memory DB / AuthContext / Playwright context per test. No shared mutable state.
- **Don't test third-party libraries.** Test integration points and your own logic, not framework internals.

## React: Always Use Render Functions
- **Never put complex inline JSX into component props or directly in the return.** Extract into local `renderXyz()` functions first.
- The component's `return` should read like a table of contents — each section is a `renderXyz()` call.
- Example: instead of `<PageHeader rightContent={<div>...50 lines...</div>} />`, write `renderStatusChips()` and pass `rightContent={renderStatusChips()}`.
- Use the centralized button render functions from `src/UI/functions/render-skeleton-button-functions.tsx`:
  - `RenderPrimaryButton` — main actions (save, add, submit, generate, confirm)
  - `RenderDefaultButton` — secondary actions (cancel, edit, navigation, toggles, filters, close)
  - `RenderDangerButton` — destructive actions (delete)
- Never use raw `<button>` elements.

## UI Library: Reactstrap
- **All UI components come from Reactstrap.** Use `Button`, `Card`, `Modal`, `Form`, `Input`, `Table`, `Nav`, etc. from `reactstrap`.
- Do not introduce other component libraries (MUI, Chakra, Ant Design, shadcn, etc.) — pick one and stay consistent.
- Custom components are fine when Reactstrap doesn't cover the case, but compose them on top of Reactstrap primitives rather than replacing them.
- Bootstrap 5 utility classes are available for spacing/layout (`mt-3`, `d-flex`, `gap-2`, etc.) — prefer these over inline styles.

## Data Access: EF Core
- **All database access goes through EF Core.** No Dapper, no raw `SqlConnection`, no micro-ORMs.
- Every project that uses EF Core must include both packages as `PrivateAssets="all"`:
  - `Microsoft.EntityFrameworkCore.Design`
  - `Microsoft.EntityFrameworkCore.Tools` (enables `Add-Migration` / `Update-Database` in PMC)
- The user runs migrations themselves from VS Package Manager Console — do not run `dotnet ef migrations add` or `dotnet ef database update`, and do not hand-author files under `Migrations/`.
- IDs are `Guid` (C#) / `string` (TS), property name is `UID` (not `Id`), generated with `Guid.NewGuid()` / `NEWID()` — never sequential.
- Raw SQL via `ExecuteSqlRaw`/`ExecuteSqlInterpolated` is reserved for read-only or explicitly-requested operations; never use it to bypass the model.

## Socratic Prompting
- **Default to asking, not assuming.** When the user gives a request that has any ambiguity — unclear scope, multiple reasonable interpretations, missing constraints, or a choice between tradeoffs — ask a focused question before acting.
- **One question at a time.** Don't fire a list of five clarifying questions; pick the single most load-bearing unknown, ask it tight, wait for the answer.
- **Ask to surface intent, not to stall.** Good Socratic questions narrow the design space ("are we optimizing for X or Y here?", "should this run per-user or per-tenant?"). Avoid procedural questions whose answer is obvious from context.
- **Skip the asking only when:** the task is mechanical (rename, formatting, single-file bug fix), the user has explicitly specified the approach, or you're answering a factual question.

## Line-by-Line Design With Call and Response
- **Whenever scoping, designing, or planning a non-trivial change, work line by line.** Present **one bullet, one decision, or one tradeoff at a time** — tight, then stop and wait for the user's reaction before moving to the next.
- Treat each line as a checkpoint, not a polished section. Length per turn: a few lines, not paragraphs.
- **Do NOT dump a complete proposal and end with two summary questions.** That hides disagreement until it's expensive and turns design into a presentation instead of a conversation.
- For larger designs, first **diverge** — list 4–6 genuinely different framings (different primitives, scopes, sequencing, optimization targets) so the user sees the design space — then once they pick a direction, walk through line by line.
- Apply to: new features, new entities/tables, new pages, new integrations, architectural refactors, anything introduced with words like "design," "scope," "plan," or "how should we build."
- Skip for: bug fixes, mechanical refactors, routine dependency bumps, tasks where the user has already specified the approach.

## Project Markdown Files: Living Design Docs
- **Every non-trivial feature, system, or initiative gets a markdown doc** (e.g. `docs/<feature-name>.md`) created at the start of design work. The doc holds the goal, the chosen approach, the open questions, and the decisions made so far.
- **Update the doc after every feedback item.** When the user pushes back, picks between options, corrects a direction, or confirms an approach, capture the decision (and its reason) in the doc before moving on. The doc is the running source of truth — the conversation transcript is not.
- Structure each doc with:
  - **Goal / motivation** — why this exists, who it serves.
  - **Decisions** — chronological list of resolved questions with the reason ("chose X over Y because Z").
  - **Open questions** — what's still unresolved, with the options on the table.
  - **Out of scope** — what we explicitly decided not to do.
- Keep entries short — a sentence or two per decision. The doc is for navigation, not narrative.
- When a feature ships, the doc stays — it becomes the design record. Don't delete it; mark it as shipped at the top.
