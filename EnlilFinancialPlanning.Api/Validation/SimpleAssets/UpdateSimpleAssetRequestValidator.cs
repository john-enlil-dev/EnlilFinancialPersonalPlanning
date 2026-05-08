using EnlilFinancialPlanning.Api.Dtos.SimpleAssets;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.SimpleAssets;

public sealed class UpdateSimpleAssetRequestValidator : AbstractValidator<UpdateSimpleAssetRequest>
{
    public UpdateSimpleAssetRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Subtype).MaximumLength(100);
        RuleFor(x => x.CurrentValue).GreaterThanOrEqualTo(0);
    }
}
