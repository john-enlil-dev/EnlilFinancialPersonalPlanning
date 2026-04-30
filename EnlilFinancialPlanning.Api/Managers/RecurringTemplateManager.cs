using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Dtos.RecurringTemplates;
using EnlilFinancialPlanning.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

public sealed class RecurringTemplateManager(AppDbContext db, ITemplateSeederService seeder)
{
    public async Task<IReadOnlyList<RecurringTemplateResponse>> ListAsync(CancellationToken ct)
    {
        return await db.RecurringTemplates
            .AsNoTracking()
            .Include(rt => rt.Category)
            .OrderBy(rt => rt.Name)
            .Select(rt => ToResponse(rt))
            .ToListAsync(ct);
    }

    public async Task<RecurringTemplateResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var rt = await db.RecurringTemplates
            .AsNoTracking()
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.UID == uid, ct);

        return rt is null ? null : ToResponse(rt);
    }

    public async Task<RecurringTemplateResponse?> CreateAsync(CreateRecurringTemplateRequest request, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var entity = new RecurringTemplate
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Direction = request.Direction,
            CategoryUID = request.CategoryUID,
            Amount = request.Amount,
            Description = request.Description?.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Cadence = request.Cadence,
            DayOfMonth = request.DayOfMonth,
            UseLastDayOfMonth = request.UseLastDayOfMonth,
            DayOfWeek = request.DayOfWeek,
            MonthOfQuarter = request.MonthOfQuarter,
            MonthOfYear = request.MonthOfYear,
            IntervalDays = request.IntervalDays,
        };

        db.RecurringTemplates.Add(entity);
        await db.SaveChangesAsync(ct);

        await seeder.SeedHorizonAsync(entity.UID, ct);

        entity.Category = category;
        return ToResponse(entity);
    }

    public async Task<RecurringTemplateResponse?> UpdateAsync(Guid uid, UpdateRecurringTemplateRequest request, CancellationToken ct)
    {
        var entity = await db.RecurringTemplates
            .Include(rt => rt.Category)
            .FirstOrDefaultAsync(rt => rt.UID == uid, ct);
        if (entity is null) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        entity.Name = request.Name.Trim();
        entity.Direction = request.Direction;
        entity.CategoryUID = request.CategoryUID;
        entity.Category = category;
        entity.Amount = request.Amount;
        entity.Description = request.Description?.Trim();
        entity.StartDate = request.StartDate;
        entity.EndDate = request.EndDate;
        entity.Cadence = request.Cadence;
        entity.DayOfMonth = request.DayOfMonth;
        entity.UseLastDayOfMonth = request.UseLastDayOfMonth;
        entity.DayOfWeek = request.DayOfWeek;
        entity.MonthOfQuarter = request.MonthOfQuarter;
        entity.MonthOfYear = request.MonthOfYear;
        entity.IntervalDays = request.IntervalDays;

        await db.SaveChangesAsync(ct);

        await seeder.ReseedHorizonAsync(entity.UID, ct);

        return ToResponse(entity);
    }

    private static RecurringTemplateResponse ToResponse(RecurringTemplate rt) => new(
        rt.UID,
        rt.Name,
        rt.Direction,
        rt.CategoryUID,
        rt.Category.Name,
        rt.Amount,
        rt.Description,
        rt.StartDate,
        rt.EndDate,
        rt.Cadence,
        rt.DayOfMonth,
        rt.UseLastDayOfMonth,
        rt.DayOfWeek,
        rt.MonthOfQuarter,
        rt.MonthOfYear,
        rt.IntervalDays);
}
