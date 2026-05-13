using EnlilFinancialPlanning.Api.Dtos.Dashboard;
using EnlilFinancialPlanning.Api.Services.Dashboard;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DashboardController(
    DashboardTilesService tiles,
    DashboardTimelineService timeline,
    DashboardCategoryVarianceService variance,
    TimeProvider clock) : ControllerBase
{
    [HttpGet("tiles")]
    public async Task<ActionResult<DashboardTilesResponse>> GetTiles(CancellationToken ct)
        => Ok(await tiles.GetAsync(Today(), ct));

    [HttpGet("timeline")]
    public async Task<ActionResult<DashboardTimelineResponse>> GetTimeline(CancellationToken ct)
        => Ok(await timeline.GetAsync(Today(), ct));

    [HttpGet("category-variance")]
    public async Task<ActionResult<DashboardCategoryVarianceResponse>> GetCategoryVariance(CancellationToken ct)
        => Ok(await variance.GetAsync(Today(), ct));

    private DateOnly Today() => DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
}
