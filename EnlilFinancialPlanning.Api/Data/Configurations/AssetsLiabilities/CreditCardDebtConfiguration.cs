using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class CreditCardDebtConfiguration : IEntityTypeConfiguration<CreditCardDebt>
{
    public void Configure(EntityTypeBuilder<CreditCardDebt> builder)
    {
        builder.ToTable("CreditCardDebts");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Institution).HasMaxLength(200);
        builder.Property(x => x.APR).HasPrecision(9, 6);
        builder.Property(x => x.CreditLimit).HasPrecision(18, 2);
        builder.Property(x => x.MinimumPayment).HasPrecision(18, 2);
        builder.Property(x => x.CurrentBalance).HasPrecision(18, 2);
    }
}
