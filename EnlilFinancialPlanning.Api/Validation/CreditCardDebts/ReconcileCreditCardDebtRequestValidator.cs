using EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.CreditCardDebts;

public sealed class ReconcileCreditCardDebtRequestValidator : AbstractValidator<ReconcileCreditCardDebtRequest>
{
    public ReconcileCreditCardDebtRequestValidator()
    {
        RuleFor(x => x.AssertedBalance).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CategoryUID).NotEmpty();
        RuleFor(x => x.Note).MaximumLength(500);
    }
}
