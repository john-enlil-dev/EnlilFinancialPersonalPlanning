using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.SavingsTransactions;

public sealed record SavingsTransactionResponse(
    Guid LineItemUID,
    DateOnly Date,
    DateOnly? BillingMonth,
    Direction Direction,
    string? ComponentType,
    decimal Amount,
    string? Tag,
    string? Description,
    Guid CategoryUID,
    string CategoryName,
    Guid AllocationUID);
