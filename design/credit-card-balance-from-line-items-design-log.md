# Credit Card Balance From Line Items — Design Log

## 2026-06-15 13:29 — Feedback
- Can we work on our credit card management and add line items & ability to manage expenses / payments

## 2026-06-15 13:29 — Feedback
- (Scope pick) Balance driven by line items

## 2026-06-15 13:31 — Feedback
- A, with reconciliation from D

## 2026-06-15 13:33 — Feedback
- (Decision 1, anchor model) (a) unify them

## 2026-06-15 13:34 — Feedback
- (Decision 2, stored balance) (b) cache it

## 2026-06-15 13:35 — Feedback
- (Decision 3, sign source) (a) sign from ComponentType

## 2026-06-15 13:36 — Feedback
- (Decision 4, drift) (b) record an adjustment line item

## 2026-06-15 13:37 — Feedback
- (Decision 5, date boundary) (a) strictly after

## 2026-06-15 13:38 — Feedback
- (Decision 6, adjustment category) (c) user picks a category at reconcile time

## 2026-06-15 13:39 — Feedback
- (Decision 7, direct balance edit) (b) saving the balance field performs a reconcile

## 2026-06-15 13:40 — Feedback
- (Decision 8, migration) (B) seed opening anchor at CurrentAsOfDate and let post-anchor transactions recompute

## 2026-06-15 13:41 — Feedback
- (Decision 9, snapshots) (b) keep snapshots, write on each recompute

## 2026-06-15 13:42 — Feedback
- (Decision 10, delete) (a) add a delete endpoint

## 2026-06-15 13:43 — Feedback
- (Decision 11, anchor visibility) (a) surface them
