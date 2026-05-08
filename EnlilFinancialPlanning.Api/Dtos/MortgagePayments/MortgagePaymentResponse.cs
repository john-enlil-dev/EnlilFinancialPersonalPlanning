namespace EnlilFinancialPlanning.Api.Dtos.MortgagePayments;

public sealed record MortgagePaymentResponse(
    Guid LineItemUID,
    DateOnly Date,
    DateOnly? BillingMonth,
    decimal TotalAmount,
    string? Description,
    Guid CategoryUID,
    string CategoryName,
    IReadOnlyList<MortgagePaymentAllocationResponse> Allocations);
