using EnlilFinancialPlanning.Api.Data.Entities;
using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<LineItem> LineItems => Set<LineItem>();
    public DbSet<RecurringTemplate> RecurringTemplates => Set<RecurringTemplate>();

    public DbSet<LongTermContainer> LongTermContainers => Set<LongTermContainer>();
    public DbSet<Holding> Holdings => Set<Holding>();
    public DbSet<HoldingSnapshot> HoldingSnapshots => Set<HoldingSnapshot>();
    public DbSet<LongTermItem> LongTermItems => Set<LongTermItem>();
    public DbSet<LongTermItemSnapshot> LongTermItemSnapshots => Set<LongTermItemSnapshot>();

    public DbSet<RetirementContainer> RetirementContainers => Set<RetirementContainer>();
    public DbSet<RetirementHolding> RetirementHoldings => Set<RetirementHolding>();
    public DbSet<RetirementHoldingSnapshot> RetirementHoldingSnapshots => Set<RetirementHoldingSnapshot>();

    public DbSet<SimpleAsset> SimpleAssets => Set<SimpleAsset>();
    public DbSet<SimpleAssetSnapshot> SimpleAssetSnapshots => Set<SimpleAssetSnapshot>();

    public DbSet<Savings> Savings => Set<Savings>();
    public DbSet<SavingsValueSnapshot> SavingsValueSnapshots => Set<SavingsValueSnapshot>();
    public DbSet<SavingsRateSnapshot> SavingsRateSnapshots => Set<SavingsRateSnapshot>();

    public DbSet<CreditCardDebt> CreditCardDebts => Set<CreditCardDebt>();
    public DbSet<CreditCardDebtSnapshot> CreditCardDebtSnapshots => Set<CreditCardDebtSnapshot>();
    public DbSet<CreditCardBalanceAnchor> CreditCardBalanceAnchors => Set<CreditCardBalanceAnchor>();

    public DbSet<MortgageDebt> MortgageDebts => Set<MortgageDebt>();
    public DbSet<MortgageDebtSnapshot> MortgageDebtSnapshots => Set<MortgageDebtSnapshot>();
    public DbSet<AmortizationEntry> AmortizationEntries => Set<AmortizationEntry>();

    public DbSet<LineItemAllocation> LineItemAllocations => Set<LineItemAllocation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
