using EnlilFinancialPlanning.Api.Dtos.LongTermItems;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.LongTermItems;

public sealed class CreateLongTermItemRequestValidator : AbstractValidator<CreateLongTermItemRequest>
{
    public CreateLongTermItemRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Subtype).MaximumLength(100);
        RuleFor(x => x.CurrentValue).GreaterThanOrEqualTo(0);
    }
}
