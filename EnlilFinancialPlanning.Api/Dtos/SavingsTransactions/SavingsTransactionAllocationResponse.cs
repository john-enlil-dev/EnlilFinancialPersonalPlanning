namespace EnlilFinancialPlanning.Api.Dtos.SavingsTransactions;

public sealed record SavingsTransactionAllocationResponse(
    Guid UID,
    string? ComponentType,
    decimal Amount,
    string? Tag,
    bool AffectsLinkedBalance);
