using EnlilFinancialPlanning.Api.Dtos.CreditCardDebts;
using EnlilFinancialPlanning.Api.Dtos.CreditCardTransactions;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CreditCardDebtsController(CreditCardDebtManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CreditCardDebtResponse>>> List(CancellationToken ct)
        => Ok(await manager.ListAsync(ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<CreditCardDebtResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CreditCardDebtResponse>> Create(
        [FromBody] CreateCreditCardDebtRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<CreditCardDebtResponse>> Update(
        Guid uid,
        [FromBody] UpdateCreditCardDebtRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{uid:guid}/transactions")]
    public async Task<ActionResult<IReadOnlyList<CreditCardTransactionResponse>>> ListTransactions(
        Guid uid,
        CancellationToken ct)
    {
        var result = await manager.ListTransactionsAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{uid:guid}/transactions")]
    public async Task<ActionResult<CreditCardTransactionResponse>> CreateTransaction(
        Guid uid,
        [FromBody] CreateCreditCardTransactionRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateTransactionAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{uid:guid}/transactions/{lineItemUid:guid}")]
    public async Task<ActionResult<CreditCardTransactionResponse>> UpdateTransaction(
        Guid uid,
        Guid lineItemUid,
        [FromBody] CreateCreditCardTransactionRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateTransactionAsync(uid, lineItemUid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{uid:guid}/transactions/{lineItemUid:guid}")]
    public async Task<IActionResult> DeleteTransaction(Guid uid, Guid lineItemUid, CancellationToken ct)
    {
        var result = await manager.DeleteTransactionAsync(uid, lineItemUid, ct);
        return result is null ? NotFound() : NoContent();
    }

    [HttpGet("{uid:guid}/anchors")]
    public async Task<ActionResult<IReadOnlyList<CreditCardBalanceAnchorResponse>>> ListAnchors(
        Guid uid,
        CancellationToken ct)
    {
        var result = await manager.ListAnchorsAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{uid:guid}/reconcile")]
    public async Task<ActionResult<CreditCardDebtResponse>> Reconcile(
        Guid uid,
        [FromBody] ReconcileCreditCardDebtRequest request,
        CancellationToken ct)
    {
        var result = await manager.ReconcileAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{uid:guid}/anchors/{anchorUid:guid}")]
    public async Task<IActionResult> DeleteAnchor(Guid uid, Guid anchorUid, CancellationToken ct)
    {
        var result = await manager.DeleteAnchorAsync(uid, anchorUid, ct);
        return result switch
        {
            null => NotFound(),
            false => Conflict("The opening anchor cannot be deleted."),
            true => NoContent(),
        };
    }
}
