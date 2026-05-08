using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class HoldingConfiguration : IEntityTypeConfiguration<Holding>
{
    public void Configure(EntityTypeBuilder<Holding> builder)
    {
        builder.ToTable("Holdings");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Symbol).HasMaxLength(20);
        builder.Property(x => x.Units).HasPrecision(18, 6);
        builder.Property(x => x.PricePerUnit).HasPrecision(18, 4);

        builder.HasOne(x => x.LongTermContainer)
            .WithMany(c => c.Holdings)
            .HasForeignKey(x => x.LongTermContainerUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.LongTermContainerUID);
    }
}
