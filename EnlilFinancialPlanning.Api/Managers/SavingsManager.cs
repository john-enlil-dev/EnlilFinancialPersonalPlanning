using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.Savings;
using EnlilFinancialPlanning.Api.Dtos.SavingsTransactions;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class SavingsManager(AppDbContext db)
{
    public async Task<IReadOnlyList<SavingsResponse>> ListAsync(CancellationToken ct)
        => await db.Savings.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new SavingsResponse(
                x.UID, x.Name, x.Institution, x.Subtype, x.CompoundingFrequency,
                x.CurrentRate, x.CurrentRateAsOfDate, x.CurrentValue, x.CurrentValueAsOfDate))
            .ToListAsync(ct);

    public async Task<SavingsResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.Savings.AsNoTracking().FirstOrDefaultAsync(s => s.UID == uid, ct);
        return x is null ? null : ToResponse(x);
    }

    public async Task<SavingsResponse> CreateAsync(CreateSavingsRequest request, CancellationToken ct)
    {
        var entity = new Savings
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Institution = request.Institution?.Trim(),
            Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim(),
            CompoundingFrequency = request.CompoundingFrequency,
            CurrentRate = request.CurrentRate,
            CurrentRateAsOfDate = request.CurrentRateAsOfDate,
            CurrentValue = request.CurrentValue,
            CurrentValueAsOfDate = request.CurrentValueAsOfDate,
        };
        db.Savings.Add(entity);

        db.SavingsValueSnapshots.Add(new SavingsValueSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentValueAsOfDate,
            Value = entity.CurrentValue,
        });
        db.SavingsRateSnapshots.Add(new SavingsRateSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentRateAsOfDate,
            Rate = entity.CurrentRate,
        });

        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<SavingsResponse?> UpdateAsync(Guid uid, UpdateSavingsRequest request, CancellationToken ct)
    {
        var entity = await db.Savings.FirstOrDefaultAsync(s => s.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Institution = request.Institution?.Trim();
        entity.Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim();
        entity.CompoundingFrequency = request.CompoundingFrequency;
        entity.CurrentRate = request.CurrentRate;
        entity.CurrentRateAsOfDate = request.CurrentRateAsOfDate;
        entity.CurrentValue = request.CurrentValue;
        entity.CurrentValueAsOfDate = request.CurrentValueAsOfDate;

        db.SavingsValueSnapshots.Add(new SavingsValueSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentValueAsOfDate,
            Value = entity.CurrentValue,
        });
        db.SavingsRateSnapshots.Add(new SavingsRateSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentRateAsOfDate,
            Rate = entity.CurrentRate,
        });

        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    private static SavingsResponse ToResponse(Savings s)
        => new(s.UID, s.Name, s.Institution, s.Subtype, s.CompoundingFrequency,
            s.CurrentRate, s.CurrentRateAsOfDate, s.CurrentValue, s.CurrentValueAsOfDate);

    // ---- Transaction history (history-only — AffectsLinkedBalance=false; the
    // savings account's CurrentValue is maintained by direct edits to the savings
    // row, not by these allocations.) -------------------------------------------

    public async Task<IReadOnlyList<SavingsTransactionResponse>?> ListTransactionsAsync(
        Guid savingsUid, CancellationToken ct)
    {
        var savingsExists = await db.Savings.AnyAsync(s => s.UID == savingsUid, ct);
        if (!savingsExists) return null;

        var allocations = await db.LineItemAllocations.AsNoTracking()
            .Where(a => a.LinkedEntityType == LinkedEntityType.Savings
                     && a.LinkedEntityUID == savingsUid)
            .ToListAsync(ct);

        if (allocations.Count == 0) return Array.Empty<SavingsTransactionResponse>();

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
                // One transaction = one allocation, but defensive: pick the first.
                var allocation = allocByLineItem[li.UID].First();
                return new SavingsTransactionResponse(
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

    public async Task<SavingsTransactionResponse?> CreateTransactionAsync(
        Guid savingsUid, CreateSavingsTransactionRequest request, CancellationToken ct)
    {
        var savingsExists = await db.Savings.AnyAsync(s => s.UID == savingsUid, ct);
        if (!savingsExists) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var componentType = request.ComponentType.Trim();
        var (direction, isCashMovement) = LedgerEffectFor(componentType);

        var lineItem = new LineItem
        {
            UID = Guid.NewGuid(),
            Direction = direction,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description?.Trim(),
            CategoryUID = request.CategoryUID,
            IsCashMovement = isCashMovement,
        };
        db.LineItems.Add(lineItem);

        var allocation = new LineItemAllocation
        {
            UID = Guid.NewGuid(),
            LineItemUID = lineItem.UID,
            LinkedEntityUID = savingsUid,
            LinkedEntityType = LinkedEntityType.Savings,
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

    public async Task<SavingsTransactionResponse?> UpdateTransactionAsync(
        Guid savingsUid, Guid lineItemUid, CreateSavingsTransactionRequest request, CancellationToken ct)
    {
        var savingsExists = await db.Savings.AnyAsync(s => s.UID == savingsUid, ct);
        if (!savingsExists) return null;

        var lineItem = await db.LineItems.FirstOrDefaultAsync(li => li.UID == lineItemUid, ct);
        if (lineItem is null) return null;

        var allocation = await db.LineItemAllocations.FirstOrDefaultAsync(
            a => a.LineItemUID == lineItemUid
              && a.LinkedEntityType == LinkedEntityType.Savings
              && a.LinkedEntityUID == savingsUid,
            ct);
        if (allocation is null) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var componentType = request.ComponentType.Trim();
        var (direction, isCashMovement) = LedgerEffectFor(componentType);

        lineItem.Direction = direction;
        lineItem.Amount = request.Amount;
        lineItem.Date = request.Date;
        lineItem.Description = request.Description?.Trim();
        lineItem.CategoryUID = request.CategoryUID;
        lineItem.IsCashMovement = isCashMovement;

        allocation.ComponentType = componentType;
        allocation.Amount = request.Amount;
        allocation.BillingMonth = request.BillingMonth;
        allocation.Tag = string.IsNullOrWhiteSpace(request.Tag) ? null : request.Tag.Trim();

        await db.SaveChangesAsync(ct);

        lineItem.Category = category;
        return ToTransactionResponse(lineItem, allocation);
    }

    // ---- One-shot data repair tool --------------------------------------------
    // Walks every LineItem linked to a Savings entity and rewrites its Direction +
    // IsCashMovement to match the rules in LedgerEffectFor. Safe to run multiple
    // times — already-correct rows are left untouched. Pass dryRun=true to see
    // what *would* change without writing.
    public async Task<RepairLedgerPolarityReport> RepairLedgerPolarityAsync(
        bool dryRun, CancellationToken ct)
    {
        var savingsAllocations = await db.LineItemAllocations
            .Where(a => a.LinkedEntityType == LinkedEntityType.Savings)
            .Select(a => new { a.LineItemUID, a.ComponentType })
            .ToListAsync(ct);

        var lineItemUids = savingsAllocations.Select(a => a.LineItemUID).Distinct().ToList();
        var lineItems = await db.LineItems
            .Where(li => lineItemUids.Contains(li.UID))
            .ToListAsync(ct);
        var byUid = lineItems.ToDictionary(li => li.UID);

        var totalScanned = 0;
        var updated = 0;
        var alreadyCorrect = 0;
        var unknown = 0;
        var updatedByComponentType = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var alloc in savingsAllocations)
        {
            totalScanned++;
            if (!byUid.TryGetValue(alloc.LineItemUID, out var li)) continue;

            var componentType = alloc.ComponentType ?? string.Empty;
            var key = componentType.Trim().ToLowerInvariant();
            if (key is not ("deposit" or "withdrawal" or "interest" or "fee" or "transfer"))
            {
                unknown++;
                continue;
            }

            var (expectedDirection, expectedIsCash) = LedgerEffectFor(componentType);
            if (li.Direction == expectedDirection && li.IsCashMovement == expectedIsCash)
            {
                alreadyCorrect++;
                continue;
            }

            if (!dryRun)
            {
                li.Direction = expectedDirection;
                li.IsCashMovement = expectedIsCash;
            }
            updated++;
            updatedByComponentType[componentType] =
                updatedByComponentType.GetValueOrDefault(componentType) + 1;
        }

        if (!dryRun && updated > 0)
        {
            await db.SaveChangesAsync(ct);
        }

        return new RepairLedgerPolarityReport(
            dryRun,
            totalScanned,
            updated,
            alreadyCorrect,
            unknown,
            updatedByComponentType);
    }

    // Ledger reflects cash, not the savings holding. Cash polarity is inverted
    // relative to savings: a deposit moves cash OUT of checking (Expense), a
    // withdrawal moves cash INTO checking (Income). Interest/Fee/Transfer don't
    // touch cash at all — they get IsCashMovement=false so ledger consumers
    // filter them out, but we still write the LineItem so the savings history
    // page can render them.
    private static (Direction direction, bool isCashMovement) LedgerEffectFor(string componentType)
        => componentType.Trim().ToLowerInvariant() switch
        {
            "deposit" => (Direction.Expense, true),
            "withdrawal" => (Direction.Income, true),
            "interest" => (Direction.Income, false),
            "fee" => (Direction.Expense, false),
            "transfer" => (Direction.Expense, false),
            _ => (Direction.Expense, false),
        };

    private static SavingsTransactionResponse ToTransactionResponse(LineItem li, LineItemAllocation a)
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
