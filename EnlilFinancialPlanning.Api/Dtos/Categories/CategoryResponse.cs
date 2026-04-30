using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.Categories;

public sealed record CategoryResponse(
    Guid UID,
    string Name,
    CategoryDirection Direction,
    string? Description,
    bool IsArchived);
