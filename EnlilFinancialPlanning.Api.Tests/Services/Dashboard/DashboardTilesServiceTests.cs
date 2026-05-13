using EnlilFinancialPlanning.Api.Services.Dashboard;
using EnlilFinancialPlanning.Api.Tests.TestHelpers;
using Xunit;

namespace EnlilFinancialPlanning.Api.Tests.Services.Dashboard;

public sealed class DashboardTilesServiceTests
{
    private static readonly DateOnly AsOf = new(2026, 5, 13);

    [Fact]
    public async Task IncomeAndExpenseThisMonth_SumOnlyCurrentMonthCashMovements()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        ledger
            .AddIncome(new DateOnly(2026, 5, 1), 1000m)
            .AddIncome(new DateOnly(2026, 5, 15), 500m)
            .AddExpense(new DateOnly(2026, 5, 10), 200m)
            // Prior month — should be excluded from this-month totals.
            .AddIncome(new DateOnly(2026, 4, 1), 999m)
            // Internal savings transaction — should be ignored.
            .AddExpense(new DateOnly(2026, 5, 5), 50m, isCashMovement: false);
        await ledger.SaveAsync();

        var result = await new DashboardTilesService(db).GetAsync(AsOf, default);

        Assert.Equal(1500m, result.IncomeThisMonth.Value);
        Assert.Equal(200m, result.ExpenseThisMonth.Value);
        Assert.Equal(1300m, result.NetThisMonth.Value);
    }

    [Fact]
    public async Task Next30Days_SumsFromAsOfThroughThirtyDaysOut()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        ledger
            .AddIncome(new DateOnly(2026, 5, 14), 800m)     // in window
            .AddExpense(new DateOnly(2026, 6, 12), 300m)    // in window (within 30 days)
            .AddExpense(new DateOnly(2026, 6, 13), 100m)    // exactly on day +31, OUT of window
            .AddIncome(new DateOnly(2026, 5, 12), 200m);    // day before asOf, OUT of window
        await ledger.SaveAsync();

        var result = await new DashboardTilesService(db).GetAsync(AsOf, default);

        Assert.Equal(800m - 300m, result.NetNext30Days.Value);
    }

    [Fact]
    public async Task HasEnoughHistoryForBaselines_FalseWhenNoCashItemsBeforeBaselineWindow()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        // Only this-month activity — nothing before Feb 1, 2026.
        ledger.AddIncome(new DateOnly(2026, 5, 1), 1000m);
        await ledger.SaveAsync();

        var result = await new DashboardTilesService(db).GetAsync(AsOf, default);

        Assert.False(result.HasEnoughHistoryForBaselines);
        Assert.Null(result.IncomeThisMonth.Baseline);
        Assert.Null(result.ExpenseThisMonth.Baseline);
        Assert.Null(result.NetThisMonth.Baseline);
        Assert.Null(result.NetNext30Days.Baseline);
    }

    [Fact]
    public async Task Baselines_AverageOfPriorThreeCalendarMonths()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        // Anchor: at least one item BEFORE the 3-month baseline window so the
        // "enough history" check passes.
        ledger.AddIncome(new DateOnly(2026, 1, 15), 1m);

        // Prior 3 months: Feb, Mar, Apr 2026.
        ledger.AddIncome(new DateOnly(2026, 2, 10), 1000m);
        ledger.AddExpense(new DateOnly(2026, 2, 11), 400m);

        ledger.AddIncome(new DateOnly(2026, 3, 10), 2000m);
        ledger.AddExpense(new DateOnly(2026, 3, 11), 800m);

        ledger.AddIncome(new DateOnly(2026, 4, 10), 3000m);
        ledger.AddExpense(new DateOnly(2026, 4, 11), 1200m);
        await ledger.SaveAsync();

        var result = await new DashboardTilesService(db).GetAsync(AsOf, default);

        Assert.True(result.HasEnoughHistoryForBaselines);
        Assert.Equal(2000m, result.IncomeThisMonth.Baseline);
        Assert.Equal(800m, result.ExpenseThisMonth.Baseline);
        Assert.Equal(1200m, result.NetThisMonth.Baseline);
    }

    [Fact]
    public async Task NonCashMovements_DoNotPolluteBaselines()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        // Pre-baseline anchor.
        ledger.AddIncome(new DateOnly(2026, 1, 15), 1m);
        // Baseline window: only one real expense per month, plus large internal
        // savings entries that must be ignored.
        ledger.AddExpense(new DateOnly(2026, 2, 11), 100m);
        ledger.AddExpense(new DateOnly(2026, 2, 12), 9999m, isCashMovement: false);
        ledger.AddExpense(new DateOnly(2026, 3, 11), 100m);
        ledger.AddExpense(new DateOnly(2026, 4, 11), 100m);
        await ledger.SaveAsync();

        var result = await new DashboardTilesService(db).GetAsync(AsOf, default);

        Assert.Equal(100m, result.ExpenseThisMonth.Baseline);
    }
}
