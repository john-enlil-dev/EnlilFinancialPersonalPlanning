using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.Holdings;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class HoldingManager(AppDbContext db)
{
    public async Task<IReadOnlyList<HoldingResponse>> ListByContainerAsync(Guid containerUid, CancellationToken ct)
        => await db.Holdings.AsNoTracking()
            .Where(h => h.LongTermContainerUID == containerUid)
            .OrderBy(h => h.Name)
            .Select(h => new HoldingResponse(h.UID, h.LongTermContainerUID, h.Name, h.Symbol, h.Units, h.PricePerUnit, h.Units * h.PricePerUnit, h.AsOfDate))
            .ToListAsync(ct);

    public async Task<HoldingResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var h = await db.Holdings.AsNoTracking().FirstOrDefaultAsync(x => x.UID == uid, ct);
        return h is null ? null : ToResponse(h);
    }

    public async Task<HoldingResponse?> CreateAsync(CreateHoldingRequest request, CancellationToken ct)
    {
        var container = await db.LongTermContainers.FirstOrDefaultAsync(c => c.UID == request.LongTermContainerUID, ct);
        if (container is null) return null;

        var entity = new Holding
        {
            UID = Guid.NewGuid(),
            LongTermContainerUID = request.LongTermContainerUID,
            Name = request.Name.Trim(),
            Symbol = string.IsNullOrWhiteSpace(request.Symbol) ? null : request.Symbol.Trim(),
            Units = request.Units,
            PricePerUnit = request.PricePerUnit,
            AsOfDate = request.AsOfDate,
        };
        db.Holdings.Add(entity);

        db.HoldingSnapshots.Add(new HoldingSnapshot
        {
            UID = Guid.NewGuid(),
            HoldingUID = entity.UID,
            Date = entity.AsOfDate,
            Units = entity.Units,
            PricePerUnit = entity.PricePerUnit,
        });

        await db.SaveChangesAsync(ct);
        await RecomputeContainerAsync(container.UID, ct);
        return ToResponse(entity);
    }

    public async Task<HoldingResponse?> UpdateAsync(Guid uid, UpdateHoldingRequest request, CancellationToken ct)
    {
        var entity = await db.Holdings.FirstOrDefaultAsync(h => h.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Symbol = string.IsNullOrWhiteSpace(request.Symbol) ? null : request.Symbol.Trim();
        entity.Units = request.Units;
        entity.PricePerUnit = request.PricePerUnit;
        entity.AsOfDate = request.AsOfDate;

        db.HoldingSnapshots.Add(new HoldingSnapshot
        {
            UID = Guid.NewGuid(),
            HoldingUID = entity.UID,
            Date = entity.AsOfDate,
            Units = entity.Units,
            PricePerUnit = entity.PricePerUnit,
        });

        await db.SaveChangesAsync(ct);
        await RecomputeContainerAsync(entity.LongTermContainerUID, ct);
        return ToResponse(entity);
    }

    private async Task RecomputeContainerAsync(Guid containerUid, CancellationToken ct)
    {
        var container = await db.LongTermContainers.FirstOrDefaultAsync(c => c.UID == containerUid, ct);
        if (container is null) return;

        var holdings = await db.Holdings.AsNoTracking()
            .Where(h => h.LongTermContainerUID == containerUid)
            .ToListAsync(ct);

        container.CurrentValue = holdings.Sum(h => h.Units * h.PricePerUnit);
        container.CurrentAsOfDate = holdings.Count == 0
            ? container.CurrentAsOfDate
            : holdings.Max(h => h.AsOfDate);

        await db.SaveChangesAsync(ct);
    }

    private static HoldingResponse ToResponse(Holding h)
        => new(h.UID, h.LongTermContainerUID, h.Name, h.Symbol, h.Units, h.PricePerUnit, h.Units * h.PricePerUnit, h.AsOfDate);
}
