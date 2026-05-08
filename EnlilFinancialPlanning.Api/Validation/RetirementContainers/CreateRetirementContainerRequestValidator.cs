using EnlilFinancialPlanning.Api.Dtos.RetirementContainers;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.RetirementContainers;

public sealed class CreateRetirementContainerRequestValidator : AbstractValidator<CreateRetirementContainerRequest>
{
    public CreateRetirementContainerRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Institution).MaximumLength(200);
        RuleFor(x => x.AccountType).IsInEnum();
    }
}
