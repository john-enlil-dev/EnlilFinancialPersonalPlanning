using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services.Dashboard;

public sealed class DashboardTimelineService(AppDbContext db)
{
    private const int WeekCount = 13;

    public async Task<DashboardTimelineResponse> GetAsync(DateOnly asOf, CancellationToken ct)
    {
        var firstWeekStart = StartOfWeek(asOf);
        var lastWeekEnd = firstWeekStart.AddDays(WeekCount * 7 - 1);

        var openingBalanceIncome = await db.LineItems
            .AsNoTracking()
            .Where(li => li.IsCashMovement && li.Date < firstWeekStart && li.Direction == Direction.Income)
            .SumAsync(li => (decimal?)li.Amount, ct) ?? 0m;
        var openingBalanceExpense = await db.LineItems
            .AsNoTracking()
            .Where(li => li.IsCashMovement && li.Date < firstWeekStart && li.Direction == Direction.Expense)
            .SumAsync(li => (decimal?)li.Amount, ct) ?? 0m;
        var openingBalance = openingBalanceIncome - openingBalanceExpense;

        var items = await db.LineItems
            .AsNoTracking()
            .Where(li => li.IsCashMovement && li.Date >= firstWeekStart && li.Date <= lastWeekEnd)
            .Select(li => new { li.Direction, li.Amount, li.Date })
            .ToListAsync(ct);

        var weeks = new List<TimelineWeekDto>(WeekCount);
        var runningBalance = openingBalance;
        for (var w = 0; w < WeekCount; w++)
        {
            var weekStart = firstWeekStart.AddDays(w * 7);
            var weekEnd = weekStart.AddDays(6);
            var weekIncome = items
                .Where(i => i.Date >= weekStart && i.Date <= weekEnd && i.Direction == Direction.Income)
                .Sum(i => i.Amount);
            var weekExpense = items
                .Where(i => i.Date >= weekStart && i.Date <= weekEnd && i.Direction == Direction.Expense)
                .Sum(i => i.Amount);
            var net = weekIncome - weekExpense;
            runningBalance += net;
            weeks.Add(new TimelineWeekDto(weekStart, weekEnd, weekIncome, weekExpense, net, runningBalance));
        }

        var hasTemplates = await db.RecurringTemplates.AsNoTracking().AnyAsync(ct);

        return new DashboardTimelineResponse(weeks, hasTemplates);
    }

    private static DateOnly StartOfWeek(DateOnly date)
    {
        var daysFromMonday = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-daysFromMonday);
    }
}
