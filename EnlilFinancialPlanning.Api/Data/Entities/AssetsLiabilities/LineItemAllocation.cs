using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;

public sealed class LineItemAllocation
{
    public Guid UID { get; set; }

    public Guid LineItemUID { get; set; }
    public LineItem LineItem { get; set; } = null!;

    public Guid LinkedEntityUID { get; set; }
    public LinkedEntityType LinkedEntityType { get; set; }

    public string? ComponentType { get; set; }
    public decimal Amount { get; set; }
    public bool AffectsLinkedBalance { get; set; }

    // The billing period this allocation applies to (e.g., a mortgage payment dated
    // 11/30 that should be attributed to December would have BillingMonth = 2024-12-01).
    // First-of-month convention — the day component is irrelevant. Null means use the
    // parent LineItem's Date directly when grouping by month.
    public DateOnly? BillingMonth { get; set; }
}
