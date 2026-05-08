using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class SavingsValueSnapshotConfiguration : IEntityTypeConfiguration<SavingsValueSnapshot>
{
    public void Configure(EntityTypeBuilder<SavingsValueSnapshot> builder)
    {
        builder.ToTable("SavingsValueSnapshots");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Value).HasPrecision(18, 2);

        builder.HasOne(x => x.Savings)
            .WithMany(s => s.ValueSnapshots)
            .HasForeignKey(x => x.SavingsUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.SavingsUID, x.Date });
    }
}
