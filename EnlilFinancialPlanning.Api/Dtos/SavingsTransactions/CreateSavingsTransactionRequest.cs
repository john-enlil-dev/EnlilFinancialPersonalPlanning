namespace EnlilFinancialPlanning.Api.Dtos.SavingsTransactions;

public sealed class CreateSavingsTransactionRequest
{
    public DateOnly Date { get; set; }
    public DateOnly? BillingMonth { get; set; }
    public Guid CategoryUID { get; set; }
    public string? Description { get; set; }

    /// <summary>
    /// One of: Deposit, Withdrawal, Interest, Fee, Transfer. Drives the LineItem
    /// direction (Income for Deposit/Interest; Expense for the rest).
    /// </summary>
    public string ComponentType { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    /// <summary>
    /// Optional savings-specific grouping tag (e.g., "Vacation", "Emergency fund").
    /// Free-form string with frontend Creatable autocomplete; no DB lookup table.
    /// </summary>
    public string? Tag { get; set; }
}
