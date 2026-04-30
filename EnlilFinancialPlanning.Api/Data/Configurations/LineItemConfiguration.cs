using EnlilFinancialPlanning.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations;

public sealed class LineItemConfiguration : IEntityTypeConfiguration<LineItem>
{
    public void Configure(EntityTypeBuilder<LineItem> builder)
    {
        builder.ToTable("LineItems");

        builder.HasKey(li => li.UID);
        builder.Property(li => li.UID).HasDefaultValueSql("NEWID()");

        builder.Property(li => li.Direction).HasConversion<int>();
        builder.Property(li => li.Amount).HasPrecision(18, 2);
        builder.Property(li => li.Description).HasMaxLength(500);

        builder.HasOne(li => li.Category)
            .WithMany()
            .HasForeignKey(li => li.CategoryUID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(li => li.SourceTemplate)
            .WithMany(rt => rt.SeededLineItems)
            .HasForeignKey(li => li.SourceTemplateUID)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(li => li.Date);
        builder.HasIndex(li => li.CategoryUID);
        builder.HasIndex(li => li.SourceTemplateUID);
    }
}
