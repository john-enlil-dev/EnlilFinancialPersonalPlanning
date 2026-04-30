using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.RecurringTemplates;

public sealed class CreateRecurringTemplateRequest
{
    public string Name { get; set; } = string.Empty;
    public Direction Direction { get; set; }
    public Guid CategoryUID { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public Cadence Cadence { get; set; }

    public int? DayOfMonth { get; set; }
    public bool UseLastDayOfMonth { get; set; }
    public DayOfWeek? DayOfWeek { get; set; }
    public int? MonthOfQuarter { get; set; }
    public int? MonthOfYear { get; set; }
    public int? IntervalDays { get; set; }
}
