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

    // False for LineItems that represent savings-internal events (Interest, Fee,
    // Transfer) which must NOT affect the cash ledger. True for everything else,
    // including savings Deposits/Withdrawals (which DO move cash).
    public bool IsCashMovement { get; set; } = true;
}
