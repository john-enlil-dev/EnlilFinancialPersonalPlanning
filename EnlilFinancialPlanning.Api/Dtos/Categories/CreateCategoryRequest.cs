using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.Categories;

public sealed class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public CategoryDirection Direction { get; set; }
    public string? Description { get; set; }
}
