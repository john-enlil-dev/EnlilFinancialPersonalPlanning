namespace EnlilFinancialPlanning.Api.Dtos.Dashboard;

public sealed record CategoryVarianceRowDto(
    Guid CategoryUID,
    string CategoryName,
    decimal ThisMonth,
    decimal? Baseline,
    decimal? Delta,
    decimal? PercentDelta);

public sealed record DashboardCategoryVarianceResponse(
    IReadOnlyList<CategoryVarianceRowDto> Rows,
    bool HasEnoughHistoryForBaselines);
