using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.RecurringTemplates;

public sealed record RecurringTemplateResponse(
    Guid UID,
    string Name,
    Direction Direction,
    Guid CategoryUID,
    string CategoryName,
    decimal Amount,
    string? Description,
    DateOnly StartDate,
    DateOnly? EndDate,
    Cadence Cadence,
    int? DayOfMonth,
    bool UseLastDayOfMonth,
    DayOfWeek? DayOfWeek,
    int? MonthOfQuarter,
    int? MonthOfYear,
    int? IntervalDays);
