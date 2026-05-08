using EnlilFinancialPlanning.Api.Dtos.Holdings;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.Holdings;

public sealed class UpdateHoldingRequestValidator : AbstractValidator<UpdateHoldingRequest>
{
    public UpdateHoldingRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Symbol).MaximumLength(20);
        RuleFor(x => x.Units).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PricePerUnit).GreaterThanOrEqualTo(0);
    }
}
