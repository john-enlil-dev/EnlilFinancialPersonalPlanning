using EnlilFinancialPlanning.Api.Dtos.Holdings;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HoldingsController(HoldingManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<HoldingResponse>>> List(
        [FromQuery] Guid containerUid,
        CancellationToken ct)
        => Ok(await manager.ListByContainerAsync(containerUid, ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<HoldingResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<HoldingResponse>> Create(
        [FromBody] CreateHoldingRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return result is null
            ? NotFound($"LongTermContainer {request.LongTermContainerUID} not found.")
            : CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<HoldingResponse>> Update(
        Guid uid,
        [FromBody] UpdateHoldingRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
