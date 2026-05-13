using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.LineItems;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class LineItemManager(AppDbContext db)
{
    public async Task<IReadOnlyList<LineItemResponse>> ListAsync(LineItemQuery query, CancellationToken ct)
    {
        var q = db.LineItems
            .AsNoTracking()
            .Where(li => li.IsCashMovement)
            .Include(li => li.Category)
            .Include(li => li.SourceTemplate)
            .AsQueryable();

        if (query.FromDate.HasValue)
            q = q.Where(li => li.Date >= query.FromDate.Value);

        if (query.ToDate.HasValue)
            q = q.Where(li => li.Date <= query.ToDate.Value);

        if (query.Direction.HasValue)
            q = q.Where(li => li.Direction == query.Direction.Value);

        if (query.CategoryUIDs.Count > 0)
            q = q.Where(li => query.CategoryUIDs.Contains(li.CategoryUID));

        return await q
            .OrderByDescending(li => li.Date)
            .ThenBy(li => li.UID)
            .Select(li => new LineItemResponse(
                li.UID,
                li.Direction,
                li.Amount,
                li.Date,
                li.Description,
                li.CategoryUID,
                li.Category.Name,
                li.SourceTemplateUID,
                li.SourceTemplate != null ? li.SourceTemplate.Name : null,
                li.WasManuallyEdited))
            .ToListAsync(ct);
    }

    public async Task<LineItemResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var li = await db.LineItems
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.SourceTemplate)
            .FirstOrDefaultAsync(x => x.UID == uid, ct);

        return li is null ? null : ToResponse(li);
    }

    public async Task<LineItemResponse?> CreateAsync(CreateLineItemRequest request, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var entity = new LineItem
        {
            UID = Guid.NewGuid(),
            Direction = request.Direction,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description?.Trim(),
            CategoryUID = request.CategoryUID,
            SourceTemplateUID = null,
            WasManuallyEdited = false,
        };

        db.LineItems.Add(entity);
        await db.SaveChangesAsync(ct);

        entity.Category = category;
        return ToResponse(entity);
    }

    public async Task<LineItemResponse?> UpdateAsync(Guid uid, UpdateLineItemRequest request, CancellationToken ct)
    {
        var entity = await db.LineItems
            .Include(li => li.Category)
            .Include(li => li.SourceTemplate)
            .FirstOrDefaultAsync(li => li.UID == uid, ct);
        if (entity is null) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        entity.Direction = request.Direction;
        entity.Amount = request.Amount;
        entity.Date = request.Date;
        entity.Description = request.Description?.Trim();
        entity.CategoryUID = request.CategoryUID;
        entity.Category = category;

        if (entity.SourceTemplateUID.HasValue)
            entity.WasManuallyEdited = true;

        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<bool> DeleteAsync(Guid uid, CancellationToken ct)
    {
        var entity = await db.LineItems.FirstOrDefaultAsync(li => li.UID == uid, ct);
        if (entity is null) return false;

        db.LineItems.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<LineItemLinkage>?> GetLinkagesAsync(Guid uid, CancellationToken ct)
    {
        var lineItemExists = await db.LineItems.AnyAsync(li => li.UID == uid, ct);
        if (!lineItemExists) return null;

        var allocations = await db.LineItemAllocations
            .AsNoTracking()
            .Where(a => a.LineItemUID == uid)
            .Select(a => new { a.LinkedEntityType, a.LinkedEntityUID, a.ComponentType, a.Amount })
            .ToListAsync(ct);

        if (allocations.Count == 0) return Array.Empty<LineItemLinkage>();

        var result = new List<LineItemLinkage>(allocations.Count);
        foreach (var a in allocations)
        {
            var entityName = await ResolveEntityNameAsync(a.LinkedEntityType, a.LinkedEntityUID, ct);
            result.Add(new LineItemLinkage(
                FormatEntityType(a.LinkedEntityType),
                entityName,
                a.ComponentType,
                a.Amount));
        }
        return result;
    }

    private async Task<string> ResolveEntityNameAsync(
        LinkedEntityType type, Guid uid, CancellationToken ct)
    {
        return type switch
        {
            LinkedEntityType.Savings =>
                (await db.Savings.AsNoTracking()
                    .Where(s => s.UID == uid).Select(s => s.Name).FirstOrDefaultAsync(ct))
                ?? "(unknown)",
            LinkedEntityType.CreditCardDebt =>
                (await db.CreditCardDebts.AsNoTracking()
                    .Where(c => c.UID == uid).Select(c => c.Name).FirstOrDefaultAsync(ct))
                ?? "(unknown)",
            LinkedEntityType.MortgageDebt =>
                (await db.MortgageDebts.AsNoTracking()
                    .Where(m => m.UID == uid).Select(m => m.Name).FirstOrDefaultAsync(ct))
                ?? "(unknown)",
            LinkedEntityType.SimpleAsset =>
                (await db.SimpleAssets.AsNoTracking()
                    .Where(s => s.UID == uid).Select(s => s.Name).FirstOrDefaultAsync(ct))
                ?? "(unknown)",
            LinkedEntityType.LongTermContainer =>
                (await db.LongTermContainers.AsNoTracking()
                    .Where(c => c.UID == uid).Select(c => c.Name).FirstOrDefaultAsync(ct))
                ?? "(unknown)",
            LinkedEntityType.LongTermItem =>
                (await db.LongTermItems.AsNoTracking()
                    .Where(i => i.UID == uid).Select(i => i.Name).FirstOrDefaultAsync(ct))
                ?? "(unknown)",
            LinkedEntityType.RetirementContainer =>
                (await db.RetirementContainers.AsNoTracking()
                    .Where(r => r.UID == uid).Select(r => r.Name).FirstOrDefaultAsync(ct))
                ?? "(unknown)",
            _ => "(unknown)",
        };
    }

    private static string FormatEntityType(LinkedEntityType type) => type switch
    {
        LinkedEntityType.Savings => "Savings",
        LinkedEntityType.CreditCardDebt => "Credit card",
        LinkedEntityType.MortgageDebt => "Mortgage",
        LinkedEntityType.SimpleAsset => "Simple asset",
        LinkedEntityType.LongTermContainer => "Investment account",
        LinkedEntityType.LongTermItem => "Possession",
        LinkedEntityType.RetirementContainer => "Retirement account",
        _ => type.ToString(),
    };

    private static LineItemResponse ToResponse(LineItem li) => new(
        li.UID,
        li.Direction,
        li.Amount,
        li.Date,
        li.Description,
        li.CategoryUID,
        li.Category.Name,
        li.SourceTemplateUID,
        li.SourceTemplate?.Name,
        li.WasManuallyEdited);
}
