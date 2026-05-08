using EnlilFinancialPlanning.Api.Dtos.MortgagePayments;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.MortgagePayments;

public sealed class CreateMortgagePaymentRequestValidator : AbstractValidator<CreateMortgagePaymentRequest>
{
    public CreateMortgagePaymentRequestValidator()
    {
        RuleFor(x => x.CategoryUID).NotEmpty();
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Allocations).NotNull().Must(a => a.Count > 0)
            .WithMessage("At least one allocation is required.");
        RuleForEach(x => x.Allocations).ChildRules(a =>
        {
            a.RuleFor(x => x.ComponentType).MaximumLength(100);
            a.RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
        });
    }
}
