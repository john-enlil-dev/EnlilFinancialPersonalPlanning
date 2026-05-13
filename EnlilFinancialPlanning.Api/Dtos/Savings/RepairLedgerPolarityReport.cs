namespace EnlilFinancialPlanning.Api.Dtos.Savings;

public sealed record RepairLedgerPolarityReport(
    bool DryRun,
    int TotalScanned,
    int Updated,
    int AlreadyCorrect,
    int UnknownComponentType,
    IReadOnlyDictionary<string, int> UpdatedByComponentType);
