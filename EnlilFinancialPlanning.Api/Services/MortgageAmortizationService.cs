using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services;

public sealed class MortgageAmortizationService(AppDbContext db) : IMortgageAmortizationService
{
    public async Task RegenerateAsync(Guid mortgageDebtUID, CancellationToken ct)
    {
        var mortgage = await db.MortgageDebts.FirstOrDefaultAsync(m => m.UID == mortgageDebtUID, ct);
        if (mortgage is null) return;

        var existing = db.AmortizationEntries.Where(e => e.MortgageDebtUID == mortgageDebtUID);
        db.AmortizationEntries.RemoveRange(existing);

        var schedule = ComputeSchedule(
            mortgage.OriginalPrincipal,
            mortgage.InterestRate,
            mortgage.TermMonths,
            mortgage.MonthlyPaymentPI,
            mortgage.StartDate,
            mortgage.UID);

        db.AmortizationEntries.AddRange(schedule);
        await db.SaveChangesAsync(ct);
    }

    private static IEnumerable<AmortizationEntry> ComputeSchedule(
        decimal principal,
        decimal annualRate,
        int termMonths,
        decimal monthlyPayment,
        DateOnly startDate,
        Guid mortgageUid)
    {
        if (termMonths <= 0 || principal <= 0)
            yield break;

        var monthlyRate = annualRate / 12m;
        var balance = principal;

        for (var i = 1; i <= termMonths; i++)
        {
            var interest = Math.Round(balance * monthlyRate, 2, MidpointRounding.AwayFromZero);
            var principalPayment = monthlyPayment - interest;

            if (i == termMonths || principalPayment > balance)
                principalPayment = balance;

            balance -= principalPayment;
            if (balance < 0) balance = 0;

            yield return new AmortizationEntry
            {
                UID = Guid.NewGuid(),
                MortgageDebtUID = mortgageUid,
                PaymentNumber = i,
                Date = startDate.AddMonths(i),
                Principal = principalPayment,
                Interest = interest,
                RemainingBalance = balance,
            };
        }
    }
}
