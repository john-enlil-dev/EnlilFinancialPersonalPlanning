namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

/// <summary>
/// A dated assertion of a credit card's true balance. The opening balance is just
/// the first anchor (IsOpening = true); every reconciliation adds another. The card's
/// balance on any date is the latest anchor on/before that date plus the signed sum of
/// line items strictly after the anchor's date.
/// </summary>
public sealed class CreditCardBalanceAnchor
{
    public Guid UID { get; set; }

    public Guid CreditCardDebtUID { get; set; }
    public CreditCardDebt CreditCardDebt { get; set; } = null!;

    public DateOnly Date { get; set; }

    /// <summary>The balance the user asserts is true as of <see cref="Date"/>.</summary>
    public decimal AssertedBalance { get; set; }

    /// <summary>
    /// Signed drift (asserted − computed) recorded at reconcile time, in debt terms
    /// (positive = debt was higher than the ledger thought). 0 for the opening anchor
    /// or when there was no drift.
    /// </summary>
    public decimal AdjustmentAmount { get; set; }

    /// <summary>True for the single opening anchor created when the card is created.</summary>
    public bool IsOpening { get; set; }

    public string? Note { get; set; }

    /// <summary>
    /// The Adjustment line item created for the drift (if any), so deleting the anchor
    /// can also remove its adjustment.
    /// </summary>
    public Guid? AdjustmentLineItemUID { get; set; }
}
