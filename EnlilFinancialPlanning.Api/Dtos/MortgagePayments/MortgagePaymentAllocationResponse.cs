namespace EnlilFinancialPlanning.Api.Dtos.MortgagePayments;

public sealed record MortgagePaymentAllocationResponse(
    Guid UID,
    string? ComponentType,
    decimal Amount,
    bool AffectsLinkedBalance);
