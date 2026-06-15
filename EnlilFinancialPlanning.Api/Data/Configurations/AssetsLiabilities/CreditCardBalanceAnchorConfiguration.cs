using EnlilFinancialPlanning.Api.Data.Entities.AssetsLiabilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations.AssetsLiabilities;

public sealed class CreditCardBalanceAnchorConfiguration : IEntityTypeConfiguration<CreditCardBalanceAnchor>
{
    public void Configure(EntityTypeBuilder<CreditCardBalanceAnchor> builder)
    {
        builder.ToTable("CreditCardBalanceAnchors");

        builder.HasKey(x => x.UID);
        builder.Property(x => x.UID).HasDefaultValueSql("NEWID()");

        builder.Property(x => x.AssertedBalance).HasPrecision(18, 2);
        builder.Property(x => x.AdjustmentAmount).HasPrecision(18, 2);
        builder.Property(x => x.Note).HasMaxLength(500);

        builder.HasOne(x => x.CreditCardDebt)
            .WithMany(cc => cc.Anchors)
            .HasForeignKey(x => x.CreditCardDebtUID)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.CreditCardDebtUID, x.Date });
    }
}
