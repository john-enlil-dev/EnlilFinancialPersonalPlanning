using EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.CreditCardDebts;

public sealed class UpdateCreditCardDebtRequestValidator : AbstractValidator<UpdateCreditCardDebtRequest>
{
    public UpdateCreditCardDebtRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Institution).MaximumLength(200);
        RuleFor(x => x.APR).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CreditLimit).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MinimumPayment).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CurrentBalance).GreaterThanOrEqualTo(0);
    }
}
