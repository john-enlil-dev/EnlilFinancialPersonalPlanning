using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class CreditCardDebtManager(AppDbContext db)
{
    public async Task<IReadOnlyList<CreditCardDebtResponse>> ListAsync(CancellationToken ct)
        => await db.CreditCardDebts.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new CreditCardDebtResponse(
                x.UID, x.Name, x.Institution, x.APR, x.CreditLimit, x.MinimumPayment, x.CurrentBalance, x.CurrentAsOfDate))
            .ToListAsync(ct);

    public async Task<CreditCardDebtResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.CreditCardDebts.AsNoTracking().FirstOrDefaultAsync(c => c.UID == uid, ct);
        return x is null ? null : ToResponse(x);
    }

    public async Task<CreditCardDebtResponse> CreateAsync(CreateCreditCardDebtRequest request, CancellationToken ct)
    {
        var entity = new CreditCardDebt
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Institution = request.Institution?.Trim(),
            APR = request.APR,
            CreditLimit = request.CreditLimit,
            MinimumPayment = request.MinimumPayment,
            CurrentBalance = request.CurrentBalance,
            CurrentAsOfDate = request.CurrentAsOfDate,
        };
        db.CreditCardDebts.Add(entity);
        db.CreditCardDebtSnapshots.Add(new CreditCardDebtSnapshot
        {
            UID = Guid.NewGuid(),
            CreditCardDebtUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<CreditCardDebtResponse?> UpdateAsync(Guid uid, UpdateCreditCardDebtRequest request, CancellationToken ct)
    {
        var entity = await db.CreditCardDebts.FirstOrDefaultAsync(c => c.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Institution = request.Institution?.Trim();
        entity.APR = request.APR;
        entity.CreditLimit = request.CreditLimit;
        entity.MinimumPayment = request.MinimumPayment;
        entity.CurrentBalance = request.CurrentBalance;
        entity.CurrentAsOfDate = request.CurrentAsOfDate;

        db.CreditCardDebtSnapshots.Add(new CreditCardDebtSnapshot
        {
            UID = Guid.NewGuid(),
            CreditCardDebtUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    private static CreditCardDebtResponse ToResponse(CreditCardDebt c)
        => new(c.UID, c.Name, c.Institution, c.APR, c.CreditLimit, c.MinimumPayment, c.CurrentBalance, c.CurrentAsOfDate);
}
