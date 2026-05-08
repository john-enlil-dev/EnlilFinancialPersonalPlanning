namespace EnlilFinancialPlanning.Api.Dtos.LongTermContainers;

public sealed class UpdateLongTermContainerRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Institution { get; set; }
}
