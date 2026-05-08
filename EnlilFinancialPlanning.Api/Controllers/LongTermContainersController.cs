using EnlilFinancialPlanning.Api.Dtos.LongTermContainers;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class LongTermContainersController(LongTermContainerManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LongTermContainerResponse>>> List(CancellationToken ct)
        => Ok(await manager.ListAsync(ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<LongTermContainerResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<LongTermContainerResponse>> Create(
        [FromBody] CreateLongTermContainerRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<LongTermContainerResponse>> Update(
        Guid uid,
        [FromBody] UpdateLongTermContainerRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
