# Credit Card Balance Driven by Line Items

Status: **Built — pending EF migration** (2026-06-15)

## Required follow-up (you run these)
A new table `CreditCardBalanceAnchors` was added. From VS Package Manager Console:
1. Stop the API if it's running.
2. `Add-Migration CreditCardBalanceAnchors`
3. `Update-Database`
4. Start the API — on startup it backfills an opening anchor for every existing card
   (at its current balance/as-of date) and recomputes balances from post-anchor line items.

## Goal / motivation
Today a credit card's `CurrentBalance` is a stored column edited by hand. Charges and
payments are recorded as line items (`LineItem` + `LineItemAllocation` with
`ComponentType` of Charge/Payment/Interest/Fee/Refund) but they are **history-only** —
allocations have `AffectsLinkedBalance = false`, so they do not move the balance.

We want the **ledger to become the source of truth**: a card's balance should be computed
from its line items (charges/interest/fees increase debt; payments/refunds decrease it),
so that adding an expense or a payment updates the balance automatically.

## Current state (verified 2026-06-15)
- `CreditCardDebt.CurrentBalance` — stored decimal, set at create, manually edited on update.
- `CreditCardDebtSnapshot` — append-only balance history, written on create/update. Not read back anywhere yet.
- `CreditCardDebtManager.CreateTransactionAsync` creates a `LineItem` + `LineItemAllocation`
  with `AffectsLinkedBalance = false` — does not touch `CurrentBalance`.
- `BalanceAffectService.ApplyAllocationAsync` exists and can increment a stored balance, but:
  - it's written for assets (delta sign assumes higher = more value),
  - it has no reversal path for edited/deleted allocations,
  - it's not invoked by the credit card transaction flow.
- No opening-balance concept anywhere. No reconciliation/adjustment concept anywhere.

## Decisions
_(chronological — appended as we walk through)_
- Scope = "balance driven by line items" for credit cards (user pick, 2026-06-15).
- Compute model = **A (derived-on-read, opening balance)** blended with **D (reconciliation anchor)** (user pick, 2026-06-15). Balance computed as anchor + signed sum of line items since; reconciliation lets the user assert the true statement balance and the system records drift as an adjustment.
- **D1 — anchor model:** unify opening balance and reconciliations into a single dated balance-anchor concept; opening balance is just the first anchor.
- **D2 — stored balance:** keep `CurrentBalance` as a denormalized **cache**, recomputed on every line-item/anchor change for the card.
- **D3 — sign source:** sign each line item from `ComponentType` — Charge/Interest/Fee/Adjustment(+) increase debt, Payment/Refund decrease it (Adjustment can be ±).
- **D4 — drift:** when reconciling, record an `Adjustment` line item for the gap (`asserted − computed`); ledger stays continuous and drift is itemized.
- **D5 — date boundary:** balance = anchor + Σ(line items with `Date > anchorDate`); same-day-as-anchor items are considered baked into the asserted balance.
- **D6 — adjustment category:** the user picks the `CategoryUID` at reconcile time; `LineItem.CategoryUID` stays non-nullable.
- **D7 — direct balance edit:** keep the balance field on the card edit form, but saving it performs a reconcile (prompts category, creates an adjustment anchor).
- **D8 — migration:** seed each existing card's opening anchor at its `CurrentAsOfDate` with its current `CurrentBalance`, then let post-anchor transactions recompute the cache (accepting that some displayed balances change).
- **D9 — snapshots:** keep `CreditCardDebtSnapshot`; write a row on each cache recompute.
- **D10 — delete:** add a delete-transaction endpoint that removes the line item + allocation and recomputes.
- **D11 — visibility:** surface a Reconciliations section on the card detail page (list anchors with date/asserted balance/resulting adjustment; add + delete).

## Computation (canonical)
For a card, on any date `d`:
```
anchor   = latest BalanceAnchor with Date <= d   (opening anchor always exists)
balance(d) = anchor.AssertedBalance
           + Σ over CC line items L where L.Date > anchor.Date AND L.Date <= d of signed(L)
signed(L) = +Amount if ComponentType in {Charge, Interest, Fee} or (Adjustment with +)
            -Amount if ComponentType in {Payment, Refund} or (Adjustment with -)
```
`CurrentBalance` cache = `balance(today)`, recomputed (and a snapshot written) on every
create/update/delete of a CC line item, on every anchor create/delete, and at migration.
Derivation ignores the legacy `AffectsLinkedBalance` flag for credit cards.

## Open questions
- _(none blocking — resolved in D1–D11)_

## Out of scope
- Recurring/scheduled charges and payments (separate effort).
- Applying the same anchor model to other entity types (Savings, mortgage) — credit cards only for now.
