using EnlilFinancialPlanning.Api.Dtos.MortgageDebts;
using EnlilFinancialPlanning.Api.Dtos.MortgagePayments;
using EnlilFinancialPlanning.Api.Managers;
using Microsoft.AspNetCore.Mvc;

namespace EnlilFinancialPlanning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MortgageDebtsController(MortgageDebtManager manager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MortgageDebtResponse>>> List(CancellationToken ct)
        => Ok(await manager.ListAsync(ct));

    [HttpGet("{uid:guid}")]
    public async Task<ActionResult<MortgageDebtResponse>> Get(Guid uid, CancellationToken ct)
    {
        var result = await manager.GetAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<MortgageDebtResponse>> Create(
        [FromBody] CreateMortgageDebtRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { uid = result.UID }, result);
    }

    [HttpPut("{uid:guid}")]
    public async Task<ActionResult<MortgageDebtResponse>> Update(
        Guid uid,
        [FromBody] UpdateMortgageDebtRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdateAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{uid:guid}/payments")]
    public async Task<ActionResult<IReadOnlyList<MortgagePaymentResponse>>> ListPayments(
        Guid uid,
        CancellationToken ct)
    {
        var result = await manager.ListPaymentsAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{uid:guid}/payments")]
    public async Task<ActionResult<MortgagePaymentResponse>> CreatePayment(
        Guid uid,
        [FromBody] CreateMortgagePaymentRequest request,
        CancellationToken ct)
    {
        var result = await manager.CreatePaymentAsync(uid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{uid:guid}/payments/{lineItemUid:guid}")]
    public async Task<ActionResult<MortgagePaymentResponse>> UpdatePayment(
        Guid uid,
        Guid lineItemUid,
        [FromBody] CreateMortgagePaymentRequest request,
        CancellationToken ct)
    {
        var result = await manager.UpdatePaymentAsync(uid, lineItemUid, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{uid:guid}/snapshots")]
    public async Task<ActionResult<IReadOnlyList<MortgageBalanceSnapshotResponse>>> ListSnapshots(
        Guid uid,
        CancellationToken ct)
    {
        var result = await manager.ListSnapshotsAsync(uid, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
