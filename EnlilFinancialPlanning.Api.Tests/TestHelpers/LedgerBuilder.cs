using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Tests.TestHelpers;

// Builder for seeding a test ledger. Tests describe just the fields they care
// about; the builder fills in sensible defaults for the rest. Each Add* returns
// the builder so calls can chain.
public sealed class LedgerBuilder
{
    private readonly AppDbContext _db;
    private Category _defaultExpense;
    private Category _defaultIncome;

    public LedgerBuilder(AppDbContext db)
    {
        _db = db;

        _defaultExpense = new Category
        {
            UID = Guid.NewGuid(),
            Name = "Default Expense",
            Direction = CategoryDirection.Expense,
            Description = null,
            IsArchived = false,
        };
        _defaultIncome = new Category
        {
            UID = Guid.NewGuid(),
            Name = "Default Income",
            Direction = CategoryDirection.Income,
            Description = null,
            IsArchived = false,
        };
        _db.Categories.AddRange(_defaultExpense, _defaultIncome);
    }

    public Category AddCategory(
        string name,
        CategoryDirection direction = CategoryDirection.Expense,
        bool isArchived = false)
    {
        var cat = new Category
        {
            UID = Guid.NewGuid(),
            Name = name,
            Direction = direction,
            Description = null,
            IsArchived = isArchived,
        };
        _db.Categories.Add(cat);
        return cat;
    }

    public LedgerBuilder AddIncome(
        DateOnly date,
        decimal amount,
        Category? category = null,
        bool isCashMovement = true)
    {
        _db.LineItems.Add(new LineItem
        {
            UID = Guid.NewGuid(),
            Direction = Direction.Income,
            Amount = amount,
            Date = date,
            Description = null,
            CategoryUID = (category ?? _defaultIncome).UID,
            IsCashMovement = isCashMovement,
        });
        return this;
    }

    public LedgerBuilder AddExpense(
        DateOnly date,
        decimal amount,
        Category? category = null,
        bool isCashMovement = true)
    {
        _db.LineItems.Add(new LineItem
        {
            UID = Guid.NewGuid(),
            Direction = Direction.Expense,
            Amount = amount,
            Date = date,
            Description = null,
            CategoryUID = (category ?? _defaultExpense).UID,
            IsCashMovement = isCashMovement,
        });
        return this;
    }

    public LedgerBuilder AddRecurringTemplate(string name = "Test Template")
    {
        _db.RecurringTemplates.Add(new RecurringTemplate
        {
            UID = Guid.NewGuid(),
            Name = name,
            Direction = Direction.Expense,
            CategoryUID = _defaultExpense.UID,
            Amount = 100m,
            Description = null,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = null,
            Cadence = Cadence.Monthly,
            DayOfMonth = 1,
            UseLastDayOfMonth = false,
            DayOfWeek = null,
            MonthOfQuarter = null,
            MonthOfYear = null,
            IntervalDays = null,
        });
        return this;
    }

    public async Task SaveAsync()
    {
        await _db.SaveChangesAsync();
    }
}
