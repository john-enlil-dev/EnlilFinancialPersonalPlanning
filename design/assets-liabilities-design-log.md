# Assets & Liabilities — Design Log

Verbatim capture of feedback and rules during the assets & liabilities design session. Append-only.

## 2026-05-08 10:00 — Feedback
- I want to set up an assets & liabilites portion of this software, can we design that together

## 2026-05-08 10:05 — Feedback
- (D) seems like it's the most likely to be useful long term

## 2026-05-08 10:10 — Feedback
- let's do it a little differently, let's do Long-Term Assets, Retirement Assets (which have tax implications), SImple Assets, Credit Card Debt, Mortgage Debt, and Savings

## 2026-05-08 10:15 — Feedback
- (iii) this should be Stocks, Housses, Jewelry, art, etc. But shoudl not have tax holdings like IRA or 401K

## 2026-05-08 10:20 — Feedback
- (b) let's go with that

## 2026-05-08 10:25 — Feedback
- (a)

## 2026-05-08 10:30 — Feedback
- (b) would be awesome

## 2026-05-08 10:35 — Feedback
- (C)

## 2026-05-08 10:40 — Feedback
- let's start with (a)

## 2026-05-08 10:45 — Feedback
- (A) we can do data analysis work later to create better reporting if need be

## 2026-05-08 10:50 — Feedback
- (b)

## 2026-05-08 10:55 — Feedback
- (C) I think that should be fine

## 2026-05-08 11:00 — Feedback
- (b) institution would be great

## 2026-05-08 11:05 — Feedback
- I think it should be (A) and we should do a react-select creatable UI so we can reuse house or Art and if we need to normalize later we can

## 2026-05-08 11:10 — Feedback
- (a)

## 2026-05-08 11:15 — Feedback
- (b)

## 2026-05-08 11:20 — Feedback
- (A)

## 2026-05-08 11:25 — Feedback
- (D) let's really dive in deep

## 2026-05-08 11:30 — Feedback
- (d) full depth

## 2026-05-08 11:35 — Feedback
- (d) full depth here too, thought we may strip it down later

## 2026-05-08 11:40 — Feedback
- (b) I would like to be able to mark a linked entity to effect the balance, with the line item for say mortgage we may need to also have an affect cost (since mortgage will have taxes, escrow, interest, and principal) so that we could have principal impact mortage, and then also we may want to store interest as a tax write off late (defer this consideration)

## 2026-05-08 11:40 — Rule
- Tax write-off tracking on mortgage interest (and similar interest-as-deduction concepts) is explicitly deferred to a later iteration. Do not design or build it now.

## 2026-05-08 11:45 — Feedback
- (c) per-component breakdown, this could be a M2M table potentially to keep from impacting line items

## 2026-05-08 11:45 — Rule
- Linkage between `LineItem` and asset/liability entities lives on a separate join entity, NOT on `LineItem` itself. Reason: keeps `LineItem` clean and avoids growing its column count for an A/L-specific concern. How to apply: `LineItem` gets zero new columns from the assets/liabilities work; all linkage data goes on `LineItemAllocation`.

## 2026-05-08 11:50 — Feedback
- (A) for now

## 2026-05-08 11:55 — Feedback
- (A)

## 2026-05-08 12:00 — Feedback
- (D)

## 2026-05-08 12:05 — Feedback
- (A) [slicing approach: horizontal layers, 5 slices, mirrors line-items pattern]

## 2026-05-08 12:30 — Rule
- Amortization regeneration authorized to wipe and re-create `AmortizationEntry` rows for a given `MortgageDebt` whenever the mortgage is created or updated. Reason: matches the established line-items "wipe and re-seed unmodified future rows" pattern for derived data. How to apply: `MortgageAmortizationService.RegenerateAsync(mortgageUid)` deletes all existing `AmortizationEntry` rows for that mortgage and inserts the freshly computed schedule in the same transaction. Authorized exception to the global "Never Delete Data" rule, scoped to derived amortization rows only.

## 2026-05-08 13:00 — Feedback
- in our mortgage screen, can we click into our mortgage screen, I would love to be able to back fill it and put in the amount of interest paid, see if we can really put information into it overtime, so is there a way we could add line items with information with payments, additional payments, escrow, etcs. with a full breakdown so that we could analyze costs & other things

## 2026-05-08 13:05 — Feedback
- (a) Detail Page. (i) where we can add payments, that then sorts based on dates. This should go backwards from current date to the first dates. And for analytics let's do full breakdown

## 2026-05-08 14:00 — Feedback
- can we update our mortgage lines items to allow for editing, and also can we add a date to the payments to allow for setting which month we want it to be (we sometimes have a payment for 11/30 when we want it to be for December

## 2026-05-08 14:00 — Rule
- Mortgage payment edits authorized to wipe-and-replace the `LineItemAllocation` rows for that LineItem (scoped to `LinkedEntityType=MortgageDebt` + `LinkedEntityUID=mortgage`). Reason: the per-component breakdown is purely derived from the user's form input — preserving stable allocation UIDs across edits would require an upsert-by-ComponentType path that's more code for no user-visible benefit. How to apply: in `UpdatePaymentAsync`, delete existing allocations matching `(LineItemUID, MortgageDebt, mortgageUid)` and insert a fresh set from the request's allocation list. The parent `LineItem` row itself is updated in place (Date, Description, Amount, CategoryUID, plus the new BillingMonth on each allocation). Authorized exception to the global "Never Delete Data" rule, scoped to mortgage payment allocation rows on update only.

## 2026-05-08 14:00 — Decision
- `BillingMonth: DateOnly?` (first-of-month convention) added to `LineItemAllocation`, not to `LineItem`, to keep the LineItem schema clean (consistent with the prior rule that A/L-specific fields stay off LineItem). The mortgage payment request carries one optional `BillingMonth` that the manager copies onto every allocation row.

## 2026-05-08 15:30 — Feedback
- I want to create savings with overview & line items to create a timeline of savings & how much we've had and then what we've withdrew & why to create a story of what's going on with savings

## 2026-05-08 15:35 — Feedback
- let's start with (A) as a basis. (ii) and let's do (alpha) but let's also create a category column for savings that is different from our standard categories that allows us to do metrics later (it will be select option with create for gruoping instead of a DB table for now)

## 2026-05-08 15:35 — Decision
- New free-form `Tag: string?` column added to `LineItemAllocation` (not a separate table). Reason: per user feedback — savings-specific grouping for analytics without the overhead of a dedicated lookup table. Frontend uses a react-select Creatable populated from existing distinct `Tag` values, so the user can reuse "Vacation" / "Emergency fund" / "Bonus" or invent new ones inline. Stored alongside `ComponentType` on the same allocation row; the field is generic at the schema layer (other A/L types could reuse it later) but its v1 use is savings transactions.

## 2026-05-08 17:00 — Feedback
- Next up on our list, we need line items and overviews for credit cards as well, same shebang as savings & mortgages, I'm headed out for the evening so getting it implemented is on you

## 2026-05-08 17:00 — Decision
- Credit Card Debt detail page mirrors the Savings pattern (which mirrors Mortgage). Same primitives: `LineItem` + `LineItemAllocation` with `LinkedEntityType.CreditCardDebt`. Detail page at `/liabilities/credit-cards/:uid` — Overview / Line Items tabs, summary header (10 stats × 2 rows), per-year cards on the left, balance line + monthly net-change bar on the right, transaction history with edit per row, add-transaction modal.
- Component types: `Charge`, `Payment`, `Interest`, `Fee`, `Refund`. Sign convention is **inverted from savings** because credit card balance represents debt: Charge / Interest / Fee increase the balance; Payment / Refund decrease it. Color convention also flips — net positive (debt grew) is red, net negative (debt paid down) is green.
- Tag column reused (already on `LineItemAllocation`); same react-select Creatable UX.
- `LineItem.Direction` follows the picked category (same logic as savings) — no enforced filter.
