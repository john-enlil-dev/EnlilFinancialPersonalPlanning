namespace EnlilFinancialPlanning.Api.Services;

public interface ITemplateSeederService
{
    Task SeedHorizonAsync(Guid templateUID, CancellationToken ct);

    Task ReseedHorizonAsync(Guid templateUID, CancellationToken ct);

    Task ExtendHorizonForAllTemplatesAsync(CancellationToken ct);
}
