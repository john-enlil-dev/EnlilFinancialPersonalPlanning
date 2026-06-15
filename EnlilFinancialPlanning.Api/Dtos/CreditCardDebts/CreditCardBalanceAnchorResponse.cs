namespace EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;

public sealed record CreditCardBalanceAnchorResponse(
    Guid UID,
    DateOnly Date,
    decimal AssertedBalance,
    decimal AdjustmentAmount,
    bool IsOpening,
    string? Note);
