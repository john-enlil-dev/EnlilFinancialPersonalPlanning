using EnlilFinancialPlanning.Api.Dtos.Savings;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.Savings;

public sealed class UpdateSavingsRequestValidator : AbstractValidator<UpdateSavingsRequest>
{
    public UpdateSavingsRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Institution).MaximumLength(200);
        RuleFor(x => x.Subtype).MaximumLength(100);
        RuleFor(x => x.CompoundingFrequency).IsInEnum();
        RuleFor(x => x.CurrentRate).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CurrentValue).GreaterThanOrEqualTo(0);
    }
}
