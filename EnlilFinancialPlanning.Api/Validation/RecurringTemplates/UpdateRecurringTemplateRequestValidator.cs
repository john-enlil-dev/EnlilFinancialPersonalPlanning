using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.RecurringTemplates;
using FluentValidation;

namespace EnlilFinancialPlanning.Api.Validation.RecurringTemplates;

public sealed class UpdateRecurringTemplateRequestValidator : AbstractValidator<UpdateRecurringTemplateRequest>
{
    public UpdateRecurringTemplateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Direction).IsInEnum();
        RuleFor(x => x.CategoryUID).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.EndDate.HasValue);
        RuleFor(x => x.Cadence).IsInEnum();

        RuleFor(x => x.DayOfMonth)
            .InclusiveBetween(1, 28)
            .When(x => x.DayOfMonth.HasValue);

        When(x => x.Cadence is Cadence.Weekly or Cadence.BiWeekly, () =>
        {
            RuleFor(x => x.DayOfWeek).NotNull();
        });

        When(x => x.Cadence == Cadence.Monthly, () =>
        {
            RuleFor(x => x)
                .Must(HasDayOfMonthOrUseLastDay)
                .WithMessage("Monthly templates require either DayOfMonth (1-28) or UseLastDayOfMonth = true (exactly one).");
        });

        When(x => x.Cadence == Cadence.Quarterly, () =>
        {
            RuleFor(x => x.MonthOfQuarter).NotNull().InclusiveBetween(1, 3);
            RuleFor(x => x)
                .Must(HasDayOfMonthOrUseLastDay)
                .WithMessage("Quarterly templates require either DayOfMonth (1-28) or UseLastDayOfMonth = true (exactly one).");
        });

        When(x => x.Cadence == Cadence.Annually, () =>
        {
            RuleFor(x => x.MonthOfYear).NotNull().InclusiveBetween(1, 12);
            RuleFor(x => x)
                .Must(HasDayOfMonthOrUseLastDay)
                .WithMessage("Annually templates require either DayOfMonth (1-28) or UseLastDayOfMonth = true (exactly one).");
        });

        When(x => x.Cadence == Cadence.CustomDays, () =>
        {
            RuleFor(x => x.IntervalDays).NotNull().GreaterThan(0);
        });
    }

    private static bool HasDayOfMonthOrUseLastDay(UpdateRecurringTemplateRequest x)
    {
        var hasDay = x.DayOfMonth is >= 1 and <= 28;
        return hasDay ^ x.UseLastDayOfMonth;
    }
}
