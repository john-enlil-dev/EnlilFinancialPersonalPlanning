using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.LineItemAllocations;

public sealed class CreateLineItemAllocationRequest
{
    public Guid LineItemUID { get; set; }
    public Guid LinkedEntityUID { get; set; }
    public LinkedEntityType LinkedEntityType { get; set; }
    public string? ComponentType { get; set; }
    public decimal Amount { get; set; }
    public bool AffectsLinkedBalance { get; set; }
}
