using EnlilFinancialPlanning.Api.Dtos.Holdings;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.Holdings;

public sealed class CreateHoldingRequestValidator : AbstractValidator<CreateHoldingRequest>
{
    public CreateHoldingRequestValidator()
    {
        RuleFor(x => x.LongTermContainerUID).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Symbol).MaximumLength(20);
        RuleFor(x => x.Units).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PricePerUnit).GreaterThanOrEqualTo(0);
    }
}
