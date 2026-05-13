using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;
using EnlilFinancialPlanning.Api.Dtos.CreditCardTransactions;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class CreditCardDebtManager(AppDbContext db)
{
    public async Task<IReadOnlyList<CreditCardDebtResponse>> ListAsync(CancellationToken ct)
        => await db.CreditCardDebts.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new CreditCardDebtResponse(
                x.UID, x.Name, x.Institution, x.APR, x.CreditLimit, x.MinimumPayment, x.CurrentBalance, x.CurrentAsOfDate))
            .ToListAsync(ct);

    public async Task<CreditCardDebtResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.CreditCardDebts.AsNoTracking().FirstOrDefaultAsync(c => c.UID == uid, ct);
        return x is null ? null : ToResponse(x);
    }

    public async Task<CreditCardDebtResponse> CreateAsync(CreateCreditCardDebtRequest request, CancellationToken ct)
    {
        var entity = new CreditCardDebt
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Institution = request.Institution?.Trim(),
            APR = request.APR,
            CreditLimit = request.CreditLimit,
            MinimumPayment = request.MinimumPayment,
            CurrentBalance = request.CurrentBalance,
            CurrentAsOfDate = request.CurrentAsOfDate,
        };
        db.CreditCardDebts.Add(entity);
        db.CreditCardDebtSnapshots.Add(new CreditCardDebtSnapshot
        {
            UID = Guid.NewGuid(),
            CreditCardDebtUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<CreditCardDebtResponse?> UpdateAsync(Guid uid, UpdateCreditCardDebtRequest request, CancellationToken ct)
    {
        var entity = await db.CreditCardDebts.FirstOrDefaultAsync(c => c.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Institution = request.Institution?.Trim();
        entity.APR = request.APR;
        entity.CreditLimit = request.CreditLimit;
        entity.MinimumPayment = request.MinimumPayment;
        entity.CurrentBalance = request.CurrentBalance;
        entity.CurrentAsOfDate = request.CurrentAsOfDate;

        db.CreditCardDebtSnapshots.Add(new CreditCardDebtSnapshot
        {
            UID = Guid.NewGuid(),
            CreditCardDebtUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    private static CreditCardDebtResponse ToResponse(CreditCardDebt c)
        => new(c.UID, c.Name, c.Institution, c.APR, c.CreditLimit, c.MinimumPayment, c.CurrentBalance, c.CurrentAsOfDate);

    // ---- Transaction history (history-only — AffectsLinkedBalance=false; the
    // card's CurrentBalance is maintained by direct edits to the card row, not
    // by these allocations.) ---------------------------------------------------

    public async Task<IReadOnlyList<CreditCardTransactionResponse>?> ListTransactionsAsync(
        Guid creditCardUid, CancellationToken ct)
    {
        var exists = await db.CreditCardDebts.AnyAsync(c => c.UID == creditCardUid, ct);
        if (!exists) return null;

        var allocations = await db.LineItemAllocations.AsNoTracking()
            .Where(a => a.LinkedEntityType == LinkedEntityType.CreditCardDebt
                     && a.LinkedEntityUID == creditCardUid)
            .ToListAsync(ct);

        if (allocations.Count == 0) return Array.Empty<CreditCardTransactionResponse>();

        var lineItemUids = allocations.Select(a => a.LineItemUID).Distinct().ToList();
        var lineItems = await db.LineItems.AsNoTracking()
            .Include(li => li.Category)
            .Where(li => lineItemUids.Contains(li.UID))
            .ToListAsync(ct);

        var allocByLineItem = allocations.ToLookup(a => a.LineItemUID);

        return lineItems
            .OrderByDescending(li => li.Date)
            .ThenByDescending(li => li.UID)
            .Select(li =>
            {
                var allocation = allocByLineItem[li.UID].First();
                return new CreditCardTransactionResponse(
                    li.UID,
                    li.Date,
                    allocation.BillingMonth,
                    li.Direction,
                    allocation.ComponentType,
                    allocation.Amount,
                    allocation.Tag,
                    li.Description,
                    li.CategoryUID,
                    li.Category?.Name ?? string.Empty,
                    allocation.UID);
            })
            .ToList();
    }

    public async Task<CreditCardTransactionResponse?> CreateTransactionAsync(
        Guid creditCardUid, CreateCreditCardTransactionRequest request, CancellationToken ct)
    {
        var exists = await db.CreditCardDebts.AnyAsync(c => c.UID == creditCardUid, ct);
        if (!exists) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var componentType = request.ComponentType.Trim();
        var direction = DirectionFor(componentType, category.Direction);

        var lineItem = new LineItem
        {
            UID = Guid.NewGuid(),
            Direction = direction,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description?.Trim(),
            CategoryUID = request.CategoryUID,
        };
        db.LineItems.Add(lineItem);

        var allocation = new LineItemAllocation
        {
            UID = Guid.NewGuid(),
            LineItemUID = lineItem.UID,
            LinkedEntityUID = creditCardUid,
            LinkedEntityType = LinkedEntityType.CreditCardDebt,
            ComponentType = componentType,
            Amount = request.Amount,
            AffectsLinkedBalance = false,
            BillingMonth = request.BillingMonth,
            Tag = string.IsNullOrWhiteSpace(request.Tag) ? null : request.Tag.Trim(),
        };
        db.LineItemAllocations.Add(allocation);

        await db.SaveChangesAsync(ct);

        lineItem.Category = category;
        return ToTransactionResponse(lineItem, allocation);
    }

    public async Task<CreditCardTransactionResponse?> UpdateTransactionAsync(
        Guid creditCardUid, Guid lineItemUid, CreateCreditCardTransactionRequest request, CancellationToken ct)
    {
        var exists = await db.CreditCardDebts.AnyAsync(c => c.UID == creditCardUid, ct);
        if (!exists) return null;

        var lineItem = await db.LineItems.FirstOrDefaultAsync(li => li.UID == lineItemUid, ct);
        if (lineItem is null) return null;

        var allocation = await db.LineItemAllocations.FirstOrDefaultAsync(
            a => a.LineItemUID == lineItemUid
              && a.LinkedEntityType == LinkedEntityType.CreditCardDebt
              && a.LinkedEntityUID == creditCardUid,
            ct);
        if (allocation is null) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var componentType = request.ComponentType.Trim();
        var direction = DirectionFor(componentType, category.Direction);

        lineItem.Direction = direction;
        lineItem.Amount = request.Amount;
        lineItem.Date = request.Date;
        lineItem.Description = request.Description?.Trim();
        lineItem.CategoryUID = request.CategoryUID;

        allocation.ComponentType = componentType;
        allocation.Amount = request.Amount;
        allocation.BillingMonth = request.BillingMonth;
        allocation.Tag = string.IsNullOrWhiteSpace(request.Tag) ? null : request.Tag.Trim();

        await db.SaveChangesAsync(ct);

        lineItem.Category = category;
        return ToTransactionResponse(lineItem, allocation);
    }

    // LineItem.Direction follows the picked category — same semantic as savings.
    // For "Both" categories we fall back to the credit-card-side semantic: payments
    // and refunds reduce the bill (the user is paying it down → Income from card's
    // perspective; cash flow categorization can vary). For Charge / Interest / Fee,
    // it's an Expense in cash-flow terms.
    private static Direction DirectionFor(string componentType, CategoryDirection categoryDirection)
    {
        return categoryDirection switch
        {
            CategoryDirection.Income => Direction.Income,
            CategoryDirection.Expense => Direction.Expense,
            _ => componentType.Trim().ToLowerInvariant() switch
            {
                "payment" or "refund" => Direction.Income,
                _ => Direction.Expense,
            },
        };
    }

    private static CreditCardTransactionResponse ToTransactionResponse(LineItem li, LineItemAllocation a)
        => new(
            li.UID,
            li.Date,
            a.BillingMonth,
            li.Direction,
            a.ComponentType,
            a.Amount,
            a.Tag,
            li.Description,
            li.CategoryUID,
            li.Category?.Name ?? string.Empty,
            a.UID);
}
