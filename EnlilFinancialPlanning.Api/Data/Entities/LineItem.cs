using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Data.Entities;

public sealed class LineItem
{
    public Guid UID { get; set; }
    public Direction Direction { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Description { get; set; }

    public Guid CategoryUID { get; set; }
    public Category Category { get; set; } = null!;

    public Guid? SourceTemplateUID { get; set; }
    public RecurringTemplate? SourceTemplate { get; set; }

    public bool WasManuallyEdited { get; set; }
}
