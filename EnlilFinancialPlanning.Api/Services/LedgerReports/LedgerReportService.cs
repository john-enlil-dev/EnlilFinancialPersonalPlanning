using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.LedgerReports;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services.LedgerReports;

public sealed class LedgerReportService(AppDbContext db)
{
    private const int TrendMonths = 6;

    private sealed record LedgerRow(
        Guid UID,
        DateOnly Date,
        Direction Direction,
        decimal Amount,
        Guid CategoryUID,
        string CategoryName,
        string? Description);

    public async Task<LedgerReportResponse> GetAsync(
        DateOnly from, DateOnly to, CancellationToken ct)
    {
        var trendEnd = new DateOnly(to.Year, to.Month, 1).AddMonths(1).AddDays(-1);
        var trendStart = new DateOnly(to.Year, to.Month, 1).AddMonths(-(TrendMonths - 1));

        var windowDays = to.DayNumber - from.DayNumber + 1;
        var priorTo = from.AddDays(-1);
        var priorFrom = priorTo.AddDays(-(windowDays - 1));

        var loadFrom = trendStart < priorFrom ? trendStart : priorFrom;
        var loadTo = trendEnd > to ? trendEnd : to;

        var items = await db.LineItems
            .AsNoTracking()
            .Include(li => li.Category)
            .Where(li =>
                li.IsCashMovement &&
                li.Date >= loadFrom &&
                li.Date <= loadTo)
            .Select(li => new LedgerRow(
                li.UID,
                li.Date,
                li.Direction,
                li.Amount,
                li.CategoryUID,
                li.Category.Name,
                li.Description))
            .ToListAsync(ct);

        var windowItems = items.Where(i => i.Date >= from && i.Date <= to).ToList();
        var totalIncome = windowItems
            .Where(i => i.Direction == Direction.Income)
            .Sum(i => i.Amount);
        var totalExpense = windowItems
            .Where(i => i.Direction == Direction.Expense)
            .Sum(i => i.Amount);
        var netCashflow = totalIncome - totalExpense;

        var priorByCategory = items
            .Where(i =>
                i.Direction == Direction.Expense &&
                i.Date >= priorFrom &&
                i.Date <= priorTo)
            .GroupBy(i => i.CategoryUID)
            .ToDictionary(g => g.Key, g => g.Sum(i => i.Amount));

        var expenseByCategory = windowItems
            .Where(i => i.Direction == Direction.Expense)
            .GroupBy(i => new { i.CategoryUID, i.CategoryName })
            .Select(g => new LedgerReportCategorySliceDto(
                g.Key.CategoryUID,
                g.Key.CategoryName,
                g.Sum(i => i.Amount),
                g.Count(),
                priorByCategory.TryGetValue(g.Key.CategoryUID, out var p) ? p : (decimal?)null))
            .OrderByDescending(s => s.Amount)
            .ToList();

        var trendBuckets = new List<LedgerReportMonthlyBucketDto>(TrendMonths);
        for (var m = 0; m < TrendMonths; m++)
        {
            var monthStart = trendStart.AddMonths(m);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);
            var monthCategories = items
                .Where(i =>
                    i.Direction == Direction.Expense &&
                    i.Date >= monthStart &&
                    i.Date <= monthEnd)
                .GroupBy(i => new { i.CategoryUID, i.CategoryName })
                .Select(g => new LedgerReportMonthlyCategoryDto(
                    g.Key.CategoryUID,
                    g.Key.CategoryName,
                    g.Sum(i => i.Amount)))
                .ToList();
            trendBuckets.Add(new LedgerReportMonthlyBucketDto(monthStart, monthCategories));
        }

        var priorItems = items.Where(i => i.Date >= priorFrom && i.Date <= priorTo).ToList();
        var insights = BuildInsights(windowItems, priorItems, totalExpense);

        return new LedgerReportResponse(
            from,
            to,
            totalIncome,
            totalExpense,
            netCashflow,
            expenseByCategory,
            trendBuckets,
            insights);
    }

    private static List<LedgerReportInsightDto> BuildInsights(
        IReadOnlyList<LedgerRow> windowItems,
        IReadOnlyList<LedgerRow> priorItems,
        decimal totalExpense)
    {
        var insights = new List<LedgerReportInsightDto>();

        var windowExpenses = windowItems
            .Where(i => i.Direction == Direction.Expense)
            .ToList();
        if (windowExpenses.Count == 0)
        {
            insights.Add(new LedgerReportInsightDto(
                "empty",
                "No expense activity in the selected window."));
            return insights;
        }

        var biggest = windowExpenses.OrderByDescending(i => i.Amount).First();
        var biggestDesc = string.IsNullOrWhiteSpace(biggest.Description)
            ? biggest.CategoryName
            : biggest.Description;
        insights.Add(new LedgerReportInsightDto(
            "biggest-item",
            $"Biggest single expense: {biggest.Amount:C} on {biggest.Date:yyyy-MM-dd} ({biggestDesc})."));

        var topCategory = windowExpenses
            .GroupBy(i => new { i.CategoryUID, i.CategoryName })
            .Select(g => new { g.Key.CategoryName, Total = g.Sum(i => i.Amount) })
            .OrderByDescending(x => x.Total)
            .First();
        var pctOfTotal = totalExpense > 0 ? topCategory.Total / totalExpense : 0;
        insights.Add(new LedgerReportInsightDto(
            "top-category",
            $"Top category: {topCategory.CategoryName} at {topCategory.Total:C} ({pctOfTotal:P0} of expense)."));

        if (priorItems.Count > 0)
        {
            var priorByCategory = priorItems
                .Where(i => i.Direction == Direction.Expense)
                .GroupBy(i => i.CategoryUID)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Amount));

            var withDelta = windowExpenses
                .GroupBy(i => new { i.CategoryUID, i.CategoryName })
                .Select(g =>
                {
                    var total = g.Sum(i => i.Amount);
                    var prior = priorByCategory.GetValueOrDefault(g.Key.CategoryUID, 0m);
                    return new
                    {
                        g.Key.CategoryName,
                        Total = total,
                        Prior = prior,
                        Delta = total - prior,
                    };
                })
                .Where(x => x.Prior > 0m || x.Total > 0m)
                .OrderByDescending(x => Math.Abs(x.Delta))
                .ToList();

            if (withDelta.Count > 0)
            {
                var mover = withDelta[0];
                var arrow = mover.Delta >= 0 ? "↑" : "↓";
                var magnitude = mover.Prior > 0
                    ? $"{Math.Abs(mover.Delta) / mover.Prior:P0}"
                    : "new spend";
                insights.Add(new LedgerReportInsightDto(
                    "biggest-mover",
                    $"Biggest mover vs prior window: {mover.CategoryName} {arrow} {magnitude} ({mover.Prior:C} → {mover.Total:C})."));
            }
        }

        insights.Add(new LedgerReportInsightDto(
            "transaction-count",
            $"{windowExpenses.Count} expense transactions totaling {totalExpense:C} in window."));

        return insights;
    }
}
