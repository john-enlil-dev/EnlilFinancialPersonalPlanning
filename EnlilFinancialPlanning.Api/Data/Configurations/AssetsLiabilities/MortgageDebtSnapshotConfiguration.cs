using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class MortgageDebtSnapshotConfiguration : IEntityTypeConfiguration<MortgageDebtSnapshot>
{
    public void Configure(EntityTypeBuilder<MortgageDebtSnapshot> builder)
    {
        builder.ToTable("MortgageDebtSnapshots");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Balance).HasPrecision(18, 2);

        builder.HasOne(x => x.MortgageDebt)
            .WithMany(m => m.Snapshots)
            .HasForeignKey(x => x.MortgageDebtUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.MortgageDebtUID, x.Date });
    }
}
