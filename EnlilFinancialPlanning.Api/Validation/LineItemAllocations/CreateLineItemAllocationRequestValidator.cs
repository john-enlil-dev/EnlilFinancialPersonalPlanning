using EnlilFinancialPlanning.Api.Dtos.LineItemAllocations;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.LineItemAllocations;

public sealed class CreateLineItemAllocationRequestValidator : AbstractValidator<CreateLineItemAllocationRequest>
{
    public CreateLineItemAllocationRequestValidator()
    {
        RuleFor(x => x.LineItemUID).NotEmpty();
        RuleFor(x => x.LinkedEntityUID).NotEmpty();
        RuleFor(x => x.LinkedEntityType).IsInEnum();
        RuleFor(x => x.ComponentType).MaximumLength(100);
    }
}
