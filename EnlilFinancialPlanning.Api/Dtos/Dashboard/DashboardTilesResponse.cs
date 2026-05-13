namespace EnlilFinancialPlanning.Api.Dtos.Dashboard;

public sealed record DashboardTileDto(
    decimal Value,
    decimal? Baseline);

public sealed record DashboardTilesResponse(
    DashboardTileDto IncomeThisMonth,
    DashboardTileDto ExpenseThisMonth,
    DashboardTileDto NetThisMonth,
    DashboardTileDto NetNext30Days,
    bool HasEnoughHistoryForBaselines);
