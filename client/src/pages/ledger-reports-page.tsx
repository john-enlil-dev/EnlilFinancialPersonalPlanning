import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Card,
  CardBody,
  Container,
  FormGroup,
  Input,
  Label,
  Table,
} from 'reactstrap';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ledgerReportsApi } from '../api/ledger-reports';
import { queryKeys } from '../api/query-keys';
import { CategoryPill, categoryColor } from '../UI/functions/render-category-pill';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import type {
  LedgerReportCategorySlice,
  LedgerReportMonthlyBucket,
  LedgerReportResponse,
} from '../types/api';

const TOP_N = 7;
const OTHER_KEY = '__other__';
const OTHER_NAME = 'Other';
const OTHER_COLOR = '#6b7280';

const toIsoDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const currentMonthRange = (): { from: string; to: string } => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
};

const formatCurrency = (n: number): string =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const formatCurrencyDetailed = (n: number): string =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const formatPct = (n: number): string => `${(n * 100).toFixed(0)}%`;

const formatMonthLabel = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

const colorFor = (uid: string): string =>
  uid === OTHER_KEY ? OTHER_COLOR : categoryColor(uid);

interface PieSlice {
  categoryUID: string;
  categoryName: string;
  amount: number;
}

// Collapse the long tail into a single "Other" slice once the list exceeds TOP_N.
function topNWithOther(slices: PieSlice[]): PieSlice[] {
  if (slices.length <= TOP_N) return slices;
  const sorted = [...slices].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const otherAmount = rest.reduce((acc, s) => acc + s.amount, 0);
  if (otherAmount <= 0) return top;
  return [
    ...top,
    { categoryUID: OTHER_KEY, categoryName: OTHER_NAME, amount: otherAmount },
  ];
}

interface TrendChartRow {
  monthLabel: string;
  [categoryName: string]: string | number;
}

// Pivot per-month buckets into Recharts row shape. The set of visible
// categories is determined by total spend across the trend window — anything
// past TOP_N gets rolled into a single "Other" stack so the chart stays
// readable when the user has many categories.
function pivotTrendWithOther(buckets: LedgerReportMonthlyBucket[]): {
  rows: TrendChartRow[];
  visible: { uid: string; name: string }[];
} {
  const totalsByUid = new Map<string, { name: string; total: number }>();
  buckets.forEach((b) => {
    b.categories.forEach((c) => {
      const existing = totalsByUid.get(c.categoryUID);
      if (existing) {
        existing.total += c.amount;
      } else {
        totalsByUid.set(c.categoryUID, { name: c.categoryName, total: c.amount });
      }
    });
  });

  const ranked = Array.from(totalsByUid.entries())
    .map(([uid, v]) => ({ uid, name: v.name, total: v.total }))
    .sort((a, b) => b.total - a.total);

  const top = ranked.slice(0, TOP_N);
  const tail = ranked.slice(TOP_N);
  const visible: { uid: string; name: string }[] = top.map((c) => ({ uid: c.uid, name: c.name }));
  const hasOther = tail.length > 0 && tail.some((c) => c.total > 0);
  if (hasOther) visible.push({ uid: OTHER_KEY, name: OTHER_NAME });

  const topUidSet = new Set(top.map((c) => c.uid));

  const rows = buckets.map((b) => {
    const row: TrendChartRow = { monthLabel: formatMonthLabel(b.monthStart) };
    visible.forEach((v) => {
      row[v.name] = 0;
    });
    b.categories.forEach((c) => {
      if (topUidSet.has(c.categoryUID)) {
        row[c.categoryName] = ((row[c.categoryName] as number) ?? 0) + c.amount;
      } else if (hasOther) {
        row[OTHER_NAME] = ((row[OTHER_NAME] as number) ?? 0) + c.amount;
      }
    });
    return row;
  });

  return { rows, visible };
}

type SortKey = 'name' | 'amount' | 'pct' | 'count' | 'prior';
type SortDir = 'asc' | 'desc';

export default function LedgerReportsPage() {
  const defaultRange = currentMonthRange();
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const reportQuery = useQuery<LedgerReportResponse>({
    queryKey: queryKeys.ledgerReports.range(from, to),
    queryFn: () => ledgerReportsApi.get(from, to),
  });

  const data = reportQuery.data;

  const trend = useMemo(
    () => (data ? pivotTrendWithOther(data.monthlyTrend) : { rows: [], visible: [] }),
    [data],
  );

  const pieSlices = useMemo(() => {
    if (!data) return [];
    return topNWithOther(
      data.expenseByCategory.map((s) => ({
        categoryUID: s.categoryUID,
        categoryName: s.categoryName,
        amount: s.amount,
      })),
    );
  }, [data]);

  const sortedTableRows = useMemo(() => {
    if (!data) return [];
    const rows = [...data.expenseByCategory];
    const total = data.totalExpense;
    rows.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name':
          return dir * a.categoryName.localeCompare(b.categoryName);
        case 'amount':
          return dir * (a.amount - b.amount);
        case 'pct':
          return dir * ((total > 0 ? a.amount / total : 0) - (total > 0 ? b.amount / total : 0));
        case 'count':
          return dir * (a.transactionCount - b.transactionCount);
        case 'prior':
          return dir * ((a.priorAmount ?? 0) - (b.priorAmount ?? 0));
        default:
          return 0;
      }
    });
    return rows;
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (key: SortKey): string => {
    if (sortKey !== key) return 'bi-arrow-down-up';
    return sortDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  };

  const renderHeader = () => (
    <RenderPageHeader
      title="Ledger Reports"
      subtitle="Where your money went — totals, category breakdown, and trend."
    />
  );

  const renderFilters = () => (
    <Card className="mb-4">
      <CardBody>
        <div className="d-flex align-items-end gap-3 flex-wrap">
          <FormGroup className="mb-0">
            <Label for="report-from" className="small mb-1">
              From
            </Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </FormGroup>
          <FormGroup className="mb-0">
            <Label for="report-to" className="small mb-1">
              To
            </Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </FormGroup>
        </div>
      </CardBody>
    </Card>
  );

  const renderTile = (label: string, value: number, tone: 'income' | 'expense' | 'neutral') => {
    const cls = tone === 'income' ? 'text-success' : tone === 'expense' ? 'text-danger' : '';
    return (
      <div className="dashboard-tile">
        <div className="dashboard-tile-label">{label}</div>
        <div className={`dashboard-tile-value ${cls}`}>{formatCurrency(value)}</div>
      </div>
    );
  };

  const renderTiles = () => {
    if (!data) return null;
    const days = Math.max(
      1,
      (new Date(data.to).getTime() - new Date(data.from).getTime()) / 86400000 + 1,
    );
    return (
      <Card className="mb-4">
        <CardBody>
          <div className="dashboard-tile-row">
            {renderTile('Income', data.totalIncome, 'income')}
            {renderTile('Expense', data.totalExpense, 'expense')}
            {renderTile('Net', data.netCashflow, 'neutral')}
            {renderTile('Avg expense / day', data.totalExpense / days, 'neutral')}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderPieTooltip = (params: {
    active?: boolean;
    payload?: { name: string; value: number }[];
  }) => {
    if (!params.active || !params.payload || params.payload.length === 0) return null;
    const p = params.payload[0]!;
    return (
      <div className="dashboard-chart-tooltip">
        <div className="dashboard-chart-tooltip-title">{p.name}</div>
        <div>{formatCurrencyDetailed(p.value)}</div>
      </div>
    );
  };

  const renderPie = () => {
    if (!data) return null;
    if (pieSlices.length === 0) {
      return (
        <Card className="mb-4">
          <CardBody>
            <h5 className="mb-3">Expense by category</h5>
            <p className="text-muted mb-0">No expenses in this window.</p>
          </CardBody>
        </Card>
      );
    }
    return (
      <Card className="mb-4">
        <CardBody>
          <div className="d-flex align-items-baseline mb-3">
            <h5 className="mb-0 me-3">Expense by category</h5>
            {data.expenseByCategory.length > TOP_N && (
              <small className="text-muted">
                Showing top {TOP_N} of {data.expenseByCategory.length}; the rest are grouped into
                "Other".
              </small>
            )}
          </div>
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieSlices}
                  dataKey="amount"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  label={(entry: { categoryName: string; percent?: number }) => {
                    const pct = entry.percent ?? 0;
                    if (pct < 0.04) return '';
                    return `${entry.categoryName} ${(pct * 100).toFixed(0)}%`;
                  }}
                >
                  {pieSlices.map((slice) => (
                    <Cell key={slice.categoryUID} fill={colorFor(slice.categoryUID)} />
                  ))}
                </Pie>
                <Tooltip content={renderPieTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderCategoryTableHeader = (label: string, key: SortKey, alignEnd = false) => (
    <th
      className={alignEnd ? 'text-end' : ''}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => toggleSort(key)}
    >
      {label} <i className={`bi ${sortIcon(key)}`} aria-hidden="true" />
    </th>
  );

  const renderCategoryRow = (row: LedgerReportCategorySlice, totalExpense: number) => {
    const pct = totalExpense > 0 ? row.amount / totalExpense : 0;
    const prior = row.priorAmount;
    const delta = prior !== null ? row.amount - prior : null;
    const pctDelta = prior !== null && prior > 0 ? delta! / prior : null;
    const tone =
      delta === null || delta === 0
        ? 'text-muted'
        : delta > 0
          ? 'text-danger'
          : 'text-success';
    return (
      <tr key={row.categoryUID}>
        <td>
          <CategoryPill categoryUid={row.categoryUID} name={row.categoryName} />
        </td>
        <td className="text-end fw-semibold">{formatCurrencyDetailed(row.amount)}</td>
        <td className="text-end">{formatPct(pct)}</td>
        <td className="text-end">{row.transactionCount}</td>
        <td className={`text-end ${tone}`}>
          {prior === null ? (
            <span className="text-muted">—</span>
          ) : (
            <>
              {formatCurrencyDetailed(prior)}
              {delta !== null && delta !== 0 && (
                <span className="ms-2">
                  {delta > 0 ? '↑' : '↓'}
                  {pctDelta !== null ? ` ${Math.abs(pctDelta * 100).toFixed(0)}%` : ''}
                </span>
              )}
            </>
          )}
        </td>
      </tr>
    );
  };

  const renderCategoryTable = () => {
    if (!data) return null;
    if (data.expenseByCategory.length === 0) return null;
    return (
      <Card className="mb-4">
        <CardBody>
          <h5 className="mb-3">All expense categories</h5>
          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                {renderCategoryTableHeader('Category', 'name')}
                {renderCategoryTableHeader('Amount', 'amount', true)}
                {renderCategoryTableHeader('% of total', 'pct', true)}
                {renderCategoryTableHeader('# transactions', 'count', true)}
                {renderCategoryTableHeader('Prior window', 'prior', true)}
              </tr>
            </thead>
            <tbody>{sortedTableRows.map((r) => renderCategoryRow(r, data.totalExpense))}</tbody>
          </Table>
        </CardBody>
      </Card>
    );
  };

  const renderTrend = () => {
    if (!data) return null;
    if (trend.visible.length === 0) {
      return (
        <Card className="mb-4">
          <CardBody>
            <h5 className="mb-3">Monthly trend — last 6 months</h5>
            <p className="text-muted mb-0">No expense activity in the trend window.</p>
          </CardBody>
        </Card>
      );
    }
    return (
      <Card className="mb-4">
        <CardBody>
          <div className="d-flex align-items-baseline mb-3">
            <h5 className="mb-0 me-3">Monthly trend — last 6 months</h5>
            {trend.visible.some((v) => v.uid === OTHER_KEY) && (
              <small className="text-muted">
                Top {TOP_N} categories shown; the rest are grouped into "Other".
              </small>
            )}
          </div>
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <BarChart data={trend.rows} margin={{ top: 12, right: 24, bottom: 12, left: 12 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="monthLabel" stroke="rgba(255,255,255,0.6)" />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v)}
                  stroke="rgba(255,255,255,0.6)"
                />
                <Tooltip
                  formatter={(value: number) => formatCurrencyDetailed(value)}
                  contentStyle={{
                    backgroundColor: 'var(--enlil-surface-elevated)',
                    border: '1px solid var(--enlil-card-border)',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                {trend.visible.map((c) => (
                  <Bar
                    key={c.uid}
                    dataKey={c.name}
                    stackId="expense"
                    fill={colorFor(c.uid)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderInsights = () => {
    if (!data || data.insights.length === 0) return null;
    return (
      <Card>
        <CardBody>
          <h5 className="mb-3">Insights</h5>
          <ul className="mb-0">
            {data.insights.map((i, idx) => (
              <li key={idx}>{i.message}</li>
            ))}
          </ul>
        </CardBody>
      </Card>
    );
  };

  const renderBody = () => {
    if (reportQuery.isLoading) return <p className="text-muted">Loading…</p>;
    if (reportQuery.error)
      return (
        <p className="text-danger">
          {reportQuery.error instanceof Error
            ? reportQuery.error.message
            : 'Failed to load report'}
        </p>
      );
    return (
      <>
        {renderTiles()}
        {renderPie()}
        {renderCategoryTable()}
        {renderTrend()}
        {renderInsights()}
      </>
    );
  };

  return (
    <Container fluid className="py-4">
      {renderHeader()}
      {renderFilters()}
      {renderBody()}
    </Container>
  );
}
