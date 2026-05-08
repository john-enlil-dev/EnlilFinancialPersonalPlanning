using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.RetirementContainers;

public sealed class CreateRetirementContainerRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public AccountType AccountType { get; set; }
}
