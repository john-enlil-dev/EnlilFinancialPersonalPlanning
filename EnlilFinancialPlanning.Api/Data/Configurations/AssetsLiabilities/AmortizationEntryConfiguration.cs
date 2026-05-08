using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class AmortizationEntryConfiguration : IEntityTypeConfiguration<AmortizationEntry>
{
    public void Configure(EntityTypeBuilder<AmortizationEntry> builder)
    {
        builder.ToTable("AmortizationEntries");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Principal).HasPrecision(18, 2);
        builder.Property(x => x.Interest).HasPrecision(18, 2);
        builder.Property(x => x.RemainingBalance).HasPrecision(18, 2);

        builder.HasOne(x => x.MortgageDebt)
            .WithMany(m => m.AmortizationSchedule)
            .HasForeignKey(x => x.MortgageDebtUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.MortgageDebtUID, x.PaymentNumber }).IsUnique();
    }
}
