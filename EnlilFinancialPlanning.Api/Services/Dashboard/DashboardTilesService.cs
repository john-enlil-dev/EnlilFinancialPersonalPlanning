using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services.Dashboard;

public sealed class DashboardTilesService(AppDbContext db)
{
    public async Task<DashboardTilesResponse> GetAsync(DateOnly asOf, CancellationToken ct)
    {
        var monthStart = new DateOnly(asOf.Year, asOf.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);
        var next30End = asOf.AddDays(30);
        var baselineStart = monthStart.AddMonths(-3);
        var loadTo = next30End > monthEnd ? next30End : monthEnd;

        var items = await db.LineItems
            .AsNoTracking()
            .Where(li => li.IsCashMovement && li.Date >= baselineStart && li.Date <= loadTo)
            .Select(li => new { li.Direction, li.Amount, li.Date })
            .ToListAsync(ct);

        var incomeThisMonth = items
            .Where(i => i.Date >= monthStart && i.Date <= monthEnd && i.Direction == Direction.Income)
            .Sum(i => i.Amount);
        var expenseThisMonth = items
            .Where(i => i.Date >= monthStart && i.Date <= monthEnd && i.Direction == Direction.Expense)
            .Sum(i => i.Amount);
        var netThisMonth = incomeThisMonth - expenseThisMonth;

        var next30Income = items
            .Where(i => i.Date >= asOf && i.Date <= next30End && i.Direction == Direction.Income)
            .Sum(i => i.Amount);
        var next30Expense = items
            .Where(i => i.Date >= asOf && i.Date <= next30End && i.Direction == Direction.Expense)
            .Sum(i => i.Amount);
        var netNext30 = next30Income - next30Expense;

        var hasEnoughHistory = await db.LineItems
            .AsNoTracking()
            .AnyAsync(li => li.IsCashMovement && li.Date < baselineStart, ct);

        decimal? incomeBaseline = null, expenseBaseline = null, netBaseline = null, net30Baseline = null;
        if (hasEnoughHistory)
        {
            var monthlyIncome = new decimal[3];
            var monthlyExpense = new decimal[3];
            for (var m = 0; m < 3; m++)
            {
                var mStart = monthStart.AddMonths(-(m + 1));
                var mEnd = mStart.AddMonths(1).AddDays(-1);
                monthlyIncome[m] = items
                    .Where(i => i.Date >= mStart && i.Date <= mEnd && i.Direction == Direction.Income)
                    .Sum(i => i.Amount);
                monthlyExpense[m] = items
                    .Where(i => i.Date >= mStart && i.Date <= mEnd && i.Direction == Direction.Expense)
                    .Sum(i => i.Amount);
            }
            incomeBaseline = (monthlyIncome[0] + monthlyIncome[1] + monthlyIncome[2]) / 3m;
            expenseBaseline = (monthlyExpense[0] + monthlyExpense[1] + monthlyExpense[2]) / 3m;
            netBaseline = incomeBaseline.Value - expenseBaseline.Value;
            net30Baseline = netBaseline;
        }

        return new DashboardTilesResponse(
            new DashboardTileDto(incomeThisMonth, incomeBaseline),
            new DashboardTileDto(expenseThisMonth, expenseBaseline),
            new DashboardTileDto(netThisMonth, netBaseline),
            new DashboardTileDto(netNext30, net30Baseline),
            hasEnoughHistory);
    }
}
