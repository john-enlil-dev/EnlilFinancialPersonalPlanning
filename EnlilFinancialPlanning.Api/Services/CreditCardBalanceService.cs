using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services;

public sealed class CreditCardBalanceService(AppDbContext db, TimeProvider timeProvider)
    : ICreditCardBalanceService
{
    public async Task<decimal> ComputeBalanceAsync(Guid creditCardUid, DateOnly asOf, CancellationToken ct)
    {
        var anchor = await db.CreditCardBalanceAnchors.AsNoTracking()
            .Where(a => a.CreditCardDebtUID == creditCardUid && a.Date <= asOf)
            .OrderByDescending(a => a.Date)
            .ThenByDescending(a => a.AdjustmentLineItemUID != null) // reconciliation wins ties over opening
            .FirstOrDefaultAsync(ct);

        var baseBalance = anchor?.AssertedBalance ?? 0m;
        var anchorDate = anchor?.Date ?? DateOnly.MinValue;

        // Signed sum of line items strictly after the anchor date and on/before asOf.
        var items = await db.LineItemAllocations.AsNoTracking()
            .Where(a => a.LinkedEntityType == LinkedEntityType.CreditCardDebt
                     && a.LinkedEntityUID == creditCardUid)
            .Join(db.LineItems.AsNoTracking(),
                  a => a.LineItemUID,
                  li => li.UID,
                  (a, li) => new { a.ComponentType, a.Amount, li.Direction, li.Date })
            .Where(x => x.Date > anchorDate && x.Date <= asOf)
            .ToListAsync(ct);

        var sum = baseBalance;
        foreach (var x in items)
            sum += CreditCardLedger.SignedDebtDelta(x.ComponentType, x.Direction, x.Amount);

        return sum;
    }

    public async Task RecomputeAsync(Guid creditCardUid, CancellationToken ct)
    {
        var card = await db.CreditCardDebts.FirstOrDefaultAsync(c => c.UID == creditCardUid, ct);
        if (card is null) return;

        var asOf = DateOnly.FromDateTime(timeProvider.GetLocalNow().DateTime);
        var balance = await ComputeBalanceAsync(creditCardUid, asOf, ct);

        card.CurrentBalance = balance;
        card.CurrentAsOfDate = asOf;

        db.CreditCardDebtSnapshots.Add(new CreditCardDebtSnapshot
        {
            UID = Guid.NewGuid(),
            CreditCardDebtUID = card.UID,
            Date = asOf,
            Balance = balance,
        });

        await db.SaveChangesAsync(ct);
    }

    public async Task BackfillOpeningAnchorsAsync(CancellationToken ct)
    {
        var cardsNeedingAnchor = await db.CreditCardDebts
            .Where(c => !db.CreditCardBalanceAnchors.Any(a => a.CreditCardDebtUID == c.UID && a.IsOpening))
            .Select(c => new { c.UID, c.CurrentBalance, c.CurrentAsOfDate })
            .ToListAsync(ct);

        if (cardsNeedingAnchor.Count == 0) return;

        foreach (var c in cardsNeedingAnchor)
        {
            db.CreditCardBalanceAnchors.Add(new CreditCardBalanceAnchor
            {
                UID = Guid.NewGuid(),
                CreditCardDebtUID = c.UID,
                Date = c.CurrentAsOfDate,
                AssertedBalance = c.CurrentBalance,
                AdjustmentAmount = 0m,
                IsOpening = true,
                Note = "Opening balance (backfilled)",
            });
        }
        await db.SaveChangesAsync(ct);

        // D8: existing post-anchor transactions now drive the cache (balances may change).
        foreach (var c in cardsNeedingAnchor)
            await RecomputeAsync(c.UID, ct);
    }
}
