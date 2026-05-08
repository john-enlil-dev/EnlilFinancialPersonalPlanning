using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class HoldingSnapshotConfiguration : IEntityTypeConfiguration<HoldingSnapshot>
{
    public void Configure(EntityTypeBuilder<HoldingSnapshot> builder)
    {
        builder.ToTable("HoldingSnapshots");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Units).HasPrecision(18, 6);
        builder.Property(x => x.PricePerUnit).HasPrecision(18, 4);

        builder.HasOne(x => x.Holding)
            .WithMany(h => h.Snapshots)
            .HasForeignKey(x => x.HoldingUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.HoldingUID, x.Date });
    }
}
