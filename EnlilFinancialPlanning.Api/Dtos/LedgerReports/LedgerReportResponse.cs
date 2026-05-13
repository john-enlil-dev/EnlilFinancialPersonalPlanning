namespace EnlilFinancialPlanning.Api.Dtos.LedgerReports;

public sealed record LedgerReportCategorySliceDto(
    Guid CategoryUID,
    string CategoryName,
    decimal Amount,
    int TransactionCount,
    decimal? PriorAmount);

public sealed record LedgerReportMonthlyCategoryDto(
    Guid CategoryUID,
    string CategoryName,
    decimal Amount);

public sealed record LedgerReportMonthlyBucketDto(
    DateOnly MonthStart,
    IReadOnlyList<LedgerReportMonthlyCategoryDto> Categories);

public sealed record LedgerReportInsightDto(
    string Kind,
    string Message);

public sealed record LedgerReportResponse(
    DateOnly From,
    DateOnly To,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetCashflow,
    IReadOnlyList<LedgerReportCategorySliceDto> ExpenseByCategory,
    IReadOnlyList<LedgerReportMonthlyBucketDto> MonthlyTrend,
    IReadOnlyList<LedgerReportInsightDto> Insights);
