using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.SimpleAssets;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class SimpleAssetManager(AppDbContext db)
{
    public async Task<IReadOnlyList<SimpleAssetResponse>> ListAsync(CancellationToken ct)
        => await db.SimpleAssets.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new SimpleAssetResponse(x.UID, x.Name, x.Subtype, x.CurrentValue, x.CurrentAsOfDate))
            .ToListAsync(ct);

    public async Task<SimpleAssetResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.SimpleAssets.AsNoTracking().FirstOrDefaultAsync(s => s.UID == uid, ct);
        return x is null ? null : new SimpleAssetResponse(x.UID, x.Name, x.Subtype, x.CurrentValue, x.CurrentAsOfDate);
    }

    public async Task<SimpleAssetResponse> CreateAsync(CreateSimpleAssetRequest request, CancellationToken ct)
    {
        var entity = new SimpleAsset
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim(),
            CurrentValue = request.CurrentValue,
            CurrentAsOfDate = request.CurrentAsOfDate,
        };
        db.SimpleAssets.Add(entity);
        db.SimpleAssetSnapshots.Add(new SimpleAssetSnapshot
        {
            UID = Guid.NewGuid(),
            SimpleAssetUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Value = entity.CurrentValue,
        });
        await db.SaveChangesAsync(ct);
        return new SimpleAssetResponse(entity.UID, entity.Name, entity.Subtype, entity.CurrentValue, entity.CurrentAsOfDate);
    }

    public async Task<SimpleAssetResponse?> UpdateAsync(Guid uid, UpdateSimpleAssetRequest request, CancellationToken ct)
    {
        var entity = await db.SimpleAssets.FirstOrDefaultAsync(s => s.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim();
        entity.CurrentValue = request.CurrentValue;
        entity.CurrentAsOfDate = request.CurrentAsOfDate;

        db.SimpleAssetSnapshots.Add(new SimpleAssetSnapshot
        {
            UID = Guid.NewGuid(),
            SimpleAssetUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Value = entity.CurrentValue,
        });
        await db.SaveChangesAsync(ct);
        return new SimpleAssetResponse(entity.UID, entity.Name, entity.Subtype, entity.CurrentValue, entity.CurrentAsOfDate);
    }
}
