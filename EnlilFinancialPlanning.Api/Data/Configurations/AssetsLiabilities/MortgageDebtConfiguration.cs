using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class MortgageDebtConfiguration : IEntityTypeConfiguration<MortgageDebt>
{
    public void Configure(EntityTypeBuilder<MortgageDebt> builder)
    {
        builder.ToTable("MortgageDebts");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Institution).HasMaxLength(200);
        builder.Property(x => x.OriginalPrincipal).HasPrecision(18, 2);
        builder.Property(x => x.InterestRate).HasPrecision(9, 6);
        builder.Property(x => x.LoanType).HasConversion<int>();
        builder.Property(x => x.MonthlyPaymentPI).HasPrecision(18, 2);
        builder.Property(x => x.EscrowMonthly).HasPrecision(18, 2);
        builder.Property(x => x.PMIMonthly).HasPrecision(18, 2);
        builder.Property(x => x.CurrentBalance).HasPrecision(18, 2);

        builder.HasOne(x => x.LinkedRecurringTemplate)
            .WithMany()
            .HasForeignKey(x => x.LinkedRecurringTemplateUID)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.LinkedRecurringTemplateUID);
    }
}
