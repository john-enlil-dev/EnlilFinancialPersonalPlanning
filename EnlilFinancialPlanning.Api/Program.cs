using EnlilFinancialPlanning.Api.Data;
using EnlilFinancialPlanning.Api.Managers;
using EnlilFinancialPlanning.Api.Services;
using FluentValidation;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Extensions;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddScoped<CategoryManager>();
builder.Services.AddScoped<LineItemManager>();
builder.Services.AddScoped<RecurringTemplateManager>();
builder.Services.AddScoped<ITemplateSeederService, TemplateSeederService>();

builder.Services.AddScoped<LongTermContainerManager>();
builder.Services.AddScoped<HoldingManager>();
builder.Services.AddScoped<LongTermItemManager>();
builder.Services.AddScoped<RetirementContainerManager>();
builder.Services.AddScoped<RetirementHoldingManager>();
builder.Services.AddScoped<SimpleAssetManager>();
builder.Services.AddScoped<SavingsManager>();
builder.Services.AddScoped<CreditCardDebtManager>();
builder.Services.AddScoped<MortgageDebtManager>();
builder.Services.AddScoped<LineItemAllocationManager>();

builder.Services.AddScoped<IMortgageAmortizationService, MortgageAmortizationService>();
builder.Services.AddScoped<IBalanceAffectService, BalanceAffectService>();

builder.Services.AddScoped<EnlilFinancialPlanning.Api.Services.Dashboard.DashboardTilesService>();
builder.Services.AddScoped<EnlilFinancialPlanning.Api.Services.Dashboard.DashboardTimelineService>();
builder.Services.AddScoped<EnlilFinancialPlanning.Api.Services.Dashboard.DashboardCategoryVarianceService>();

builder.Services.AddScoped<EnlilFinancialPlanning.Api.Services.LedgerReports.LedgerReportService>();

builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true,
    }));
builder.Services.AddHangfireServer();

const string DevCorsPolicy = "DevCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:61350")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors(DevCorsPolicy);
    app.UseHangfireDashboard("/hangfire");
}

app.MapControllers();

RecurringJob.AddOrUpdate<ITemplateSeederService>(
    "extend-template-horizon",
    s => s.ExtendHorizonForAllTemplatesAsync(CancellationToken.None),
    Cron.Daily);

app.Run();
