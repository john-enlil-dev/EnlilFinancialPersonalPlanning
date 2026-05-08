using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class SavingsRateSnapshotConfiguration : IEntityTypeConfiguration<SavingsRateSnapshot>
{
    public void Configure(EntityTypeBuilder<SavingsRateSnapshot> builder)
    {
        builder.ToTable("SavingsRateSnapshots");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Rate).HasPrecision(9, 6);

        builder.HasOne(x => x.Savings)
            .WithMany(s => s.RateSnapshots)
            .HasForeignKey(x => x.SavingsUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.SavingsUID, x.Date });
    }
}
