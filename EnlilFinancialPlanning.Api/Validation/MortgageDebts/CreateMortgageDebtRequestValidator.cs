using EnlilFinancialPlanning.Api.Dtos.MortgageDebts;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.MortgageDebts;

public sealed class CreateMortgageDebtRequestValidator : AbstractValidator<CreateMortgageDebtRequest>
{
    public CreateMortgageDebtRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Institution).MaximumLength(200);
        RuleFor(x => x.OriginalPrincipal).GreaterThan(0);
        RuleFor(x => x.InterestRate).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TermMonths).GreaterThan(0);
        RuleFor(x => x.LoanType).IsInEnum();
        RuleFor(x => x.MonthlyPaymentPI).GreaterThanOrEqualTo(0);
        RuleFor(x => x.EscrowMonthly).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PMIMonthly).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CurrentBalance).GreaterThanOrEqualTo(0);
    }
}
