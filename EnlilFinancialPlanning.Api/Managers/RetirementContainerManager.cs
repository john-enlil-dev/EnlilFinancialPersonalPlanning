using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.RetirementContainers;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class RetirementContainerManager(AppDbContext db, TimeProvider clock)
{
    public async Task<IReadOnlyList<RetirementContainerResponse>> ListAsync(CancellationToken ct)
        => await db.RetirementContainers.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new RetirementContainerResponse(x.UID, x.Name, x.Institution, x.AccountType, x.CurrentValue, x.CurrentAsOfDate))
            .ToListAsync(ct);

    public async Task<RetirementContainerResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.RetirementContainers.AsNoTracking().FirstOrDefaultAsync(c => c.UID == uid, ct);
        return x is null ? null : new RetirementContainerResponse(x.UID, x.Name, x.Institution, x.AccountType, x.CurrentValue, x.CurrentAsOfDate);
    }

    public async Task<RetirementContainerResponse> CreateAsync(CreateRetirementContainerRequest request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var entity = new RetirementContainer
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Institution = request.Institution?.Trim(),
            AccountType = request.AccountType,
            CurrentValue = 0m,
            CurrentAsOfDate = today,
        };
        db.RetirementContainers.Add(entity);
        await db.SaveChangesAsync(ct);
        return new RetirementContainerResponse(entity.UID, entity.Name, entity.Institution, entity.AccountType, entity.CurrentValue, entity.CurrentAsOfDate);
    }

    public async Task<RetirementContainerResponse?> UpdateAsync(Guid uid, UpdateRetirementContainerRequest request, CancellationToken ct)
    {
        var entity = await db.RetirementContainers.FirstOrDefaultAsync(c => c.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Institution = request.Institution?.Trim();
        entity.AccountType = request.AccountType;

        await db.SaveChangesAsync(ct);
        return new RetirementContainerResponse(entity.UID, entity.Name, entity.Institution, entity.AccountType, entity.CurrentValue, entity.CurrentAsOfDate);
    }
}
