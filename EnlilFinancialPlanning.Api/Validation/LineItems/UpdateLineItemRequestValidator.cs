using EnlilFinancialPlanning.Api.Dtos.LineItems;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.LineItems;

public sealed class UpdateLineItemRequestValidator : AbstractValidator<UpdateLineItemRequest>
{
    public UpdateLineItemRequestValidator()
    {
        RuleFor(x => x.Direction).IsInEnum();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.CategoryUID).NotEmpty();
    }
}
