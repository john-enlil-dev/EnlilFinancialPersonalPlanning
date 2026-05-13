using EnlilFinancialPlanning.Api.Dtos.SavingsTransactions;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.SavingsTransactions;

public sealed class CreateSavingsTransactionRequestValidator : AbstractValidator<CreateSavingsTransactionRequest>
{
    private static readonly string[] AllowedComponents =
        new[] { "Deposit", "Withdrawal", "Interest", "Fee", "Transfer" };

    public CreateSavingsTransactionRequestValidator()
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
