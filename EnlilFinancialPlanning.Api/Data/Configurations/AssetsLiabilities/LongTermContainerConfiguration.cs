using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class LongTermContainerConfiguration : IEntityTypeConfiguration<LongTermContainer>
{
    public void Configure(EntityTypeBuilder<LongTermContainer> builder)
    {
        builder.ToTable("LongTermContainers");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Institution).HasMaxLength(200);
        builder.Property(x => x.CurrentValue).HasPrecision(18, 2);
    }
}
