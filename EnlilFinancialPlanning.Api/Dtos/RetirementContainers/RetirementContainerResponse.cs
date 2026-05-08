using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.RetirementContainers;

public sealed record RetirementContainerResponse(
    Guid UID,
    string Name,
    string? Institution,
    AccountType AccountType,
    decimal CurrentValue,
    DateOnly CurrentAsOfDate);
