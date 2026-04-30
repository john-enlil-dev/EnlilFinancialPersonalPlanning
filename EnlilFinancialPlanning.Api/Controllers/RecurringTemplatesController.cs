using EnlilFinancialPlanning.Api.Dtos.RecurringTemplates;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RecurringTemplatesController(RecurringTemplateManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RecurringTemplateResponse>>> List(CancellationToken ct)
        => Ok(await manager.ListAsync(ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<RecurringTemplateResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<RecurringTemplateResponse>> Create(
        [FromBody] CreateRecurringTemplateRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        if (result is null) return BadRequest("CategoryUID does not exist.");
        return CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<RecurringTemplateResponse>> Update(
        Guid uid,
        [FromBody] UpdateRecurringTemplateRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
