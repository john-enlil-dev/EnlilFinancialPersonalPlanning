namespace EnlilFinancialPlanning.Api.Dtos.Dashboard;

public sealed record TimelineWeekDto(
    DateOnly WeekStart,
    DateOnly WeekEnd,
    decimal Income,
    decimal Expense,
    decimal Net,
    decimal RunningBalance);

public sealed record DashboardTimelineResponse(
    IReadOnlyList<TimelineWeekDto> Weeks,
    bool HasTemplates);
