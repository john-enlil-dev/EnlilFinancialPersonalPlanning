using EnlilFinancialPlanning.Api.Dtos.CreditCardTransactions;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.CreditCardTransactions;

public sealed class CreateCreditCardTransactionRequestValidator
    : AbstractValidator<CreateCreditCardTransactionRequest>
{
    private static readonly string[] AllowedComponents =
        new[] { "Charge", "Payment", "Interest", "Fee", "Refund" };

    public CreateCreditCardTransactionRequestValidator()
    {
        RuleFor(x => x.CategoryUID).NotEmpty();
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.ComponentType)
            .NotEmpty()
            .Must(v => AllowedComponents.Contains(v.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage($"ComponentType must be one of: {string.Join(", ", AllowedComponents)}.");
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Tag).MaximumLength(100);
    }
}
