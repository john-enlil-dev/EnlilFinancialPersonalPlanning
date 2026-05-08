using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.LongTermItems;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class LongTermItemManager(AppDbContext db)
{
    public async Task<IReadOnlyList<LongTermItemResponse>> ListAsync(CancellationToken ct)
        => await db.LongTermItems.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new LongTermItemResponse(x.UID, x.Name, x.Subtype, x.CurrentValue, x.CurrentAsOfDate))
            .ToListAsync(ct);

    public async Task<LongTermItemResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.LongTermItems.AsNoTracking().FirstOrDefaultAsync(li => li.UID == uid, ct);
        return x is null ? null : new LongTermItemResponse(x.UID, x.Name, x.Subtype, x.CurrentValue, x.CurrentAsOfDate);
    }

    public async Task<LongTermItemResponse> CreateAsync(CreateLongTermItemRequest request, CancellationToken ct)
    {
        var entity = new LongTermItem
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim(),
            CurrentValue = request.CurrentValue,
            CurrentAsOfDate = request.CurrentAsOfDate,
        };
        db.LongTermItems.Add(entity);
        db.LongTermItemSnapshots.Add(new LongTermItemSnapshot
        {
            UID = Guid.NewGuid(),
            LongTermItemUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Value = entity.CurrentValue,
        });
        await db.SaveChangesAsync(ct);
        return new LongTermItemResponse(entity.UID, entity.Name, entity.Subtype, entity.CurrentValue, entity.CurrentAsOfDate);
    }

    public async Task<LongTermItemResponse?> UpdateAsync(Guid uid, UpdateLongTermItemRequest request, CancellationToken ct)
    {
        var entity = await db.LongTermItems.FirstOrDefaultAsync(li => li.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim();
        entity.CurrentValue = request.CurrentValue;
        entity.CurrentAsOfDate = request.CurrentAsOfDate;

        db.LongTermItemSnapshots.Add(new LongTermItemSnapshot
        {
            UID = Guid.NewGuid(),
            LongTermItemUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Value = entity.CurrentValue,
        });
        await db.SaveChangesAsync(ct);
        return new LongTermItemResponse(entity.UID, entity.Name, entity.Subtype, entity.CurrentValue, entity.CurrentAsOfDate);
    }
}
