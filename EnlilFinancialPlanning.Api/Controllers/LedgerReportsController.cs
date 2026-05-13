using EnlilFinancialPlanning.Api.Dtos.LedgerReports;
using EnlilFinancialPlanning.Api.Services.LedgerReports;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class LedgerReportsController(LedgerReportService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<LedgerReportResponse>> Get(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken ct)
    {
        if (to < from) return BadRequest("'to' must be on or after 'from'.");
        return Ok(await service.GetAsync(from, to, ct));
    }
}
