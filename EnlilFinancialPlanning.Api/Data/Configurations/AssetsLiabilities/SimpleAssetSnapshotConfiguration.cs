using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class SimpleAssetSnapshotConfiguration : IEntityTypeConfiguration<SimpleAssetSnapshot>
{
    public void Configure(EntityTypeBuilder<SimpleAssetSnapshot> builder)
    {
        builder.ToTable("SimpleAssetSnapshots");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Value).HasPrecision(18, 2);

        builder.HasOne(x => x.SimpleAsset)
            .WithMany(sa => sa.Snapshots)
            .HasForeignKey(x => x.SimpleAssetUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.SimpleAssetUID, x.Date });
    }
}
