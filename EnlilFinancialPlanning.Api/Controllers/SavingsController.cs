using EnlilFinancialPlanning.Api.Dtos.Savings;
using EnlilFinancialPlanning.Api.Dtos.SavingsTransactions;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class SavingsController(SavingsManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SavingsResponse>>> List(CancellationToken ct)
        => Ok(await manager.ListAsync(ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<SavingsResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SavingsResponse>> Create(
        [FromBody] CreateSavingsRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<SavingsResponse>> Update(
        Guid uid,
        [FromBody] UpdateSavingsRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{uid:guid}/transactions")]
    public async Task<ActionResult<IReadOnlyList<SavingsTransactionResponse>>> ListTransactions(
        Guid uid,
        CancellationToken ct)
    {
        var result = await manager.ListTransactionsAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{uid:guid}/transactions")]
    public async Task<ActionResult<SavingsTransactionResponse>> CreateTransaction(
        Guid uid,
        [FromBody] CreateSavingsTransactionRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateTransactionAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{uid:guid}/transactions/{lineItemUid:guid}")]
    public async Task<ActionResult<SavingsTransactionResponse>> UpdateTransaction(
        Guid uid,
        Guid lineItemUid,
        [FromBody] CreateSavingsTransactionRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateTransactionAsync(uid, lineItemUid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    // One-shot tool: rewrites Direction + IsCashMovement on every LineItem linked
    // to a Savings account so it matches the cash-perspective rules. Pass
    // ?dryRun=true to preview without writing.
    [HttpPost("repair-ledger-polarity")]
    public async Task<ActionResult<RepairLedgerPolarityReport>> RepairLedgerPolarity(
        [FromQuery] bool dryRun,
        CancellationToken ct)
        => Ok(await manager.RepairLedgerPolarityAsync(dryRun, ct));
}
