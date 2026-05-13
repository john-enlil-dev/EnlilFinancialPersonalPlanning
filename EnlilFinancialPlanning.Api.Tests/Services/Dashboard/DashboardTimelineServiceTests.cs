using EnlilFinancialPlanning.Api.Services.Dashboard;
using EnlilFinancialPlanning.Api.Tests.TestHelpers;
using Xunit;

namespace EnlilFinancialPlanning.Api.Tests.Services.Dashboard;

public sealed class DashboardTimelineServiceTests
{
    // 2026-05-13 is a Wednesday — week starts Mon 2026-05-11.
    private static readonly DateOnly AsOf = new(2026, 5, 13);
    private static readonly DateOnly FirstWeekStart = new(2026, 5, 11);

    [Fact]
    public async Task ReturnsThirteenWeeklyBucketsStartingFromMondayOfAsOf()
    {
        await using var db = TestDbContextFactory.Create();
        await new LedgerBuilder(db).SaveAsync();

        var result = await new DashboardTimelineService(db).GetAsync(AsOf, default);

        Assert.Equal(13, result.Weeks.Count);
        Assert.Equal(FirstWeekStart, result.Weeks[0].WeekStart);
        Assert.Equal(FirstWeekStart.AddDays(6), result.Weeks[0].WeekEnd);
        Assert.Equal(FirstWeekStart.AddDays(12 * 7), result.Weeks[12].WeekStart);
    }

    [Fact]
    public async Task PerWeekBuckets_SumIncomeAndExpenseInsideThatWeekOnly()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        // Week 0 (May 11–17): income 500, expense 100.
        ledger.AddIncome(new DateOnly(2026, 5, 11), 500m);
        ledger.AddExpense(new DateOnly(2026, 5, 17), 100m);
        // Week 1 (May 18–24): expense 250.
        ledger.AddExpense(new DateOnly(2026, 5, 20), 250m);
        // Non-cash savings entry inside week 0 — must be ignored.
        ledger.AddExpense(new DateOnly(2026, 5, 13), 9999m, isCashMovement: false);
        await ledger.SaveAsync();

        var result = await new DashboardTimelineService(db).GetAsync(AsOf, default);

        Assert.Equal(500m, result.Weeks[0].Income);
        Assert.Equal(100m, result.Weeks[0].Expense);
        Assert.Equal(400m, result.Weeks[0].Net);
        Assert.Equal(0m, result.Weeks[1].Income);
        Assert.Equal(250m, result.Weeks[1].Expense);
    }

    [Fact]
    public async Task RunningBalance_AccumulatesAcrossWeeksAndIncludesPriorLedgerActivity()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        // Opening balance from before the first week: +1000 income, -200 expense
        // → opening balance = 800.
        ledger.AddIncome(new DateOnly(2025, 12, 1), 1000m);
        ledger.AddExpense(new DateOnly(2026, 1, 1), 200m);
        // Internal-only entry before window — must NOT affect opening balance.
        ledger.AddIncome(new DateOnly(2025, 12, 5), 9999m, isCashMovement: false);
        // Week 0 net = +100, Week 1 net = -50.
        ledger.AddIncome(new DateOnly(2026, 5, 12), 100m);
        ledger.AddExpense(new DateOnly(2026, 5, 19), 50m);
        await ledger.SaveAsync();

        var result = await new DashboardTimelineService(db).GetAsync(AsOf, default);

        Assert.Equal(900m, result.Weeks[0].RunningBalance);   // 800 + 100
        Assert.Equal(850m, result.Weeks[1].RunningBalance);   // 900 - 50
        Assert.Equal(850m, result.Weeks[12].RunningBalance);  // unchanged through empty weeks
    }

    [Fact]
    public async Task HasTemplates_TrueWhenAnyRecurringTemplateExists()
    {
        await using var db = TestDbContextFactory.Create();
        await new LedgerBuilder(db).AddRecurringTemplate().SaveAsync();

        var result = await new DashboardTimelineService(db).GetAsync(AsOf, default);

        Assert.True(result.HasTemplates);
    }

    [Fact]
    public async Task HasTemplates_FalseWhenNoRecurringTemplatesExist()
    {
        await using var db = TestDbContextFactory.Create();
        await new LedgerBuilder(db).SaveAsync();

        var result = await new DashboardTimelineService(db).GetAsync(AsOf, default);

        Assert.False(result.HasTemplates);
    }
}
