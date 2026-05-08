using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.Savings;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class SavingsManager(AppDbContext db)
{
    public async Task<IReadOnlyList<SavingsResponse>> ListAsync(CancellationToken ct)
        => await db.Savings.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new SavingsResponse(
                x.UID, x.Name, x.Institution, x.Subtype, x.CompoundingFrequency,
                x.CurrentRate, x.CurrentRateAsOfDate, x.CurrentValue, x.CurrentValueAsOfDate))
            .ToListAsync(ct);

    public async Task<SavingsResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.Savings.AsNoTracking().FirstOrDefaultAsync(s => s.UID == uid, ct);
        return x is null ? null : ToResponse(x);
    }

    public async Task<SavingsResponse> CreateAsync(CreateSavingsRequest request, CancellationToken ct)
    {
        var entity = new Savings
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Institution = request.Institution?.Trim(),
            Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim(),
            CompoundingFrequency = request.CompoundingFrequency,
            CurrentRate = request.CurrentRate,
            CurrentRateAsOfDate = request.CurrentRateAsOfDate,
            CurrentValue = request.CurrentValue,
            CurrentValueAsOfDate = request.CurrentValueAsOfDate,
        };
        db.Savings.Add(entity);

        db.SavingsValueSnapshots.Add(new SavingsValueSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentValueAsOfDate,
            Value = entity.CurrentValue,
        });
        db.SavingsRateSnapshots.Add(new SavingsRateSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentRateAsOfDate,
            Rate = entity.CurrentRate,
        });

        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<SavingsResponse?> UpdateAsync(Guid uid, UpdateSavingsRequest request, CancellationToken ct)
    {
        var entity = await db.Savings.FirstOrDefaultAsync(s => s.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Institution = request.Institution?.Trim();
        entity.Subtype = string.IsNullOrWhiteSpace(request.Subtype) ? null : request.Subtype.Trim();
        entity.CompoundingFrequency = request.CompoundingFrequency;
        entity.CurrentRate = request.CurrentRate;
        entity.CurrentRateAsOfDate = request.CurrentRateAsOfDate;
        entity.CurrentValue = request.CurrentValue;
        entity.CurrentValueAsOfDate = request.CurrentValueAsOfDate;

        db.SavingsValueSnapshots.Add(new SavingsValueSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentValueAsOfDate,
            Value = entity.CurrentValue,
        });
        db.SavingsRateSnapshots.Add(new SavingsRateSnapshot
        {
            UID = Guid.NewGuid(),
            SavingsUID = entity.UID,
            Date = entity.CurrentRateAsOfDate,
            Rate = entity.CurrentRate,
        });

        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    private static SavingsResponse ToResponse(Savings s)
        => new(s.UID, s.Name, s.Institution, s.Subtype, s.CompoundingFrequency,
            s.CurrentRate, s.CurrentRateAsOfDate, s.CurrentValue, s.CurrentValueAsOfDate);
}
