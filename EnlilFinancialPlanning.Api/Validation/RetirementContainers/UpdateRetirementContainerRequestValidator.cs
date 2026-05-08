using EnlilFinancialPlanning.Api.Dtos.RetirementContainers;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.RetirementContainers;

public sealed class UpdateRetirementContainerRequestValidator : AbstractValidator<UpdateRetirementContainerRequest>
{
    public UpdateRetirementContainerRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Institution).MaximumLength(200);
        RuleFor(x => x.AccountType).IsInEnum();
    }
}
