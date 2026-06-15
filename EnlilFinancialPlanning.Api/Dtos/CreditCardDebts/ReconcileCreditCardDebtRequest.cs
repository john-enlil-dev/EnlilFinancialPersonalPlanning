namespace EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;

/// <summary>
/// Asserts the card's true balance on a date. Creates a balance anchor and, if the
/// asserted balance differs from the computed balance, an Adjustment line item for the
/// drift (categorized by <see cref="CategoryUID"/>).
/// </summary>
public sealed class ReconcileCreditCardDebtRequest
{
    public DateOnly Date { get; set; }
    public decimal AssertedBalance { get; set; }
    public Guid CategoryUID { get; set; }
    public string? Note { get; set; }
}
