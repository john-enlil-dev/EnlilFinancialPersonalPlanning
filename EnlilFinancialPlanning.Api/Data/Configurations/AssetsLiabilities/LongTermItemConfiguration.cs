using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class LongTermItemConfiguration : IEntityTypeConfiguration<LongTermItem>
{
    public void Configure(EntityTypeBuilder<LongTermItem> builder)
    {
        builder.ToTable("LongTermItems");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Subtype).HasMaxLength(100);
        builder.Property(x => x.CurrentValue).HasPrecision(18, 2);
    }
}
