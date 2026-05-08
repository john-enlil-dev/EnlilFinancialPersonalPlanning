using EnlilFinancialPlanning.Api.Dtos.LineItemAllocations;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.LineItemAllocations;

public sealed class UpdateLineItemAllocationRequestValidator : AbstractValidator<UpdateLineItemAllocationRequest>
{
    public UpdateLineItemAllocationRequestValidator()
    {
        RuleFor(x => x.LinkedEntityUID).NotEmpty();
        RuleFor(x => x.LinkedEntityType).IsInEnum();
        RuleFor(x => x.ComponentType).MaximumLength(100);
    }
}
