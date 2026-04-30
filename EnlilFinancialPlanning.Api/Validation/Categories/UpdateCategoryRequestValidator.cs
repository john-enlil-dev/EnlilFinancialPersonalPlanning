using EnlilFinancialPlanning.Api.Dtos.Categories;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.Categories;

public sealed class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Direction).IsInEnum();
        RuleFor(x => x.Description).MaximumLength(500);
    }
}
