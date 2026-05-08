using EnlilFinancialPlanning.Api.Dtos.LineItemAllocations;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class LineItemAllocationsController(LineItemAllocationManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LineItemAllocationResponse>>> List(
        [FromQuery] Guid lineItemUid,
        CancellationToken ct)
        => Ok(await manager.ListByLineItemAsync(lineItemUid, ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<LineItemAllocationResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<LineItemAllocationResponse>> Create(
        [FromBody] CreateLineItemAllocationRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return result is null
            ? NotFound($"LineItem {request.LineItemUID} not found.")
            : CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<LineItemAllocationResponse>> Update(
        Guid uid,
        [FromBody] UpdateLineItemAllocationRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
