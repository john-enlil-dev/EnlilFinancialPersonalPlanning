using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services;

public sealed class BalanceAffectService(AppDbContext db) : IBalanceAffectService
{
    public async Task ApplyAllocationAsync(Guid allocationUID, CancellationToken ct)
    {
        var allocation = await db.LineItemAllocations
            .Include(a => a.LineItem)
            .FirstOrDefaultAsync(a => a.UID == allocationUID, ct);

        if (allocation is null || !allocation.AffectsLinkedBalance) return;

        var lineItem = allocation.LineItem;
        var date = lineItem.Date;
        var amount = allocation.Amount;
        var direction = lineItem.Direction;

        switch (allocation.LinkedEntityType)
        {
            case LinkedEntityType.SimpleAsset:
                await ApplyToSimpleAsset(allocation.LinkedEntityUID, AssetDelta(direction, amount), date, ct);
                break;
            case LinkedEntityType.Savings:
                await ApplyToSavings(allocation.LinkedEntityUID, AssetDelta(direction, amount), date, ct);
                break;
            case LinkedEntityType.LongTermItem:
                await ApplyToLongTermItem(allocation.LinkedEntityUID, AssetDelta(direction, amount), date, ct);
                break;
            case LinkedEntityType.CreditCardDebt:
                await ApplyToCreditCardDebt(allocation.LinkedEntityUID, LiabilityDelta(direction, amount), date, ct);
                break;
            case LinkedEntityType.MortgageDebt:
                await ApplyToMortgageDebt(allocation.LinkedEntityUID, LiabilityDelta(direction, amount), date, ct);
                break;
            case LinkedEntityType.LongTermContainer:
            case LinkedEntityType.RetirementContainer:
                // Container types are aggregates of holdings — direct balance-affect not supported.
                // Edit the relevant Holding instead. No-op here.
                break;
        }
    }

    private static decimal AssetDelta(Direction direction, decimal amount)
        => direction == Direction.Income ? amount : -amount;

    private static decimal LiabilityDelta(Direction direction, decimal amount)
        => direction == Direction.Expense ? amount : -amount;

    private async Task ApplyToSimpleAsset(Guid uid, decimal delta, DateOnly date, CancellationToken ct)
    {
        var entity = await db.SimpleAssets.FirstOrDefaultAsync(x => x.UID == uid, ct);
        if (entity is null) return;

        entity.CurrentValue += delta;
        entity.CurrentAsOfDate = date;

        db.SimpleAssetSnapshots.Add(new SimpleAssetSnapshot
        {
            UID = Guid.NewGuid(),
            SimpleAssetUID = entity.UID,
            Date = date,
            Value = entity.CurrentValue,
        });
        await db.SaveChangesAsync(ct);
    }

    private async Task ApplyToSavings(Guid uid, decimal delta, DateOnly date, CancellationToken ct)
    {
        var entity = await db.Savings.FirstOrDefaultAsync(x => x.UID == uid, ct);
        if (entity is null) return;

        entity.CurrentValue += delta;
        entity.CurrentValueAsOfDate = date;

        db.SavingsValueSnapshots.Add(new SavingsValueSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = date,
            Value = entity.CurrentValue,
        });
        await db.SaveChangesAsync(ct);
    }

    private async Task ApplyToLongTermItem(Guid uid, decimal delta, DateOnly date, CancellationToken ct)
    {
        var entity = await db.LongTermItems.FirstOrDefaultAsync(x => x.UID == uid, ct);
        if (entity is null) return;

        entity.CurrentValue += delta;
        entity.CurrentAsOfDate = date;

        db.LongTermItemSnapshots.Add(new LongTermItemSnapshot
        {
            UID = Guid.NewGuid(),
            LongTermItemUID = entity.UID,
            Date = date,
            Value = entity.CurrentValue,
        });
        await db.SaveChangesAsync(ct);
    }

    private async Task ApplyToCreditCardDebt(Guid uid, decimal delta, DateOnly date, CancellationToken ct)
    {
        var entity = await db.CreditCardDebts.FirstOrDefaultAsync(x => x.UID == uid, ct);
        if (entity is null) return;

        entity.CurrentBalance += delta;
        if (entity.CurrentBalance < 0) entity.CurrentBalance = 0;
        entity.CurrentAsOfDate = date;

        db.CreditCardDebtSnapshots.Add(new CreditCardDebtSnapshot
        {
            UID = Guid.NewGuid(),
            CreditCardDebtUID = entity.UID,
            Date = date,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
    }

    private async Task ApplyToMortgageDebt(Guid uid, decimal delta, DateOnly date, CancellationToken ct)
    {
        var entity = await db.MortgageDebts.FirstOrDefaultAsync(x => x.UID == uid, ct);
        if (entity is null) return;

        entity.CurrentBalance += delta;
        if (entity.CurrentBalance < 0) entity.CurrentBalance = 0;
        entity.CurrentAsOfDate = date;

        db.MortgageDebtSnapshots.Add(new MortgageDebtSnapshot
        {
            UID = Guid.NewGuid(),
            MortgageDebtUID = entity.UID,
            Date = date,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
    }
}
