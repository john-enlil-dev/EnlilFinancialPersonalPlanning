using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services.Dashboard;

public sealed class DashboardCategoryVarianceService(AppDbContext db)
{
    public async Task<DashboardCategoryVarianceResponse> GetAsync(DateOnly asOf, CancellationToken ct)
    {
        var monthStart = new DateOnly(asOf.Year, asOf.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);
        var baselineStart = monthStart.AddMonths(-3);
        var baselineEnd = monthStart.AddDays(-1);

        var items = await db.LineItems
            .AsNoTracking()
            .Include(li => li.Category)
            .Where(li =>
                li.IsCashMovement &&
                li.Direction == Direction.Expense &&
                li.Date >= baselineStart &&
                li.Date <= monthEnd &&
                !li.Category.IsArchived)
            .Select(li => new
            {
                li.CategoryUID,
                CategoryName = li.Category.Name,
                li.Amount,
                li.Date,
            })
            .ToListAsync(ct);

        var hasEnoughHistory = await db.LineItems
            .AsNoTracking()
            .AnyAsync(li => li.IsCashMovement && li.Date < baselineStart, ct);

        var rows = items
            .GroupBy(i => new { i.CategoryUID, i.CategoryName })
            .Select(g =>
            {
                var thisMonth = g
                    .Where(i => i.Date >= monthStart && i.Date <= monthEnd)
                    .Sum(i => i.Amount);
                decimal? baseline = null;
                decimal? delta = null;
                decimal? percentDelta = null;
                if (hasEnoughHistory)
                {
                    var priorTotal = g
                        .Where(i => i.Date >= baselineStart && i.Date <= baselineEnd)
                        .Sum(i => i.Amount);
                    baseline = priorTotal / 3m;
                    delta = thisMonth - baseline.Value;
                    percentDelta = baseline.Value != 0m ? delta / baseline.Value : null;
                }

                return new CategoryVarianceRowDto(
                    g.Key.CategoryUID,
                    g.Key.CategoryName,
                    thisMonth,
                    baseline,
                    delta,
                    percentDelta);
            })
            .Where(r => r.ThisMonth > 0m || (r.Baseline.HasValue && r.Baseline.Value > 0m))
            .OrderByDescending(r => r.Delta.HasValue ? Math.Abs(r.Delta.Value) : r.ThisMonth)
            .ToList();

        return new DashboardCategoryVarianceResponse(rows, hasEnoughHistory);
    }
}
