using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class SavingsConfiguration : IEntityTypeConfiguration<Savings>
{
    public void Configure(EntityTypeBuilder<Savings> builder)
    {
        builder.ToTable("Savings");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Institution).HasMaxLength(200);
        builder.Property(x => x.Subtype).HasMaxLength(100);
        builder.Property(x => x.CompoundingFrequency).HasConversion<int>();
        builder.Property(x => x.CurrentRate).HasPrecision(9, 6);
        builder.Property(x => x.CurrentValue).HasPrecision(18, 2);
    }
}
