using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Services.Dashboard;
using EnlilFinancialPlanning.Api.Tests.TestHelpers;
using Xunit;

namespace EnlilFinancialPlanning.Api.Tests.Services.Dashboard;

public sealed class DashboardCategoryVarianceServiceTests
{
    private static readonly DateOnly AsOf = new(2026, 5, 13);

    [Fact]
    public async Task ReturnsOneRowPerExpenseCategoryWithActivity()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        var groceries = ledger.AddCategory("Groceries");
        var gas = ledger.AddCategory("Gas");
        ledger.AddExpense(new DateOnly(2026, 5, 5), 400m, groceries);
        ledger.AddExpense(new DateOnly(2026, 5, 8), 80m, gas);
        await ledger.SaveAsync();

        var result = await new DashboardCategoryVarianceService(db).GetAsync(AsOf, default);

        Assert.Equal(2, result.Rows.Count);
        var byName = result.Rows.ToDictionary(r => r.CategoryName);
        Assert.Equal(400m, byName["Groceries"].ThisMonth);
        Assert.Equal(80m, byName["Gas"].ThisMonth);
    }

    [Fact]
    public async Task IncomeLineItems_AreExcluded()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        var salary = ledger.AddCategory("Salary", CategoryDirection.Income);
        ledger.AddIncome(new DateOnly(2026, 5, 1), 5000m, salary);
        await ledger.SaveAsync();

        var result = await new DashboardCategoryVarianceService(db).GetAsync(AsOf, default);

        Assert.Empty(result.Rows);
    }

    [Fact]
    public async Task ArchivedCategories_AreExcluded()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        var archived = ledger.AddCategory("Old Subscription", isArchived: true);
        ledger.AddExpense(new DateOnly(2026, 5, 1), 50m, archived);
        await ledger.SaveAsync();

        var result = await new DashboardCategoryVarianceService(db).GetAsync(AsOf, default);

        Assert.Empty(result.Rows);
    }

    [Fact]
    public async Task NonCashMovements_AreExcluded()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        var fees = ledger.AddCategory("Savings Fees");
        ledger.AddExpense(new DateOnly(2026, 5, 1), 25m, fees, isCashMovement: false);
        await ledger.SaveAsync();

        var result = await new DashboardCategoryVarianceService(db).GetAsync(AsOf, default);

        Assert.Empty(result.Rows);
    }

    [Fact]
    public async Task Baseline_IsTrailingThreeMonthAveragePerCategory()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        // Pre-baseline anchor so HasEnoughHistory = true.
        ledger.AddExpense(new DateOnly(2026, 1, 15), 1m);

        var groceries = ledger.AddCategory("Groceries");
        // Feb=300, Mar=600, Apr=900 → avg 600.
        ledger.AddExpense(new DateOnly(2026, 2, 5), 300m, groceries);
        ledger.AddExpense(new DateOnly(2026, 3, 5), 600m, groceries);
        ledger.AddExpense(new DateOnly(2026, 4, 5), 900m, groceries);
        // May (this month): 750.
        ledger.AddExpense(new DateOnly(2026, 5, 5), 750m, groceries);
        await ledger.SaveAsync();

        var result = await new DashboardCategoryVarianceService(db).GetAsync(AsOf, default);

        var row = Assert.Single(result.Rows, r => r.CategoryName == "Groceries");
        Assert.Equal(750m, row.ThisMonth);
        Assert.Equal(600m, row.Baseline);
        Assert.Equal(150m, row.Delta);
        Assert.Equal(0.25m, row.PercentDelta);
    }

    [Fact]
    public async Task RowsSorted_ByAbsoluteDeltaDescending()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        ledger.AddExpense(new DateOnly(2026, 1, 1), 1m);  // history anchor

        var small = ledger.AddCategory("Small Mover");
        var big = ledger.AddCategory("Big Mover");
        // Small: baseline 100, this month 110 → delta +10.
        ledger.AddExpense(new DateOnly(2026, 2, 1), 100m, small);
        ledger.AddExpense(new DateOnly(2026, 3, 1), 100m, small);
        ledger.AddExpense(new DateOnly(2026, 4, 1), 100m, small);
        ledger.AddExpense(new DateOnly(2026, 5, 1), 110m, small);
        // Big: baseline 100, this month 600 → delta +500.
        ledger.AddExpense(new DateOnly(2026, 2, 2), 100m, big);
        ledger.AddExpense(new DateOnly(2026, 3, 2), 100m, big);
        ledger.AddExpense(new DateOnly(2026, 4, 2), 100m, big);
        ledger.AddExpense(new DateOnly(2026, 5, 2), 600m, big);
        await ledger.SaveAsync();

        var result = await new DashboardCategoryVarianceService(db).GetAsync(AsOf, default);

        var movers = result.Rows.Where(r => r.CategoryName is "Big Mover" or "Small Mover").ToList();
        Assert.Equal("Big Mover", movers[0].CategoryName);
        Assert.Equal("Small Mover", movers[1].CategoryName);
    }

    [Fact]
    public async Task HasEnoughHistoryForBaselines_FalseWhenNoPriorHistory_BaselinesNull()
    {
        await using var db = TestDbContextFactory.Create();
        var ledger = new LedgerBuilder(db);
        var groceries = ledger.AddCategory("Groceries");
        ledger.AddExpense(new DateOnly(2026, 5, 5), 400m, groceries);
        await ledger.SaveAsync();

        var result = await new DashboardCategoryVarianceService(db).GetAsync(AsOf, default);

        Assert.False(result.HasEnoughHistoryForBaselines);
        var row = Assert.Single(result.Rows);
        Assert.Equal(400m, row.ThisMonth);
        Assert.Null(row.Baseline);
        Assert.Null(row.Delta);
        Assert.Null(row.PercentDelta);
    }
}
