using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.LongTermContainers;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class LongTermContainerManager(AppDbContext db, TimeProvider clock)
{
    public async Task<IReadOnlyList<LongTermContainerResponse>> ListAsync(CancellationToken ct)
        => await db.LongTermContainers.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new LongTermContainerResponse(c.UID, c.Name, c.Institution, c.CurrentValue, c.CurrentAsOfDate))
            .ToListAsync(ct);

    public async Task<LongTermContainerResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var c = await db.LongTermContainers.AsNoTracking().FirstOrDefaultAsync(x => x.UID == uid, ct);
        return c is null ? null : new LongTermContainerResponse(c.UID, c.Name, c.Institution, c.CurrentValue, c.CurrentAsOfDate);
    }

    public async Task<LongTermContainerResponse> CreateAsync(CreateLongTermContainerRequest request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var entity = new LongTermContainer
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Institution = request.Institution?.Trim(),
            CurrentValue = 0m,
            CurrentAsOfDate = today,
        };
        db.LongTermContainers.Add(entity);
        await db.SaveChangesAsync(ct);
        return new LongTermContainerResponse(entity.UID, entity.Name, entity.Institution, entity.CurrentValue, entity.CurrentAsOfDate);
    }

    public async Task<LongTermContainerResponse?> UpdateAsync(Guid uid, UpdateLongTermContainerRequest request, CancellationToken ct)
    {
        var entity = await db.LongTermContainers.FirstOrDefaultAsync(x => x.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Institution = request.Institution?.Trim();

        await db.SaveChangesAsync(ct);
        return new LongTermContainerResponse(entity.UID, entity.Name, entity.Institution, entity.CurrentValue, entity.CurrentAsOfDate);
    }
}
