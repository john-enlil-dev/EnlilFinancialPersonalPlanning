using EnlilFinancialPlanning.Api.Dtos.RetirementHoldings;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.RetirementHoldings;

public sealed class UpdateRetirementHoldingRequestValidator : AbstractValidator<UpdateRetirementHoldingRequest>
{
    public UpdateRetirementHoldingRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Symbol).MaximumLength(20);
        RuleFor(x => x.Units).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PricePerUnit).GreaterThanOrEqualTo(0);
    }
}
