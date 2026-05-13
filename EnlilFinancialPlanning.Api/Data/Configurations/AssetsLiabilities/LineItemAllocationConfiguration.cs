using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class LineItemAllocationConfiguration : IEntityTypeConfiguration<LineItemAllocation>
{
    public void Configure(EntityTypeBuilder<LineItemAllocation> builder)
    {
        builder.ToTable("LineItemAllocations");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.LinkedEntityType).HasConversion<int>();
        builder.Property(x => x.ComponentType).HasMaxLength(100);
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Tag).HasMaxLength(100);

        builder.HasOne(x => x.LineItem)
            .WithMany()
            .HasForeignKey(x => x.LineItemUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.LineItemUID);
        builder.HasIndex(x => new { x.LinkedEntityType, x.LinkedEntityUID });
    }
}
