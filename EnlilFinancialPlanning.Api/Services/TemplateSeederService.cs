using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Services;

public sealed class TemplateSeederService(AppDbContext db, TimeProvider clock) : ITemplateSeederService
{
    private const int HorizonMonths = 12;

    public async Task SeedHorizonAsync(Guid templateUID, CancellationToken ct)
    {
        var template = await db.RecurringTemplates.FirstOrDefaultAsync(rt => rt.UID == templateUID, ct);
        if (template is null) return;

        var horizonEnd = ComputeHorizonEnd(template);
        var existingDates = await db.LineItems
            .Where(li => li.SourceTemplateUID == templateUID)
            .Select(li => li.Date)
            .ToListAsync(ct);
        var existingSet = existingDates.ToHashSet();

        foreach (var date in EnumerateOccurrences(template, template.StartDate, horizonEnd))
        {
            if (existingSet.Contains(date)) continue;

            db.LineItems.Add(new LineItem
            {
                UID = Guid.NewGuid(),
                Direction = template.Direction,
                Amount = template.Amount,
                Date = date,
                Description = template.Description,
                CategoryUID = template.CategoryUID,
                SourceTemplateUID = template.UID,
                WasManuallyEdited = false,
            });
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task ReseedHorizonAsync(Guid templateUID, CancellationToken ct)
    {
        var template = await db.RecurringTemplates.FirstOrDefaultAsync(rt => rt.UID == templateUID, ct);
        if (template is null) return;

        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);

        var staleRows = db.LineItems.Where(li =>
            li.SourceTemplateUID == templateUID &&
            li.Date >= today &&
            !li.WasManuallyEdited);

        db.LineItems.RemoveRange(staleRows);
        await db.SaveChangesAsync(ct);

        await SeedHorizonAsync(templateUID, ct);
    }

    public async Task ExtendHorizonForAllTemplatesAsync(CancellationToken ct)
    {
        var uids = await db.RecurringTemplates.Select(rt => rt.UID).ToListAsync(ct);
        foreach (var uid in uids)
        {
            await SeedHorizonAsync(uid, ct);
        }
    }

    private DateOnly ComputeHorizonEnd(RecurringTemplate template)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var defaultEnd = today.AddMonths(HorizonMonths);
        if (template.EndDate.HasValue && template.EndDate.Value < defaultEnd)
            return template.EndDate.Value;
        return defaultEnd;
    }

    private static IEnumerable<DateOnly> EnumerateOccurrences(RecurringTemplate t, DateOnly from, DateOnly until)
    {
        var current = ComputeFirstOccurrence(t);
        while (current <= until)
        {
            if (current >= from)
                yield return current;
            var next = ComputeNextOccurrence(t, current);
            if (next <= current) yield break;
            current = next;
        }
    }

    private static DateOnly ComputeFirstOccurrence(RecurringTemplate t) => t.Cadence switch
    {
        Cadence.Daily => t.StartDate,
        Cadence.Weekly => AlignForwardToDayOfWeek(t.StartDate, t.DayOfWeek!.Value),
        Cadence.BiWeekly => AlignForwardToDayOfWeek(t.StartDate, t.DayOfWeek!.Value),
        Cadence.Monthly => AlignForwardToDayOfMonth(t.StartDate, t.DayOfMonth, t.UseLastDayOfMonth),
        Cadence.Quarterly => AlignForwardToQuarterly(t.StartDate, t.MonthOfQuarter!.Value, t.DayOfMonth, t.UseLastDayOfMonth),
        Cadence.Annually => AlignForwardToAnnually(t.StartDate, t.MonthOfYear!.Value, t.DayOfMonth, t.UseLastDayOfMonth),
        Cadence.CustomDays => t.StartDate,
        _ => t.StartDate,
    };

    private static DateOnly ComputeNextOccurrence(RecurringTemplate t, DateOnly current) => t.Cadence switch
    {
        Cadence.Daily => current.AddDays(1),
        Cadence.Weekly => current.AddDays(7),
        Cadence.BiWeekly => current.AddDays(14),
        Cadence.Monthly => AddMonthsResolveDay(current, 1, t.DayOfMonth, t.UseLastDayOfMonth),
        Cadence.Quarterly => AddMonthsResolveDay(current, 3, t.DayOfMonth, t.UseLastDayOfMonth),
        Cadence.Annually => AddMonthsResolveDay(current, 12, t.DayOfMonth, t.UseLastDayOfMonth),
        Cadence.CustomDays => current.AddDays(t.IntervalDays!.Value),
        _ => current.AddDays(1),
    };

    private static DateOnly AlignForwardToDayOfWeek(DateOnly start, DayOfWeek target)
    {
        var diff = ((int)target - (int)start.DayOfWeek + 7) % 7;
        return start.AddDays(diff);
    }

    private static DateOnly AlignForwardToDayOfMonth(DateOnly start, int? day, bool useLast)
    {
        var firstCandidate = ResolveDay(start.Year, start.Month, day, useLast);
        if (firstCandidate >= start) return firstCandidate;
        var nextMonth = start.AddMonths(1);
        return ResolveDay(nextMonth.Year, nextMonth.Month, day, useLast);
    }

    private static DateOnly AlignForwardToQuarterly(DateOnly start, int monthOfQuarter, int? day, bool useLast)
    {
        for (var probe = start; ; probe = probe.AddMonths(1))
        {
            var monthIndexInQuarter = ((probe.Month - 1) % 3) + 1;
            if (monthIndexInQuarter != monthOfQuarter) continue;
            var candidate = ResolveDay(probe.Year, probe.Month, day, useLast);
            if (candidate >= start) return candidate;
        }
    }

    private static DateOnly AlignForwardToAnnually(DateOnly start, int monthOfYear, int? day, bool useLast)
    {
        var thisYear = ResolveDay(start.Year, monthOfYear, day, useLast);
        return thisYear >= start ? thisYear : ResolveDay(start.Year + 1, monthOfYear, day, useLast);
    }

    private static DateOnly AddMonthsResolveDay(DateOnly current, int monthsToAdd, int? day, bool useLast)
    {
        var stepped = current.AddMonths(monthsToAdd);
        return ResolveDay(stepped.Year, stepped.Month, day, useLast);
    }

    private static DateOnly ResolveDay(int year, int month, int? day, bool useLast)
    {
        if (useLast)
        {
            var last = DateTime.DaysInMonth(year, month);
            return new DateOnly(year, month, last);
        }
        return new DateOnly(year, month, day ?? 1);
    }
}
