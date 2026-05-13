namespace EnlilFinancialPlanning.Api.Dtos.CreditCardTransactions;

public sealed class CreateCreditCardTransactionRequest
{
    public DateOnly Date { get; set; }
    public DateOnly? BillingMonth { get; set; }
    public Guid CategoryUID { get; set; }
    public string? Description { get; set; }

    /// <summary>
    /// One of: Charge, Payment, Interest, Fee, Refund. Charge / Interest / Fee
    /// increase the credit card balance; Payment / Refund decrease it.
    /// </summary>
    public string ComponentType { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    /// <summary>
    /// Optional grouping tag (e.g., "Travel", "Groceries", "Auto-pay"). Free-form
    /// string with frontend Creatable autocomplete; no DB lookup table.
    /// </summary>
    public string? Tag { get; set; }
}
