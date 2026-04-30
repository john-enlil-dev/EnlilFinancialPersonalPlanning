using EnlilFinancialPlanning.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnlilFinancialPlanning.Api.Data.Configurations;

public sealed class RecurringTemplateConfiguration : IEntityTypeConfiguration<RecurringTemplate>
{
    public void Configure(EntityTypeBuilder<RecurringTemplate> builder)
    {
        builder.ToTable("RecurringTemplates");

        builder.HasKey(rt => rt.UID);
        builder.Property(rt => rt.UID).HasDefaultValueSql("NEWID()");

        builder.Property(rt => rt.Name).IsRequired().HasMaxLength(100);
        builder.Property(rt => rt.Direction).HasConversion<int>();
        builder.Property(rt => rt.Amount).HasPrecision(18, 2);
        builder.Property(rt => rt.Description).HasMaxLength(500);
        builder.Property(rt => rt.Cadence).HasConversion<int>();
        builder.Property(rt => rt.DayOfWeek).HasConversion<int?>();

        builder.HasOne(rt => rt.Category)
            .WithMany()
            .HasForeignKey(rt => rt.CategoryUID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(rt => rt.StartDate);
    }
}
