using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.MortgageDebts;

public sealed record MortgageDebtResponse(
    Guid UID,
    string Name,
    string? Institution,
    decimal OriginalPrincipal,
    decimal InterestRate,
    int TermMonths,
    DateOnly StartDate,
    LoanType LoanType,
    decimal MonthlyPaymentPI,
    decimal EscrowMonthly,
    decimal PMIMonthly,
    Guid? LinkedRecurringTemplateUID,
    decimal CurrentBalance,
    DateOnly CurrentAsOfDate);
