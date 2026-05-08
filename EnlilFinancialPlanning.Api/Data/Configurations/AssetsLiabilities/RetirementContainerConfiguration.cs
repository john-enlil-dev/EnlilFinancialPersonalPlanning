using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class RetirementContainerConfiguration : IEntityTypeConfiguration<RetirementContainer>
{
    public void Configure(EntityTypeBuilder<RetirementContainer> builder)
    {
        builder.ToTable("RetirementContainers");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Institution).HasMaxLength(200);
        builder.Property(x => x.AccountType).HasConversion<int>();
        builder.Property(x => x.CurrentValue).HasPrecision(18, 2);
    }
}
