using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Dtos.Categories;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class CategoryManager(AppDbContext db)
{
    public async Task<IReadOnlyList<CategoryResponse>> ListAsync(bool includeArchived, CancellationToken ct)
    {
        var query = db.Categories.AsNoTracking();
        if (!includeArchived)
            query = query.Where(c => !c.IsArchived);

        return await query
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse(c.UID, c.Name, c.Direction, c.Description, c.IsArchived))
            .ToListAsync(ct);
    }

    public async Task<CategoryResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var c = await db.Categories.AsNoTracking().FirstOrDefaultAsync(x => x.UID == uid, ct);
        return c is null ? null : new CategoryResponse(c.UID, c.Name, c.Direction, c.Description, c.IsArchived);
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request, CancellationToken ct)
    {
        var entity = new Category
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Direction = request.Direction,
            Description = request.Description?.Trim(),
            IsArchived = false,
        };
        db.Categories.Add(entity);
        await db.SaveChangesAsync(ct);
        return new CategoryResponse(entity.UID, entity.Name, entity.Direction, entity.Description, entity.IsArchived);
    }

    public async Task<CategoryResponse?> UpdateAsync(Guid uid, UpdateCategoryRequest request, CancellationToken ct)
    {
        var entity = await db.Categories.FirstOrDefaultAsync(c => c.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Direction = request.Direction;
        entity.Description = request.Description?.Trim();
        entity.IsArchived = request.IsArchived;

        await db.SaveChangesAsync(ct);
        return new CategoryResponse(entity.UID, entity.Name, entity.Direction, entity.Description, entity.IsArchived);
    }
}
