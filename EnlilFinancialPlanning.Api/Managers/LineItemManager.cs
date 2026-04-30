using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Dtos.LineItems;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class LineItemManager(AppDbContext db)
{
    public async Task<IReadOnlyList<LineItemResponse>> ListAsync(LineItemQuery query, CancellationToken ct)
    {
        var q = db.LineItems
            .AsNoTracking()
            .Include(li => li.Category)
            .Include(li => li.SourceTemplate)
            .AsQueryable();

        if (query.FromDate.HasValue)
            q = q.Where(li => li.Date >= query.FromDate.Value);

        if (query.ToDate.HasValue)
            q = q.Where(li => li.Date <= query.ToDate.Value);

        if (query.Direction.HasValue)
            q = q.Where(li => li.Direction == query.Direction.Value);

        if (query.CategoryUID.HasValue)
            q = q.Where(li => li.CategoryUID == query.CategoryUID.Value);

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
