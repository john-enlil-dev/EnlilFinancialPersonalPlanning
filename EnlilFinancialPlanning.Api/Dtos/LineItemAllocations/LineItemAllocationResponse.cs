using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.LineItemAllocations;

public sealed record LineItemAllocationResponse(
    Guid UID,
    Guid LineItemUID,
    Guid LinkedEntityUID,
    LinkedEntityType LinkedEntityType,
    string? ComponentType,
    decimal Amount,
    bool AffectsLinkedBalance);
