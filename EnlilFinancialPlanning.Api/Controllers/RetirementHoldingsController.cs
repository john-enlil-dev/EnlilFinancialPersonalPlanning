using EnlilFinancialPlanning.Api.Dtos.RetirementHoldings;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RetirementHoldingsController(RetirementHoldingManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RetirementHoldingResponse>>> List(
        [FromQuery] Guid containerUid,
        CancellationToken ct)
        => Ok(await manager.ListByContainerAsync(containerUid, ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<RetirementHoldingResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<RetirementHoldingResponse>> Create(
        [FromBody] CreateRetirementHoldingRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return result is null
            ? NotFound($"RetirementContainer {request.RetirementContainerUID} not found.")
            : CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<RetirementHoldingResponse>> Update(
        Guid uid,
        [FromBody] UpdateRetirementHoldingRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
