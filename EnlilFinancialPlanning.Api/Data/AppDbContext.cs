using EnlilFinancialPlanning.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace EnlilFinancialPlanning.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<LineItem> LineItems => Set<LineItem>();
    public DbSet<RecurringTemplate> RecurringTemplates => Set<RecurringTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
