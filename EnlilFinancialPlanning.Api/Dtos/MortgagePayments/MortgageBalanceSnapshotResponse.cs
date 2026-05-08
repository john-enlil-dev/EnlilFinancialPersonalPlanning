namespace EnlilFinancialPlanning.Api.Dtos.MortgagePayments;

public sealed record MortgageBalanceSnapshotResponse(
    Guid UID,
    DateOnly Date,
    decimal Balance);
