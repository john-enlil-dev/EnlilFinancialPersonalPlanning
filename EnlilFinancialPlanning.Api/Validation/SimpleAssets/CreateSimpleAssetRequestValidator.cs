using EnlilFinancialPlanning.Api.Dtos.SimpleAssets;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.SimpleAssets;

public sealed class CreateSimpleAssetRequestValidator : AbstractValidator<CreateSimpleAssetRequest>
{
    public CreateSimpleAssetRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Subtype).MaximumLength(100);
        RuleFor(x => x.CurrentValue).GreaterThanOrEqualTo(0);
    }
}
