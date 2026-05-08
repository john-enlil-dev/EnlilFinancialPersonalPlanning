namespace EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;

public sealed class CreateCreditCardDebtRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public decimal APR { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal MinimumPayment { get; set; }
    public decimal CurrentBalance { get; set; }
    public DateOnly CurrentAsOfDate { get; set; }
}
