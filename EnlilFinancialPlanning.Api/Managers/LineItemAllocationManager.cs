using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.LineItemAllocations;
using EnlilFinancialPlanning.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class LineItemAllocationManager(AppDbContext db, IBalanceAffectService balanceAffect)
{
    public async Task<IReadOnlyList<LineItemAllocationResponse>> ListByLineItemAsync(Guid lineItemUid, CancellationToken ct)
        => await db.LineItemAllocations.AsNoTracking()
            .Where(a => a.LineItemUID == lineItemUid)
            .Select(a => new LineItemAllocationResponse(
                a.UID, a.LineItemUID, a.LinkedEntityUID, a.LinkedEntityType,
                a.ComponentType, a.Amount, a.AffectsLinkedBalance))
            .ToListAsync(ct);

    public async Task<LineItemAllocationResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var a = await db.LineItemAllocations.AsNoTracking().FirstOrDefaultAsync(x => x.UID == uid, ct);
        return a is null ? null : ToResponse(a);
    }

    public async Task<LineItemAllocationResponse?> CreateAsync(CreateLineItemAllocationRequest request, CancellationToken ct)
    {
        var lineItemExists = await db.LineItems.AnyAsync(li => li.UID == request.LineItemUID, ct);
        if (!lineItemExists) return null;

        var entity = new LineItemAllocation
        {
            UID = Guid.NewGuid(),
            LineItemUID = request.LineItemUID,
            LinkedEntityUID = request.LinkedEntityUID,
            LinkedEntityType = request.LinkedEntityType,
            ComponentType = string.IsNullOrWhiteSpace(request.ComponentType) ? null : request.ComponentType.Trim(),
            Amount = request.Amount,
            AffectsLinkedBalance = request.AffectsLinkedBalance,
        };
        db.LineItemAllocations.Add(entity);
        await db.SaveChangesAsync(ct);
        await balanceAffect.ApplyAllocationAsync(entity.UID, ct);
        return ToResponse(entity);
    }

    public async Task<LineItemAllocationResponse?> UpdateAsync(Guid uid, UpdateLineItemAllocationRequest request, CancellationToken ct)
    {
        var entity = await db.LineItemAllocations.FirstOrDefaultAsync(a => a.UID == uid, ct);
        if (entity is null) return null;

        entity.LinkedEntityUID = request.LinkedEntityUID;
        entity.LinkedEntityType = request.LinkedEntityType;
        entity.ComponentType = string.IsNullOrWhiteSpace(request.ComponentType) ? null : request.ComponentType.Trim();
        entity.Amount = request.Amount;
        entity.AffectsLinkedBalance = request.AffectsLinkedBalance;

        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    private static LineItemAllocationResponse ToResponse(LineItemAllocation a)
        => new(a.UID, a.LineItemUID, a.LinkedEntityUID, a.LinkedEntityType,
            a.ComponentType, a.Amount, a.AffectsLinkedBalance);
}
