import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
  Table,
} from 'reactstrap';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { categoriesApi } from '../api/categories';
import { savingsApi } from '../api/savings';
import { queryKeys } from '../api/query-keys';
import { RenderCreatableSubtypeSelect } from '../UI/functions/render-creatable-subtype-select';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../UI/functions/render-skeleton-button-functions';
import { TagPill } from '../UI/functions/render-tag-pill';
import type {
  CreateSavingsTransactionRequest,
  SavingsComponentType,
  SavingsTransaction,
} from '../types/api';
import { COMPOUNDING_FREQUENCY_LABELS } from '../types/enums';

const COMPONENTS: SavingsComponentType[] = ['Deposit', 'Interest', 'Withdrawal', 'Fee', 'Transfer'];

const COMPONENT_COLORS: Record<SavingsComponentType, string> = {
  Deposit: '#22c55e',
  Interest: '#8b5cf6',
  Withdrawal: '#ef4444',
  Fee: '#f97316',
  Transfer: '#06b6d4',
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmt = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

function bucketComponent(raw: string | null): SavingsComponentType | 'Other' {
  if (!raw) return 'Other';
  const normalized = raw.trim().toLowerCase();
  for (const c of COMPONENTS) {
    if (c.toLowerCase() === normalized) return c;
  }
  return 'Other';
}

function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const result: string[] = [];
  const [sy, sm] = startMonth.split('-').map(Number) as [number, number];
  const [ey, em] = endMonth.split('-').map(Number) as [number, number];
  let year = sy;
  let month = sm;
  while (year < ey || (year === ey && month <= em)) {
    result.push(`${year}-${String(month).padStart(2, '0')}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return result;
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function isPositive(c: SavingsComponentType | 'Other'): boolean {
  return c === 'Deposit' || c === 'Interest';
}

interface YearTotals {
  year: string;
  Deposit: number;
  Interest: number;
  Withdrawal: number;
  Fee: number;
  Transfer: number;
  Net: number;
  Total: number;
}

export default function SavingsDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const queryClient = useQueryClient();

  type TabKey = 'overview' | 'line-items';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLineItemUid, setEditingLineItemUid] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayIso());
  const [billingMonth, setBillingMonth] = useState<string>('');
  const [componentType, setComponentType] = useState<SavingsComponentType>('Deposit');
  const [amount, setAmount] = useState<string>('');
  const [tag, setTag] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [categoryUid, setCategoryUid] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = editingLineItemUid !== null;

  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.savings.detail(uid ?? ''),
        queryFn: () => savingsApi.get(uid!),
        enabled: !!uid,
      },
      {
        queryKey: queryKeys.savings.transactions(uid ?? ''),
        queryFn: () => savingsApi.listTransactions(uid!),
        enabled: !!uid,
      },
      {
        queryKey: queryKeys.categories.list(false),
        queryFn: () => categoriesApi.list(false),
      },
    ],
  });

  const [savingsQuery, txQuery, categoriesQuery] = queries;
  const savings = savingsQuery.data;
  const transactions: SavingsTransaction[] = txQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  // Categories are NOT filtered by direction — the user's framing is that a
  // ledger line item for "Savings" is an Expense, while the savings account sees
  // it as a deposit (income to the account). Those two perspectives don't share
  // a direction, so we let any non-archived category be picked. The backend
  // derives LineItem.Direction from whatever category is chosen.
  const eligibleCategories = useMemo(
    () => categories.filter((c) => !c.isArchived),
    [categories],
  );

  useEffect(() => {
    if (eligibleCategories.length === 0) {
      setCategoryUid('');
      return;
    }
    if (!eligibleCategories.some((c) => c.uid === categoryUid)) {
      setCategoryUid(eligibleCategories[0]!.uid);
    }
  }, [eligibleCategories, categoryUid]);

  // Tag suggestion options pulled from existing transactions on this account.
  const tagOptions = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.tag).filter((s): s is string => !!s))),
    [transactions],
  );

  // ---- Aggregations -----------------------------------------------------

  const totals = useMemo(() => {
    const acc: Record<SavingsComponentType | 'Other' | 'Total' | 'Net', number> = {
      Deposit: 0,
      Interest: 0,
      Withdrawal: 0,
      Fee: 0,
      Transfer: 0,
      Other: 0,
      Total: 0,
      Net: 0,
    };
    for (const t of transactions) {
      const bucket = bucketComponent(t.componentType);
      acc[bucket] += t.amount;
      acc.Total += t.amount;
      if (isPositive(bucket as SavingsComponentType)) acc.Net += t.amount;
      else if (bucket !== 'Other') acc.Net -= t.amount;
    }
    return acc;
  }, [transactions]);

  const avgMonthlyDeposits = useMemo(() => {
    if (transactions.length === 0) return 0;
    const months = new Set<string>();
    for (const t of transactions) {
      months.add((t.billingMonth ?? t.date).slice(0, 7));
    }
    return months.size === 0 ? 0 : totals.Deposit / months.size;
  }, [transactions, totals.Deposit]);

  // Net change per month — one signed total per month: deposits + interest minus
  // withdrawals + fees + transfers. Bar goes above zero for net inflow, below
  // zero for net outflow. Months with no activity render as a 0-height bar.
  const monthlyChartData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const t of transactions) {
      const month = (t.billingMonth ?? t.date).slice(0, 7);
      const bucket = bucketComponent(t.componentType);
      if (bucket === 'Other') continue;
      const signed = isPositive(bucket as SavingsComponentType) ? t.amount : -t.amount;
      byMonth.set(month, (byMonth.get(month) ?? 0) + signed);
    }
    if (byMonth.size === 0) return [];
    const sortedMonths = [...byMonth.keys()].sort();
    const allMonths = generateMonthRange(sortedMonths[0]!, sortedMonths[sortedMonths.length - 1]!);
    return allMonths.map((month) => ({ month, net: byMonth.get(month) ?? 0 }));
  }, [transactions]);

  // Derived balance trajectory — one point per DATE (multiple transactions on the
  // same day collapse to a single end-of-day balance). Anchor at currentValue, walk
  // newest→oldest. First-encounter wins per date: walking newest first means the
  // first transaction we hit on a given date is the LATEST one of that day, and
  // its "balance after" equals the end-of-day balance. Same-date transactions
  // after that one still update runningBalance (so older dates get the correct
  // start-of-current-date balance) but don't push duplicate points.
  const balanceTrajectory = useMemo(() => {
    if (!savings) return [];
    const validTx = transactions.filter((t) => t.date <= savings.currentValueAsOfDate);
    const sortedDesc = [...validTx].sort((a, b) => b.date.localeCompare(a.date));

    const points: { date: string; timestamp: number; balance: number }[] = [];
    const seenDates = new Set<string>();
    let runningBalance = savings.currentValue;
    points.push({
      date: savings.currentValueAsOfDate,
      timestamp: Date.parse(savings.currentValueAsOfDate),
      balance: runningBalance,
    });
    seenDates.add(savings.currentValueAsOfDate);

    for (const t of sortedDesc) {
      if (!seenDates.has(t.date)) {
        points.push({ date: t.date, timestamp: Date.parse(t.date), balance: runningBalance });
        seenDates.add(t.date);
      }
      const bucket = bucketComponent(t.componentType);
      const signedDelta = isPositive(bucket as SavingsComponentType) ? t.amount : -t.amount;
      runningBalance -= signedDelta;
    }

    return points.reverse();
  }, [savings, transactions]);

  const yearOverYear = useMemo<YearTotals[]>(() => {
    const byYear = new Map<string, YearTotals>();
    for (const t of transactions) {
      const year = (t.billingMonth ?? t.date).slice(0, 4);
      let row = byYear.get(year);
      if (!row) {
        row = {
          year,
          Deposit: 0,
          Interest: 0,
          Withdrawal: 0,
          Fee: 0,
          Transfer: 0,
          Net: 0,
          Total: 0,
        };
        byYear.set(year, row);
      }
      const bucket = bucketComponent(t.componentType);
      if (bucket !== 'Other') {
        row[bucket] += t.amount;
        row.Total += t.amount;
        if (isPositive(bucket)) row.Net += t.amount;
        else row.Net -= t.amount;
      }
    }
    return [...byYear.values()].sort((a, b) => b.year.localeCompare(a.year));
  }, [transactions]);

  // ---- Mutations --------------------------------------------------------

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.savings.transactions(uid!) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.savings.detail(uid!) });
  };

  const createMutation = useMutation({
    mutationFn: (request: CreateSavingsTransactionRequest) =>
      savingsApi.createTransaction(uid!, request),
    onSuccess: () => {
      invalidate();
      setAmount('');
      setDescription('');
      setSubmitError(null);
      setDate((current) => addMonths(current, 1));
      setBillingMonth((current) => (current ? addMonths(`${current}-01`, 1).slice(0, 7) : ''));
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ lineItemUid, request }: { lineItemUid: string; request: CreateSavingsTransactionRequest }) =>
      savingsApi.updateTransaction(uid!, lineItemUid, request),
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const openCreate = () => {
    setEditingLineItemUid(null);
    setDate(todayIso());
    setBillingMonth('');
    setComponentType('Deposit');
    setAmount('');
    setTag(null);
    setDescription('');
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (t: SavingsTransaction) => {
    setEditingLineItemUid(t.lineItemUID);
    setDate(t.date);
    setBillingMonth(t.billingMonth ? t.billingMonth.slice(0, 7) : '');
    const ct = bucketComponent(t.componentType);
    setComponentType(ct === 'Other' ? 'Deposit' : ct);
    setAmount(t.amount.toString());
    setTag(t.tag);
    setDescription(t.description ?? '');
    setCategoryUid(t.categoryUID);
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLineItemUid(null);
    setSubmitError(null);
  };

  const handleSubmit = () => {
    if (!uid) return;
    if (!categoryUid) {
      setSubmitError('Pick a category before saving.');
      return;
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setSubmitError('Enter an amount greater than zero.');
      return;
    }
    const request: CreateSavingsTransactionRequest = {
      date,
      billingMonth: billingMonth ? `${billingMonth}-01` : null,
      categoryUID: categoryUid,
      description: description || null,
      componentType,
      amount: numAmount,
      tag: tag && tag.trim() !== '' ? tag : null,
    };
    if (isEditing && editingLineItemUid) {
      updateMutation.mutate({ lineItemUid: editingLineItemUid, request });
    } else {
      createMutation.mutate(request);
    }
  };

  // ---- Renders ----------------------------------------------------------

  const renderHeader = () => {
    const subtitle = savings
      ? `${savings.subtype ?? 'Savings'} · ${(savings.currentRate * 100).toFixed(3)}% APY · ${COMPOUNDING_FREQUENCY_LABELS[savings.compoundingFrequency]}`
      : 'Loading...';
    return (
      <RenderPageHeader
        title={savings?.name ?? 'Savings'}
        subtitle={subtitle}
        rightContent={
          <>
            <Link to="/assets" className="text-decoration-none">
              <RenderDefaultButton label="Back" icon="bi-arrow-left" />
            </Link>
            <RenderPrimaryButton label="Add transaction" icon="bi-plus-lg" onClick={openCreate} />
          </>
        }
      />
    );
  };

  const renderSavingsSummary = () => {
    if (!savings) return null;
    const stat = (label: string, value: React.ReactNode, color?: string, subtitle?: string) => (
      <div className="d-flex flex-column">
        <span className="stat-card-label lh-1">{label}</span>
        <span className="fw-semibold" style={color ? { color } : undefined}>
          {value}
        </span>
        {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
      </div>
    );

    return (
      <Card className="mb-3">
        <CardBody className="py-3">
          <div className="summary-stats-grid">
            {/* Row 1 — column 1 anchor: Current value */}
            {stat('Current value', fmt(savings.currentValue))}
            {stat('Rate (APY)', `${(savings.currentRate * 100).toFixed(3)}%`)}
            {stat('Compounding', COMPOUNDING_FREQUENCY_LABELS[savings.compoundingFrequency])}
            {stat('Subtype', savings.subtype ?? '—')}
            {stat('Institution', savings.institution ?? '—')}
            {/* Row 2 — column 1 anchor: Net change */}
            {stat(
              'Net change (lifetime)',
              fmt(totals.Net),
              totals.Net >= 0 ? COMPONENT_COLORS.Deposit : COMPONENT_COLORS.Withdrawal,
              `avg ${fmt(avgMonthlyDeposits)} deposits/mo`,
            )}
            {stat('Total Deposits', fmt(totals.Deposit), COMPONENT_COLORS.Deposit)}
            {stat('Total Interest', fmt(totals.Interest), COMPONENT_COLORS.Interest)}
            {stat('Total Withdrawals', fmt(totals.Withdrawal), COMPONENT_COLORS.Withdrawal)}
            {stat(
              'Total Fees + Transfers',
              fmt(totals.Fee + totals.Transfer),
              COMPONENT_COLORS.Fee,
              `fees: ${fmt(totals.Fee)} · transfers: ${fmt(totals.Transfer)}`,
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderTabs = () => (
    <Nav tabs className="mb-3">
      <NavItem>
        <NavLink
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          style={{ cursor: 'pointer' }}
        >
          Overview
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          active={activeTab === 'line-items'}
          onClick={() => setActiveTab('line-items')}
          style={{ cursor: 'pointer' }}
        >
          Line Items
        </NavLink>
      </NavItem>
    </Nav>
  );

  const renderYearlyCards = () => {
    if (yearOverYear.length === 0) {
      return (
        <Card className="mb-3">
          <CardBody className="py-2">
            <span className="stat-card-label">Yearly totals</span>
            <p className="text-muted small mb-0 mt-2">
              Per-year breakdown appears here once transactions are recorded.
            </p>
          </CardBody>
        </Card>
      );
    }
    return (
      <div className="year-cards-scroll">
        <Row className="g-3">
          {yearOverYear.map((row) => (
            <Col xs={12} key={row.year}>
              <Card>
                <CardBody className="py-2">
                  <div className="d-flex justify-content-between align-items-baseline mb-2">
                    <span className="stat-card-label">{row.year}</span>
                    <strong
                      style={{
                        fontSize: '1.05rem',
                        color: row.Net >= 0 ? COMPONENT_COLORS.Deposit : COMPONENT_COLORS.Withdrawal,
                      }}
                    >
                      {row.Net >= 0 ? '+' : '−'}
                      {fmt(Math.abs(row.Net)).replace(/^[-]/, '')}
                    </strong>
                  </div>
                  <div className="year-card-breakdown">
                    {/* Row 1 — labels */}
                    <span className="year-cell-label">Deposits</span>
                    <span className="year-cell-label">Interest</span>
                    <span className="year-cell-label">Withdrawals</span>
                    {/* Row 2 — values */}
                    <span className="year-cell-value" style={{ color: COMPONENT_COLORS.Deposit }}>
                      {fmt(row.Deposit)}
                    </span>
                    <span className="year-cell-value" style={{ color: COMPONENT_COLORS.Interest }}>
                      {fmt(row.Interest)}
                    </span>
                    <span className="year-cell-value" style={{ color: COMPONENT_COLORS.Withdrawal }}>
                      {fmt(row.Withdrawal)}
                    </span>
                    {/* Row 3 — fees + transfer note under Withdrawals */}
                    <span className="year-cell-extra" />
                    <span className="year-cell-extra" />
                    <span className="year-cell-extra">
                      {row.Fee + row.Transfer > 0
                        ? `+${fmt(row.Fee + row.Transfer)} fees/transfers`
                        : ''}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const renderBalanceChart = () => {
    if (!savings) return null;
    if (balanceTrajectory.length <= 1) {
      return (
        <Card className="mb-3">
          <CardBody className="py-2">
            <CardTitle tag="h6" className="mb-1">Balance over time</CardTitle>
            <p className="text-muted mb-0">Add transactions to populate the balance line.</p>
          </CardBody>
        </Card>
      );
    }
    return (
      <Card className="mb-3">
        <CardBody className="py-2">
          <div className="d-flex justify-content-between align-items-baseline mb-1">
            <CardTitle tag="h6" className="mb-0">Balance over time</CardTitle>
            <small className="text-muted">
              from {fmt(savings.currentValue)} · {balanceTrajectory.length - 1} transaction
              {balanceTrajectory.length - 1 === 1 ? '' : 's'}
            </small>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={balanceTrajectory} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  stroke="rgba(255,255,255,0.55)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(ts: number) => new Date(ts).toISOString().slice(0, 10)}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.55)"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#20242c', border: '1px solid #6b21a8' }}
                  formatter={(value: number) => fmt(value)}
                  labelFormatter={(ts: number) => new Date(ts).toISOString().slice(0, 10)}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--enlil-accent-bright)"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: 'var(--enlil-accent-bright)' }}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderMonthlyChart = () => {
    if (monthlyChartData.length === 0) {
      return (
        <Card className="mb-3">
          <CardBody className="py-2">
            <CardTitle tag="h6" className="mb-1">Monthly inflow / outflow</CardTitle>
            <p className="text-muted mb-0">No transactions yet.</p>
          </CardBody>
        </Card>
      );
    }
    return (
      <Card className="mb-3">
        <CardBody className="py-2">
          <CardTitle tag="h6" className="mb-1">Monthly net change</CardTitle>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyChartData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.55)" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="rgba(255,255,255,0.55)"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.35)" />
                <Tooltip
                  cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                  contentStyle={{ backgroundColor: '#20242c', border: '1px solid #6b21a8' }}
                  formatter={(value: number) => `${value >= 0 ? '+' : '−'}${fmt(Math.abs(value))}`}
                />
                <Bar dataKey="net">
                  {monthlyChartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.net >= 0 ? COMPONENT_COLORS.Deposit : COMPONENT_COLORS.Withdrawal}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderHistory = () => (
    <Card className="mb-0">
      <CardBody>
        <CardTitle tag="h5">Transaction history (newest first)</CardTitle>
        {transactions.length === 0 ? (
          <p className="text-muted mb-0">No transactions recorded yet.</p>
        ) : (
          <Table hover responsive size="sm" className="mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Billing month</th>
                <th>Type</th>
                <th>Tag</th>
                <th>Description</th>
                <th>Category</th>
                <th className="text-end">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const ct = bucketComponent(t.componentType);
                const positive = isPositive(ct as SavingsComponentType);
                const color = ct === 'Other' ? undefined : COMPONENT_COLORS[ct as SavingsComponentType];
                return (
                  <tr key={t.lineItemUID}>
                    <td>{t.date}</td>
                    <td>{t.billingMonth ? t.billingMonth.slice(0, 7) : '—'}</td>
                    <td style={{ color }} className="fw-semibold">
                      {t.componentType ?? '—'}
                    </td>
                    <td>{t.tag ? <TagPill tag={t.tag} /> : <span className="text-muted">—</span>}</td>
                    <td>{t.description ?? '—'}</td>
                    <td>{t.categoryName}</td>
                    <td className="text-end fw-semibold" style={{ color }}>
                      {positive ? '+' : '−'}
                      {fmt(t.amount).replace(/^[-]/, '')}
                    </td>
                    <td>
                      <RenderDefaultButton
                        label="Edit"
                        icon="bi-pencil-square"
                        onClick={() => openEdit(t)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  const renderTransactionModal = () => {
    const isPending = createMutation.isPending || updateMutation.isPending;
    return (
      <Modal isOpen={modalOpen} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {isEditing ? 'Edit transaction' : 'Add transaction'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row className="g-2">
              <FormGroup className="col-md-3">
                <Label for="tx-type">Type</Label>
                <Input
                  id="tx-type"
                  type="select"
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value as SavingsComponentType)}
                >
                  {COMPONENTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup className="col-md-3">
                <Label for="tx-date">Date</Label>
                <Input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </FormGroup>
              <FormGroup className="col-md-3">
                <Label for="tx-billing-month">
                  Billing month <span className="text-muted">(optional)</span>
                </Label>
                <Input
                  id="tx-billing-month"
                  type="month"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                />
              </FormGroup>
              <FormGroup className="col-md-3">
                <Label for="tx-amount">Amount</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="tx-category">Category</Label>
                <Input
                  id="tx-category"
                  type="select"
                  value={categoryUid}
                  onChange={(e) => setCategoryUid(e.target.value)}
                >
                  {eligibleCategories.length === 0 && <option value="">No categories</option>}
                  {eligibleCategories.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      {c.name}
                    </option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="tx-tag">
                  Tag <span className="text-muted">(savings grouping — optional)</span>
                </Label>
                <RenderCreatableSubtypeSelect
                  id="tx-tag"
                  value={tag}
                  options={tagOptions}
                  onChange={setTag}
                  placeholder="e.g., Vacation, Emergency, Bonus"
                />
              </FormGroup>
              <FormGroup className="col-12">
                <Label for="tx-description">Description (the "why") — optional</Label>
                <Input
                  id="tx-description"
                  type="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Direct deposit from paycheck"
                />
              </FormGroup>
            </Row>
            {submitError && <p className="text-danger mt-2 mb-0">{submitError}</p>}
            {!isEditing && (
              <p className="text-muted small mt-3 mb-0">
                Tip: after saving, the date advances one month and the form keeps your type, category &amp; tag
                so you can keep adding without reopening.
              </p>
            )}
          </Form>
        </ModalBody>
        <ModalFooter>
          <RenderDefaultButton
            label={isEditing ? 'Cancel' : 'Done'}
            onClick={closeModal}
            disabled={isPending}
          />
          <RenderPrimaryButton
            label={
              isPending
                ? 'Saving...'
                : isEditing
                  ? 'Save changes'
                  : 'Save & add another'
            }
            icon={isEditing ? 'bi-check-lg' : 'bi-plus-lg'}
            onClick={handleSubmit}
            disabled={isPending}
          />
        </ModalFooter>
      </Modal>
    );
  };

  if (savingsQuery.isLoading) {
    return (
      <Container fluid className="py-4">
        <p>Loading savings…</p>
      </Container>
    );
  }
  if (!savings) {
    return (
      <Container fluid className="py-4">
        <p className="text-danger">Savings account not found.</p>
        <Link to="/assets">Back to assets</Link>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 mortgage-detail-page">
      {renderHeader()}
      {renderSavingsSummary()}
      {renderTabs()}
      <TabContent activeTab={activeTab}>
        <TabPane tabId="overview" className="overview-pane">
          {activeTab === 'overview' && (
            <Row className="g-3">
              <Col xl={4}>{renderYearlyCards()}</Col>
              <Col xl={8}>
                {renderBalanceChart()}
                {renderMonthlyChart()}
              </Col>
            </Row>
          )}
        </TabPane>
        <TabPane tabId="line-items" className="line-items-pane">
          {activeTab === 'line-items' && renderHistory()}
        </TabPane>
      </TabContent>
      {renderTransactionModal()}
    </Container>
  );
}
