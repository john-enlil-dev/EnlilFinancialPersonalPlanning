namespace EnlilFinancialPlanning.Api.Services;

public interface IMortgageAmortizationService
{
    Task RegenerateAsync(Guid mortgageDebtUID, CancellationToken ct);
}
