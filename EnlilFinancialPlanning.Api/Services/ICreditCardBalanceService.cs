namespace EnlilFinancialPlanning.Api.Services;

public interface ICreditCardBalanceService
{
    /// <summary>
    /// Computes the balance as of <paramref name="asOf"/>: latest anchor on/before that
    /// date + signed sum of line items strictly after the anchor and on/before asOf.
    /// </summary>
    Task<decimal> ComputeBalanceAsync(Guid creditCardUid, DateOnly asOf, CancellationToken ct);

    /// <summary>
    /// Recomputes the cached <c>CurrentBalance</c> (as of today), updates the card's
    /// as-of date, and writes a snapshot. Call after any line-item or anchor change.
    /// </summary>
    Task RecomputeAsync(Guid creditCardUid, CancellationToken ct);

    /// <summary>
    /// One-time/idempotent backfill: gives every existing card lacking an opening anchor
    /// one (at its current balance/as-of date), then recomputes its cache.
    /// </summary>
    Task BackfillOpeningAnchorsAsync(CancellationToken ct);
}
