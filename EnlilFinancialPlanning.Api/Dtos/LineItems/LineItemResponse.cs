using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.LineItems;

public sealed record LineItemResponse(
    Guid UID,
    Direction Direction,
    decimal Amount,
    DateOnly Date,
    string? Description,
    Guid CategoryUID,
    string CategoryName,
    Guid? SourceTemplateUID,
    string? SourceTemplateName,
    bool WasManuallyEdited);
