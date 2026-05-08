using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using EnlilFinancialPlanning.Api.Data.Entities.Enums;
using EnlilFinancialPlanning.Api.Dtos.MortgageDebts;
using EnlilFinancialPlanning.Api.Dtos.MortgagePayments;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Managers;

// Amortization regeneration is intentionally disabled — re-enable by re-injecting
// IMortgageAmortizationService and calling RegenerateAsync after each save once the
// service's schedule logic is debugged.
public sealed class MortgageDebtManager(AppDbContext db)
{
    public async Task<IReadOnlyList<MortgageDebtResponse>> ListAsync(CancellationToken ct)
        => await db.MortgageDebts.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => ToResponse(x))
            .ToListAsync(ct);

    public async Task<MortgageDebtResponse?> GetAsync(Guid uid, CancellationToken ct)
    {
        var x = await db.MortgageDebts.AsNoTracking().FirstOrDefaultAsync(m => m.UID == uid, ct);
        return x is null ? null : ToResponse(x);
    }

    public async Task<MortgageDebtResponse> CreateAsync(CreateMortgageDebtRequest request, CancellationToken ct)
    {
        var entity = new MortgageDebt
        {
            UID = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Institution = request.Institution?.Trim(),
            OriginalPrincipal = request.OriginalPrincipal,
            InterestRate = request.InterestRate,
            TermMonths = request.TermMonths,
            StartDate = request.StartDate,
            LoanType = request.LoanType,
            MonthlyPaymentPI = request.MonthlyPaymentPI,
            EscrowMonthly = request.EscrowMonthly,
            PMIMonthly = request.PMIMonthly,
            LinkedRecurringTemplateUID = request.LinkedRecurringTemplateUID,
            CurrentBalance = request.CurrentBalance,
            CurrentAsOfDate = request.CurrentAsOfDate,
        };
        db.MortgageDebts.Add(entity);
        db.MortgageDebtSnapshots.Add(new MortgageDebtSnapshot
        {
            UID = Guid.NewGuid(),
            MortgageDebtUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<MortgageDebtResponse?> UpdateAsync(Guid uid, UpdateMortgageDebtRequest request, CancellationToken ct)
    {
        var entity = await db.MortgageDebts.FirstOrDefaultAsync(m => m.UID == uid, ct);
        if (entity is null) return null;

        entity.Name = request.Name.Trim();
        entity.Institution = request.Institution?.Trim();
        entity.OriginalPrincipal = request.OriginalPrincipal;
        entity.InterestRate = request.InterestRate;
        entity.TermMonths = request.TermMonths;
        entity.StartDate = request.StartDate;
        entity.LoanType = request.LoanType;
        entity.MonthlyPaymentPI = request.MonthlyPaymentPI;
        entity.EscrowMonthly = request.EscrowMonthly;
        entity.PMIMonthly = request.PMIMonthly;
        entity.LinkedRecurringTemplateUID = request.LinkedRecurringTemplateUID;
        entity.CurrentBalance = request.CurrentBalance;
        entity.CurrentAsOfDate = request.CurrentAsOfDate;

        db.MortgageDebtSnapshots.Add(new MortgageDebtSnapshot
        {
            UID = Guid.NewGuid(),
            MortgageDebtUID = entity.UID,
            Date = entity.CurrentAsOfDate,
            Balance = entity.CurrentBalance,
        });
        await db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    private static MortgageDebtResponse ToResponse(MortgageDebt m)
        => new(m.UID, m.Name, m.Institution, m.OriginalPrincipal, m.InterestRate, m.TermMonths,
            m.StartDate, m.LoanType, m.MonthlyPaymentPI, m.EscrowMonthly, m.PMIMonthly,
            m.LinkedRecurringTemplateUID, m.CurrentBalance, m.CurrentAsOfDate);

    // ---- Payment history (history-only mode — AffectsLinkedBalance=false; the
    // mortgage's CurrentBalance is maintained by direct edits to the mortgage row,
    // not by these allocations.) -------------------------------------------------

    public async Task<IReadOnlyList<MortgagePaymentResponse>?> ListPaymentsAsync(
        Guid mortgageUid, CancellationToken ct)
    {
        var mortgageExists = await db.MortgageDebts.AnyAsync(m => m.UID == mortgageUid, ct);
        if (!mortgageExists) return null;

        var allocations = await db.LineItemAllocations.AsNoTracking()
            .Where(a => a.LinkedEntityType == LinkedEntityType.MortgageDebt
                     && a.LinkedEntityUID == mortgageUid)
            .ToListAsync(ct);

        if (allocations.Count == 0) return Array.Empty<MortgagePaymentResponse>();

        var lineItemUids = allocations.Select(a => a.LineItemUID).Distinct().ToList();

        var lineItems = await db.LineItems.AsNoTracking()
            .Include(li => li.Category)
            .Where(li => lineItemUids.Contains(li.UID))
            .ToListAsync(ct);

        var allocationsByLineItem = allocations
            .GroupBy(a => a.LineItemUID)
            .ToDictionary(g => g.Key, g => g.ToList());

        return lineItems
            .OrderByDescending(li => li.Date)
            .ThenByDescending(li => li.UID)
            .Select(li => ToPaymentResponse(li, allocationsByLineItem[li.UID]))
            .ToList();
    }

    public async Task<MortgagePaymentResponse?> CreatePaymentAsync(
        Guid mortgageUid, CreateMortgagePaymentRequest request, CancellationToken ct)
    {
        var mortgage = await db.MortgageDebts.FirstOrDefaultAsync(m => m.UID == mortgageUid, ct);
        if (mortgage is null) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var totalAmount = request.Allocations.Sum(a => a.Amount);

        var lineItem = new LineItem
        {
            UID = Guid.NewGuid(),
            Direction = Direction.Expense,
            Amount = totalAmount,
            Date = request.Date,
            Description = request.Description?.Trim(),
            CategoryUID = request.CategoryUID,
        };
        db.LineItems.Add(lineItem);

        var allocations = new List<LineItemAllocation>(request.Allocations.Count);
        foreach (var input in request.Allocations)
        {
            var allocation = new LineItemAllocation
            {
                UID = Guid.NewGuid(),
                LineItemUID = lineItem.UID,
                LinkedEntityUID = mortgageUid,
                LinkedEntityType = LinkedEntityType.MortgageDebt,
                ComponentType = string.IsNullOrWhiteSpace(input.ComponentType)
                    ? null
                    : input.ComponentType.Trim(),
                Amount = input.Amount,
                AffectsLinkedBalance = false,
                BillingMonth = request.BillingMonth,
            };
            db.LineItemAllocations.Add(allocation);
            allocations.Add(allocation);
        }

        // Optional: record the mortgage's principal balance at this payment's date.
        // Always appends a snapshot row; only refreshes the cached CurrentBalance/
        // CurrentAsOfDate when the payment date is at or after the cached as-of —
        // back-filling old payments must not overwrite a more-recent cached value.
        if (request.BalanceAfterPayment.HasValue)
        {
            db.MortgageDebtSnapshots.Add(new MortgageDebtSnapshot
            {
                UID = Guid.NewGuid(),
                MortgageDebtUID = mortgageUid,
                Date = request.Date,
                Balance = request.BalanceAfterPayment.Value,
            });

            if (request.Date >= mortgage.CurrentAsOfDate)
            {
                mortgage.CurrentBalance = request.BalanceAfterPayment.Value;
                mortgage.CurrentAsOfDate = request.Date;
            }
        }

        await db.SaveChangesAsync(ct);

        lineItem.Category = category;
        return ToPaymentResponse(lineItem, allocations);
    }

    public async Task<MortgagePaymentResponse?> UpdatePaymentAsync(
        Guid mortgageUid,
        Guid lineItemUid,
        CreateMortgagePaymentRequest request,
        CancellationToken ct)
    {
        var mortgage = await db.MortgageDebts.FirstOrDefaultAsync(m => m.UID == mortgageUid, ct);
        if (mortgage is null) return null;

        var lineItem = await db.LineItems.FirstOrDefaultAsync(li => li.UID == lineItemUid, ct);
        if (lineItem is null) return null;

        var existingAllocations = await db.LineItemAllocations
            .Where(a => a.LineItemUID == lineItemUid
                     && a.LinkedEntityType == LinkedEntityType.MortgageDebt
                     && a.LinkedEntityUID == mortgageUid)
            .ToListAsync(ct);
        if (existingAllocations.Count == 0) return null;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.UID == request.CategoryUID, ct);
        if (category is null) return null;

        var totalAmount = request.Allocations.Sum(a => a.Amount);
        lineItem.Amount = totalAmount;
        lineItem.Date = request.Date;
        lineItem.Description = request.Description?.Trim();
        lineItem.CategoryUID = request.CategoryUID;

        // Wipe and replace allocations (authorized exception — see design log 2026-05-08 14:00).
        db.LineItemAllocations.RemoveRange(existingAllocations);

        var newAllocations = new List<LineItemAllocation>(request.Allocations.Count);
        foreach (var input in request.Allocations)
        {
            var allocation = new LineItemAllocation
            {
                UID = Guid.NewGuid(),
                LineItemUID = lineItemUid,
                LinkedEntityUID = mortgageUid,
                LinkedEntityType = LinkedEntityType.MortgageDebt,
                ComponentType = string.IsNullOrWhiteSpace(input.ComponentType)
                    ? null
                    : input.ComponentType.Trim(),
                Amount = input.Amount,
                AffectsLinkedBalance = false,
                BillingMonth = request.BillingMonth,
            };
            db.LineItemAllocations.Add(allocation);
            newAllocations.Add(allocation);
        }

        // Same balance-snapshot semantics as CreatePaymentAsync — append-only.
        if (request.BalanceAfterPayment.HasValue)
        {
            db.MortgageDebtSnapshots.Add(new MortgageDebtSnapshot
            {
                UID = Guid.NewGuid(),
                MortgageDebtUID = mortgageUid,
                Date = request.Date,
                Balance = request.BalanceAfterPayment.Value,
            });
            if (request.Date >= mortgage.CurrentAsOfDate)
            {
                mortgage.CurrentBalance = request.BalanceAfterPayment.Value;
                mortgage.CurrentAsOfDate = request.Date;
            }
        }

        await db.SaveChangesAsync(ct);

        lineItem.Category = category;
        return ToPaymentResponse(lineItem, newAllocations);
    }

    public async Task<IReadOnlyList<MortgageBalanceSnapshotResponse>?> ListSnapshotsAsync(
        Guid mortgageUid, CancellationToken ct)
    {
        var mortgageExists = await db.MortgageDebts.AnyAsync(m => m.UID == mortgageUid, ct);
        if (!mortgageExists) return null;

        return await db.MortgageDebtSnapshots.AsNoTracking()
            .Where(s => s.MortgageDebtUID == mortgageUid)
            .OrderBy(s => s.Date)
            .ThenBy(s => s.UID)
            .Select(s => new MortgageBalanceSnapshotResponse(s.UID, s.Date, s.Balance))
            .ToListAsync(ct);
    }

    private static MortgagePaymentResponse ToPaymentResponse(
        LineItem li, IReadOnlyCollection<LineItemAllocation> allocations)
        => new(
            li.UID,
            li.Date,
            allocations.Select(a => a.BillingMonth).FirstOrDefault(b => b.HasValue),
            li.Amount,
            li.Description,
            li.CategoryUID,
            li.Category?.Name ?? string.Empty,
            allocations
                .Select(a => new MortgagePaymentAllocationResponse(
                    a.UID, a.ComponentType, a.Amount, a.AffectsLinkedBalance))
                .ToList());
}
