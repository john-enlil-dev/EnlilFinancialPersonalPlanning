namespace EnlilFinancialPlanning.Api.Services;

public interface IBalanceAffectService
{
    Task ApplyAllocationAsync(Guid allocationUID, CancellationToken ct);
}
