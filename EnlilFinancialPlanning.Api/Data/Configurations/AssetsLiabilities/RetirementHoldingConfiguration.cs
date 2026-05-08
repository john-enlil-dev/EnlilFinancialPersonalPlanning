using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class RetirementHoldingConfiguration : IEntityTypeConfiguration<RetirementHolding>
{
    public void Configure(EntityTypeBuilder<RetirementHolding> builder)
    {
        builder.ToTable("RetirementHoldings");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Symbol).HasMaxLength(20);
        builder.Property(x => x.Units).HasPrecision(18, 6);
        builder.Property(x => x.PricePerUnit).HasPrecision(18, 4);

        builder.HasOne(x => x.RetirementContainer)
            .WithMany(c => c.Holdings)
            .HasForeignKey(x => x.RetirementContainerUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.RetirementContainerUID);
    }
}
