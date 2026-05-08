using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class CreditCardDebtSnapshotConfiguration : IEntityTypeConfiguration<CreditCardDebtSnapshot>
{
    public void Configure(EntityTypeBuilder<CreditCardDebtSnapshot> builder)
    {
        builder.ToTable("CreditCardDebtSnapshots");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Balance).HasPrecision(18, 2);

        builder.HasOne(x => x.CreditCardDebt)
            .WithMany(cc => cc.Snapshots)
            .HasForeignKey(x => x.CreditCardDebtUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.CreditCardDebtUID, x.Date });
    }
}
