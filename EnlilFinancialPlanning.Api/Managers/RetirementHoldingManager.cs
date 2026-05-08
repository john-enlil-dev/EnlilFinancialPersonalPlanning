using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.RetirementHoldings;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class RetirementHoldingManager(AppDbContext db)
{
    public async Task<IReadOnlyList<RetirementHoldingResponse>> ListByContainerAsync(Guid containerUid, CancellationToken ct)
        => await db.RetirementHoldings.AsNoTracking()
            .Where(h => h.RetirementContainerUID == containerUid)
            .OrderBy(h => h.Name)
            .Select(h => new RetirementHoldingResponse(h.UID, h.RetirementContainerUID, h.Name, h.Symbol, h.Units, h.PricePerUnit, h.Units * h.PricePerUnit, h.AsOfDate))
            .ToListAsync(ct);

    public async Task<RetirementHoldingResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var h = await db.RetirementHoldings.AsNoTracking().FirstOrDefaultAsync(x => x.UID == uid, ct);
        return h is null ? null : ToResponse(h);
    }

    public async Task<RetirementHoldingResponse?> CreateAsync(CreateRetirementHoldingRequest request, CancellationToken ct)
    {
        var container = await db.RetirementContainers.FirstOrDefaultAsync(c => c.UID == request.RetirementContainerUID, ct);
        if (container is null) return null;

        var entity = new RetirementHolding
        {
            UID = Guid.NewGuid(),
            RetirementContainerUID = request.RetirementContainerUID,
            Name = request.Name.Trim(),
            Symbol = string.IsNullOrWhiteSpace(request.Symbol) ? null : request.Symbol.Trim(),
            Units = request.Units,
            PricePerUnit = request.PricePerUnit,
            AsOfDate = request.AsOfDate,
        };
        db.RetirementHoldings.Add(entity);

        db.RetirementHoldingSnapshots.Add(new RetirementHoldingSnapshot
        {
            UID = Guid.NewGuid(),
            RetirementHoldingUID = entity.UID,
            Date = entity.AsOfDate,
            Units = entity.Units,
            PricePerUnit = entity.PricePerUnit,
        });

        await db.SaveChangesAsync(ct);
        await RecomputeContainerAsync(container.UID, ct);
        return ToResponse(entity);
    }

    public async Task<RetirementHoldingResponse?> UpdateAsync(Guid uid, UpdateRetirementHoldingRequest request, CancellationToken ct)
    {
        var entity = await db.RetirementHoldings.FirstOrDefaultAsync(h => h.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Symbol = string.IsNullOrWhiteSpace(request.Symbol) ? null : request.Symbol.Trim();
        entity.Units = request.Units;
        entity.PricePerUnit = request.PricePerUnit;
        entity.AsOfDate = request.AsOfDate;

        db.RetirementHoldingSnapshots.Add(new RetirementHoldingSnapshot
        {
            UID = Guid.NewGuid(),
            RetirementHoldingUID = entity.UID,
            Date = entity.AsOfDate,
            Units = entity.Units,
            PricePerUnit = entity.PricePerUnit,
        });

        await db.SaveChangesAsync(ct);
        await RecomputeContainerAsync(entity.RetirementContainerUID, ct);
        return ToResponse(entity);
    }

    private async Task RecomputeContainerAsync(Guid containerUid, CancellationToken ct)
    {
        var container = await db.RetirementContainers.FirstOrDefaultAsync(c => c.UID == containerUid, ct);
        if (container is null) return;

        var holdings = await db.RetirementHoldings.AsNoTracking()
            .Where(h => h.RetirementContainerUID == containerUid)
            .ToListAsync(ct);

        container.CurrentValue = holdings.Sum(h => h.Units * h.PricePerUnit);
        container.CurrentAsOfDate = holdings.Count == 0
            ? container.CurrentAsOfDate
            : holdings.Max(h => h.AsOfDate);

        await db.SaveChangesAsync(ct);
    }

    private static RetirementHoldingResponse ToResponse(RetirementHolding h)
        => new(h.UID, h.RetirementContainerUID, h.Name, h.Symbol, h.Units, h.PricePerUnit, h.Units * h.PricePerUnit, h.AsOfDate);
}
