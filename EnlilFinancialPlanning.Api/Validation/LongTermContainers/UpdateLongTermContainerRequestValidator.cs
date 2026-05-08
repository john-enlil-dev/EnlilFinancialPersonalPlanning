using EnlilFinancialPlanning.Api.Dtos.LongTermContainers;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.LongTermContainers;

public sealed class UpdateLongTermContainerRequestValidator : AbstractValidator<UpdateLongTermContainerRequest>
{
    public UpdateLongTermContainerRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Institution).MaximumLength(200);
    }
}
