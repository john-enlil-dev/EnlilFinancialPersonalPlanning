using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Data.Entities;

public sealed class Category
{
    public Guid UID { get; set; }
    public required string Name { get; set; }
    public CategoryDirection Direction { get; set; }
    public string? Description { get; set; }
    public bool IsArchived { get; set; }
}
