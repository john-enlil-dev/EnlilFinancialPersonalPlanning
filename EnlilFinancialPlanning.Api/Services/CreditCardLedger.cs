using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Services;

/// <summary>
/// Sign rules for how a credit-card line item moves the (debt) balance. Driven by
/// <c>ComponentType</c>: Charge / Interest / Fee increase debt; Payment / Refund
/// decrease it. Adjustment (and any legacy/unknown type) follows the line item's
/// cash-flow <see cref="Direction"/> — Expense increases debt, Income decreases it.
/// </summary>
public static class CreditCardLedger
{
    public const string AdjustmentComponentType = "Adjustment";

    public static decimal SignedDebtDelta(string? componentType, Direction direction, decimal amount)
    {
        switch ((componentType ?? string.Empty).Trim().ToLowerInvariant())
        {
            case "charge":
            case "interest":
            case "fee":
                return amount;
            case "payment":
            case "refund":
                return -amount;
            default:
                return direction == Direction.Expense ? amount : -amount;
        }
    }
}
