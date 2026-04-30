using EnlilFinancialPlanning.Api.Data.Entities.Enums;

namespace EnlilFinancialPlanning.Api.Dtos.LineItems;

public sealed class LineItemQuery
{
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public Direction? Direction { get; set; }
    public Guid? CategoryUID { get; set; }
}
