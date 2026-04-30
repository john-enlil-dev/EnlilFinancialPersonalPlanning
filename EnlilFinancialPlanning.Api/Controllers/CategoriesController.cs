using EnlilFinancialPlanning.Api.Dtos.Categories;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CategoriesController(CategoryManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryResponse>>> List(
        [FromQuery] bool includeArchived,
        CancellationToken ct)
        => Ok(await manager.ListAsync(includeArchived, ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<CategoryResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(
        [FromBody] CreateCategoryRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<CategoryResponse>> Update(
        Guid uid,
        [FromBody] UpdateCategoryRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
