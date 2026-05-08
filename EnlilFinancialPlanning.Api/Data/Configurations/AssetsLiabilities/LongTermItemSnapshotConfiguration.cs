using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class LongTermItemSnapshotConfiguration : IEntityTypeConfiguration<LongTermItemSnapshot>
{
    public void Configure(EntityTypeBuilder<LongTermItemSnapshot> builder)
    {
        builder.ToTable("LongTermItemSnapshots");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Value).HasPrecision(18, 2);

        builder.HasOne(x => x.LongTermItem)
            .WithMany(li => li.Snapshots)
            .HasForeignKey(x => x.LongTermItemUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.LongTermItemUID, x.Date });
    }
}
