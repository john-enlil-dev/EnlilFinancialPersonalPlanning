namespace EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;

public sealed record CreditCardDebtResponse(
    Guid UID,
    string Name,
    string? Institution,
    decimal APR,
    decimal CreditLimit,
    decimal MinimumPayment,
    decimal CurrentBalance,
    DateOnly CurrentAsOfDate);
