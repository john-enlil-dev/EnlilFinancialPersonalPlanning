namespace EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;

// Balance is ledger-driven now, so update is metadata-only. To change the balance,
// reconcile (POST /reconcile) — the edit form routes its balance field there.
public sealed class UpdateCreditCardDebtRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public decimal APR { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal MinimumPayment { get; set; }
}
