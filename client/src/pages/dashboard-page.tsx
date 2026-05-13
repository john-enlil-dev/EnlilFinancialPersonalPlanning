import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Card, CardBody, Container, Table } from 'reactstrap';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { queryKeys } from '../api/query-keys';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import type {
  CategoryVarianceRow,
  DashboardCategoryVarianceResponse,
  DashboardTile,
  DashboardTilesResponse,
  DashboardTimelineResponse,
  TimelineWeek,
} from '../types/api';

const INCOME_COLOR = '#22c55e';
const EXPENSE_COLOR = '#ef4444';
const BALANCE_COLOR = '#8b5cf6';

const formatCurrency = (value: number): string =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const formatCurrencyDetailed = (value: number): string =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const formatPercent = (fraction: number): string =>
  `${fraction >= 0 ? '↑' : '↓'} ${Math.abs(fraction * 100).toFixed(0)}%`;

const formatWeekRange = (start: string, end: string): string => {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
};

export default function DashboardPage() {
  const tilesQuery = useQuery<DashboardTilesResponse>({
    queryKey: queryKeys.dashboard.tiles(),
    queryFn: dashboardApi.tiles,
  });
  const timelineQuery = useQuery<DashboardTimelineResponse>({
    queryKey: queryKeys.dashboard.timeline(),
    queryFn: dashboardApi.timeline,
  });
  const varianceQuery = useQuery<DashboardCategoryVarianceResponse>({
    queryKey: queryKeys.dashboard.categoryVariance(),
    queryFn: dashboardApi.categoryVariance,
  });

  const renderTile = (label: string, tile: DashboardTile | undefined, isLoading: boolean) => {
    if (isLoading || !tile) {
      return (
        <div className="dashboard-tile">
          <div className="dashboard-tile-label">{label}</div>
          <div className="dashboard-tile-value text-muted">—</div>
        </div>
      );
    }
    const value = tile.value;
    const baseline = tile.baseline;
    let comparison: React.ReactNode = (
      <span className="dashboard-tile-baseline text-muted">No baseline yet</span>
    );
    if (baseline !== null) {
      const delta = value - baseline;
      const pct = baseline !== 0 ? delta / baseline : null;
      const arrowClass =
        delta === 0 ? 'text-muted' : delta > 0 ? 'text-success' : 'text-danger';
      comparison = (
        <span className={`dashboard-tile-baseline ${arrowClass}`}>
          {pct !== null ? formatPercent(pct) : delta >= 0 ? '↑' : '↓'} vs {formatCurrency(baseline)} typical
        </span>
      );
    }
    return (
      <div className="dashboard-tile">
        <div className="dashboard-tile-label">{label}</div>
        <div className="dashboard-tile-value">{formatCurrency(value)}</div>
        {comparison}
      </div>
    );
  };

  const renderTiles = () => {
    const data = tilesQuery.data;
    const isLoading = tilesQuery.isLoading;
    return (
      <Card className="mb-4">
        <CardBody>
          <div className="dashboard-tile-row">
            {renderTile('Income this month', data?.incomeThisMonth, isLoading)}
            {renderTile('Expense this month', data?.expenseThisMonth, isLoading)}
            {renderTile('Net this month', data?.netThisMonth, isLoading)}
            {renderTile('Net next 30 days (projected)', data?.netNext30Days, isLoading)}
          </div>
          {data && !data.hasEnoughHistoryForBaselines && (
            <div className="text-muted mt-3" style={{ fontSize: '0.85rem' }}>
              Comparisons unlock once there's at least three full months of ledger history before
              this month.
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  const renderTimelineTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const week = payload[0]?.payload as TimelineWeek | undefined;
    if (!week) return null;
    return (
      <div className="dashboard-chart-tooltip">
        <div className="dashboard-chart-tooltip-title">
          {formatWeekRange(week.weekStart, week.weekEnd)}
        </div>
        <div>
          <span style={{ color: INCOME_COLOR }}>Income</span>: {formatCurrencyDetailed(week.income)}
        </div>
        <div>
          <span style={{ color: EXPENSE_COLOR }}>Expense</span>:{' '}
          {formatCurrencyDetailed(week.expense)}
        </div>
        <div>
          Net: <strong>{formatCurrencyDetailed(week.net)}</strong>
        </div>
        <div>
          <span style={{ color: BALANCE_COLOR }}>End-of-week balance</span>:{' '}
          {formatCurrencyDetailed(week.runningBalance)}
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    const data = timelineQuery.data;
    return (
      <Card className="mb-4">
        <CardBody>
          <div className="d-flex align-items-baseline mb-3">
            <h5 className="mb-0 me-3">Cashflow & runway — next 13 weeks</h5>
            <small className="text-muted">
              Side-by-side income/expense per week, with end-of-week running balance.
            </small>
          </div>
          {timelineQuery.isLoading && <div className="text-muted">Loading…</div>}
          {data && data.weeks.length === 0 && (
            <div className="text-muted">No ledger activity in the next 13 weeks.</div>
          )}
          {data && data.weeks.length > 0 && (
            <>
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer>
                  <ComposedChart
                    data={data.weeks}
                    margin={{ top: 12, right: 24, bottom: 12, left: 12 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="weekStart"
                      tickFormatter={(d: string) =>
                        new Date(d).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                      stroke="rgba(255,255,255,0.6)"
                    />
                    <YAxis
                      tickFormatter={(v: number) => formatCurrency(v)}
                      stroke="rgba(255,255,255,0.6)"
                    />
                    <Tooltip content={renderTimelineTooltip} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill={INCOME_COLOR} />
                    <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} />
                    <Line
                      type="monotone"
                      dataKey="runningBalance"
                      name="Running balance"
                      stroke={BALANCE_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {!data.hasTemplates && (
                <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                  Add a recurring template (rent, paycheck, etc.) to project future weeks
                  automatically.
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    );
  };

  const renderVarianceRow = (row: CategoryVarianceRow) => {
    const hasBaseline = row.baseline !== null;
    const delta = row.delta;
    const pct = row.percentDelta;
    const overClass =
      delta === null
        ? 'text-muted'
        : delta > 0
          ? 'text-danger'
          : delta < 0
            ? 'text-success'
            : 'text-muted';
    return (
      <tr key={row.categoryUID}>
        <td>{row.categoryName}</td>
        <td className="text-end">{formatCurrencyDetailed(row.thisMonth)}</td>
        <td className="text-end">
          {hasBaseline ? formatCurrencyDetailed(row.baseline as number) : '—'}
        </td>
        <td className={`text-end ${overClass}`}>
          {delta === null
            ? '—'
            : `${delta > 0 ? '+' : ''}${formatCurrencyDetailed(delta)}`}
        </td>
        <td className={`text-end ${overClass}`}>
          {pct === null ? '—' : formatPercent(pct)}
        </td>
      </tr>
    );
  };

  const sortedRows = useMemo(() => varianceQuery.data?.rows ?? [], [varianceQuery.data]);

  const renderCategoryVariance = () => {
    const data = varianceQuery.data;
    return (
      <Card>
        <CardBody>
          <div className="d-flex align-items-baseline mb-3">
            <h5 className="mb-0 me-3">Expense categories — this month vs trailing 3-month average</h5>
            <small className="text-muted">Sorted by largest absolute change.</small>
          </div>
          {varianceQuery.isLoading && <div className="text-muted">Loading…</div>}
          {data && sortedRows.length === 0 && (
            <div className="text-muted">No expense activity yet this month.</div>
          )}
          {data && sortedRows.length > 0 && (
            <>
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-end">This month</th>
                    <th className="text-end">Typical (3-mo avg)</th>
                    <th className="text-end">Delta</th>
                    <th className="text-end">% vs typical</th>
                  </tr>
                </thead>
                <tbody>{sortedRows.map(renderVarianceRow)}</tbody>
              </Table>
              {!data.hasEnoughHistoryForBaselines && (
                <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                  Baselines unlock once there's at least three full months of ledger history before
                  this month.
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <Container fluid className="py-4">
      <RenderPageHeader
        title="Dashboard"
        subtitle="Cashflow this month and cash runway for the next 13 weeks."
      />
      {renderTiles()}
      {renderTimeline()}
      {renderCategoryVariance()}
    </Container>
  );
}
