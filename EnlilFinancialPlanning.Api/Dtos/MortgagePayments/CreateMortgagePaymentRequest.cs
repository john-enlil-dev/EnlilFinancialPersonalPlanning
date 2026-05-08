namespace EnlilFinancialPlanning.Api.Dtos.MortgagePayments;

public sealed class CreateMortgagePaymentRequest
{
    public DateOnly Date { get; set; }
    public Guid CategoryUID { get; set; }
    public string? Description { get; set; }
    public List<CreateMortgagePaymentAllocationInput> Allocations { get; set; } = new();

    /// <summary>
    /// Optional billing period this payment counts toward, when it differs from the
    /// payment's actual date (e.g., a payment dated 11/30 attributed to December).
    /// First-of-month convention. Propagated to every allocation row.
    /// </summary>
    public DateOnly? BillingMonth { get; set; }

    /// <summary>
    /// Optional. When supplied, the mortgage's principal balance at the payment's
    /// date is recorded as a snapshot, enabling principal-over-time charts. If the
    /// payment date is at or after the mortgage's current as-of date, the cached
    /// CurrentBalance / CurrentAsOfDate on the mortgage are also updated.
    /// </summary>
    public decimal? BalanceAfterPayment { get; set; }
}

public sealed class CreateMortgagePaymentAllocationInput
{
    public string? ComponentType { get; set; }
    public decimal Amount { get; set; }
}
