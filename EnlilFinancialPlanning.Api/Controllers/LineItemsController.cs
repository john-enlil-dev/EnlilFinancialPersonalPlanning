using EnlilFinancialPlanning.Api.Dtos.LineItems;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class LineItemsController(LineItemManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LineItemResponse>>> List(
        [FromQuery] LineItemQuery query,
        CancellationToken ct)
        => Ok(await manager.ListAsync(query, ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<LineItemResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<LineItemResponse>> Create(
        [FromBody] CreateLineItemRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        if (result is null) return BadRequest("CategoryUID does not exist.");
        return CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<LineItemResponse>> Update(
        Guid uid,
        [FromBody] UpdateLineItemRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{uid:guid}/linkages")]
    public async Task<ActionResult<IReadOnlyList<LineItemLinkage>>> GetLinkages(
        Guid uid,
        CancellationToken ct)
    {
        var result = await manager.GetLinkagesAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{uid:guid}")]
    public async Task<IActionResult> Delete(Guid uid, CancellationToken ct)
    {
        var deleted = await manager.DeleteAsync(uid, ct);
        return deleted ? NoContent() : NotFound();
    }
}
