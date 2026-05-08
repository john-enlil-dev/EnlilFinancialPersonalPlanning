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
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { categoriesApi } from '../api/categories';
import { mortgageDebtsApi } from '../api/mortgage-debts';
import { queryKeys } from '../api/query-keys';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../UI/functions/render-skeleton-button-functions';
import type { CreateMortgagePaymentRequest, MortgagePayment } from '../types/api';
import { CategoryDirection, LOAN_TYPE_LABELS } from '../types/enums';

const COMPONENTS = ['Principal', 'Interest', 'Escrow', 'Extra Principal'] as const;
type ComponentName = (typeof COMPONENTS)[number];

const COMPONENT_COLORS: Record<ComponentName, string> = {
  Principal: '#22c55e',
  Interest: '#ef4444',
  Escrow: '#f59e0b',
  'Extra Principal': '#8b5cf6',
};

interface AmountForm {
  Principal: string;
  Interest: string;
  Escrow: string;
  'Extra Principal': string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const blankAmounts: AmountForm = {
  Principal: '',
  Interest: '',
  Escrow: '',
  'Extra Principal': '',
};

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function bucketComponent(raw: string | null): ComponentName | 'Other' {
  if (!raw) return 'Other';
  const normalized = raw.trim().toLowerCase();
  for (const c of COMPONENTS) {
    if (c.toLowerCase() === normalized) return c;
  }
  return 'Other';
}

// Inclusive range of "YYYY-MM" strings between two month markers.
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

export default function MortgageDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const queryClient = useQueryClient();

  type TabKey = 'overview' | 'line-items';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLineItemUid, setEditingLineItemUid] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayIso());
  const [billingMonth, setBillingMonth] = useState<string>(''); // "YYYY-MM" from <input type="month">
  const [description, setDescription] = useState<string>('');
  const [categoryUid, setCategoryUid] = useState<string>('');
  const [amounts, setAmounts] = useState<AmountForm>(blankAmounts);
  const [balanceAfter, setBalanceAfter] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = editingLineItemUid !== null;

  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.mortgageDebts.detail(uid ?? ''),
        queryFn: () => mortgageDebtsApi.get(uid!),
        enabled: !!uid,
      },
      {
        queryKey: queryKeys.mortgageDebts.payments(uid ?? ''),
        queryFn: () => mortgageDebtsApi.listPayments(uid!),
        enabled: !!uid,
      },
      {
        queryKey: queryKeys.categories.list(false),
        queryFn: () => categoriesApi.list(false),
      },
    ],
  });

  const [mortgageQuery, paymentsQuery, categoriesQuery] = queries;
  const mortgage = mortgageQuery.data;
  const payments: MortgagePayment[] = paymentsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          (c.direction === CategoryDirection.Expense || c.direction === CategoryDirection.Both) &&
          !c.isArchived,
      ),
    [categories],
  );

  // Pre-pick a category once categories load (default to first eligible).
  useEffect(() => {
    if (!categoryUid && expenseCategories.length > 0) {
      setCategoryUid(expenseCategories[0]!.uid);
    }
  }, [categoryUid, expenseCategories]);

  const invalidatePaymentQueries = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.mortgageDebts.payments(uid!) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.mortgageDebts.detail(uid!) });
  };

  const createMutation = useMutation({
    mutationFn: (request: CreateMortgagePaymentRequest) =>
      mortgageDebtsApi.createPayment(uid!, request),
    onSuccess: () => {
      invalidatePaymentQueries();
      // Clear amounts + balance, advance date and billing month by one month,
      // keep category + description for fast back-fill.
      setAmounts(blankAmounts);
      setBalanceAfter('');
      setDate((current) => addMonths(current, 1));
      setBillingMonth((current) => (current ? addMonths(`${current}-01`, 1).slice(0, 7) : ''));
      setSubmitError(null);
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ lineItemUid, request }: { lineItemUid: string; request: CreateMortgagePaymentRequest }) =>
      mortgageDebtsApi.updatePayment(uid!, lineItemUid, request),
    onSuccess: () => {
      invalidatePaymentQueries();
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const openCreate = () => {
    setEditingLineItemUid(null);
    setDate(todayIso());
    setBillingMonth('');
    setDescription('');
    setAmounts(blankAmounts);
    setBalanceAfter('');
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (payment: MortgagePayment) => {
    setEditingLineItemUid(payment.lineItemUID);
    setDate(payment.date);
    setBillingMonth(payment.billingMonth ? payment.billingMonth.slice(0, 7) : '');
    setDescription(payment.description ?? '');
    setCategoryUid(payment.categoryUID);
    const seeded: AmountForm = { ...blankAmounts };
    for (const a of payment.allocations) {
      const bucket = bucketComponent(a.componentType);
      if (bucket !== 'Other') {
        seeded[bucket] = String(a.amount);
      }
    }
    setAmounts(seeded);
    setBalanceAfter('');
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLineItemUid(null);
    setSubmitError(null);
  };

  const handleSubmit = () => {
    if (!uid || !categoryUid) {
      setSubmitError('Pick a category before saving.');
      return;
    }
    const allocations = COMPONENTS
      .map((c) => ({ componentType: c, amount: Number(amounts[c]) || 0 }))
      .filter((a) => a.amount > 0);
    if (allocations.length === 0) {
      setSubmitError('Enter at least one amount.');
      return;
    }
    const balanceTrimmed = balanceAfter.trim();
    const balanceAfterPayment = balanceTrimmed === '' ? null : Number(balanceTrimmed);
    if (balanceTrimmed !== '' && Number.isNaN(balanceAfterPayment)) {
      setSubmitError('Balance after payment must be a number.');
      return;
    }
    const request: CreateMortgagePaymentRequest = {
      date,
      categoryUID: categoryUid,
      description: description || null,
      allocations,
      billingMonth: billingMonth ? `${billingMonth}-01` : null,
      balanceAfterPayment,
    };
    if (isEditing && editingLineItemUid) {
      updateMutation.mutate({ lineItemUid: editingLineItemUid, request });
    } else {
      createMutation.mutate(request);
    }
  };

  // Aggregations -------------------------------------------------------------

  const totals = useMemo(() => {
    const acc: Record<ComponentName | 'Other' | 'Total', number> = {
      Principal: 0,
      Interest: 0,
      Escrow: 0,
      'Extra Principal': 0,
      Other: 0,
      Total: 0,
    };
    for (const p of payments) {
      for (const a of p.allocations) {
        const bucket = bucketComponent(a.componentType);
        acc[bucket] += a.amount;
        acc.Total += a.amount;
      }
    }
    return acc;
  }, [payments]);

  const avgMonthly = payments.length === 0 ? 0 : totals.Total / payments.length;

  const monthlyChartData = useMemo(() => {
    const byMonth = new Map<string, Record<ComponentName, number>>();
    for (const p of payments) {
      // Prefer billingMonth (YYYY-MM-01) when set so payments dated 11/30 attributed
      // to December bucket as 2024-12 rather than 2024-11.
      const month = (p.billingMonth ?? p.date).slice(0, 7);
      let bucket = byMonth.get(month);
      if (!bucket) {
        bucket = { Principal: 0, Interest: 0, Escrow: 0, 'Extra Principal': 0 };
        byMonth.set(month, bucket);
      }
      for (const a of p.allocations) {
        const componentBucket = bucketComponent(a.componentType);
        if (componentBucket !== 'Other') {
          bucket[componentBucket] += a.amount;
        }
      }
    }
    if (byMonth.size === 0) return [];
    // Fill in every month between the earliest and latest with zeros so missing
    // months render as blank bars instead of being collapsed off the timeline.
    const sortedMonths = [...byMonth.keys()].sort();
    const allMonths = generateMonthRange(sortedMonths[0]!, sortedMonths[sortedMonths.length - 1]!);
    return allMonths.map((month) => ({
      month,
      ...(byMonth.get(month) ?? { Principal: 0, Interest: 0, Escrow: 0, 'Extra Principal': 0 }),
    }));
  }, [payments]);

  const yearOverYear = useMemo(() => {
    const byYear = new Map<string, Record<ComponentName | 'Other' | 'Total', number>>();
    for (const p of payments) {
      const year = (p.billingMonth ?? p.date).slice(0, 4);
      const row =
        byYear.get(year) ??
        ({ Principal: 0, Interest: 0, Escrow: 0, 'Extra Principal': 0, Other: 0, Total: 0 } as Record<
          ComponentName | 'Other' | 'Total',
          number
        >);
      for (const a of p.allocations) {
        const bucket = bucketComponent(a.componentType);
        row[bucket] += a.amount;
        row.Total += a.amount;
      }
      byYear.set(year, row);
    }
    return Array.from(byYear.entries())
      .map(([year, row]) => ({ year, ...row }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [payments]);

  // Renders -----------------------------------------------------------------

  const renderHeader = () => {
    const subtitle = mortgage
      ? `${LOAN_TYPE_LABELS[mortgage.loanType]} · ${(mortgage.interestRate * 100).toFixed(3)}% · ${mortgage.termMonths} mo`
      : 'Loading...';
    return (
      <RenderPageHeader
        title={mortgage?.name ?? 'Mortgage'}
        subtitle={subtitle}
        rightContent={
          <>
            <Link to="/liabilities" className="text-decoration-none">
              <RenderDefaultButton label="Back" icon="bi-arrow-left" />
            </Link>
            <RenderPrimaryButton label="Add payment" icon="bi-plus-lg" onClick={openCreate} />
          </>
        }
      />
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

  const renderMortgageSummary = () => {
    if (!mortgage) return null;
    const principalPct =
      mortgage.originalPrincipal > 0
        ? (totals.Principal + totals['Extra Principal']) / mortgage.originalPrincipal
        : 0;
    const interestPctOfTotal = totals.Total > 0 ? totals.Interest / totals.Total : 0;

    const stat = (
      label: string,
      value: React.ReactNode,
      color?: string,
      subtitle?: string,
    ) => (
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
            {/* Row 1 — column 1 anchor: Original principal */}
            {stat('Original principal', fmt(mortgage.originalPrincipal))}
            {stat('Start date', mortgage.startDate)}
            {stat('Institution', mortgage.institution ?? '—')}
            {stat('Total Paid (lifetime)', fmt(totals.Total))}
            {stat('Avg Monthly', fmt(avgMonthly))}
            {/* Row 2 — column 1 anchor: Current balance */}
            {stat('Current balance', fmt(mortgage.currentBalance))}
            {stat(
              'Total Principal',
              fmt(totals.Principal + totals['Extra Principal']),
              COMPONENT_COLORS.Principal,
              `principal + extra · extra: ${fmt(totals['Extra Principal'])}`,
            )}
            {stat('Total Interest', fmt(totals.Interest), COMPONENT_COLORS.Interest)}
            {stat('Total Escrow', fmt(totals.Escrow), COMPONENT_COLORS.Escrow)}
            {stat(
              'Principal paid down',
              `${(principalPct * 100).toFixed(1)}%`,
              undefined,
              totals.Total > 0
                ? `interest ${(interestPctOfTotal * 100).toFixed(1)}% of payments`
                : undefined,
            )}
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderYearlyCards = () => {
    if (yearOverYear.length === 0) {
      return (
        <Card className="mb-3">
          <CardBody className="py-2">
            <span className="stat-card-label">Yearly totals</span>
            <p className="text-muted small mb-0 mt-2">
              Per-year breakdown appears here once payments are recorded.
            </p>
          </CardBody>
        </Card>
      );
    }
    return (
      <div className="year-cards-scroll">
        <Row className="g-3">
          {yearOverYear.map((row) => {
          const totalPrincipal = row.Principal + row['Extra Principal'];
          return (
            <Col xs={12} key={row.year}>
              <Card>
                <CardBody className="py-2">
                  <div className="d-flex justify-content-between align-items-baseline mb-2">
                    <span className="stat-card-label">{row.year}</span>
                    <strong className="fs-5">{fmt(row.Total)}</strong>
                  </div>
                  <div className="year-card-breakdown">
                    <div>
                      <span className="year-cell-label">Principal</span>
                      <span className="year-cell-value" style={{ color: COMPONENT_COLORS.Principal }}>
                        {fmt(totalPrincipal)}
                      </span>
                      {row['Extra Principal'] > 0 && (
                        <span className="year-cell-extra">+{fmt(row['Extra Principal'])} extra</span>
                      )}
                    </div>
                    <div>
                      <span className="year-cell-label">Interest</span>
                      <span className="year-cell-value" style={{ color: COMPONENT_COLORS.Interest }}>
                        {fmt(row.Interest)}
                      </span>
                    </div>
                    <div>
                      <span className="year-cell-label">Escrow</span>
                      <span className="year-cell-value" style={{ color: COMPONENT_COLORS.Escrow }}>
                        {fmt(row.Escrow)}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          );
        })}
        </Row>
      </div>
    );
  };

  // Derived principal-balance trajectory, bucketed by month so the timeline lines
  // up with the monthly-payments bar chart. Anchor at (currentAsOfDate, currentBalance)
  // then walk newest→oldest, adding back each payment's principal+extra-principal so
  // we recover what the balance was at every prior payment date. For each month, take
  // the LAST balance recorded in that month. Months with no payments stay undefined
  // so Recharts renders them as blanks (gaps) on the line.
  const balanceTrajectory = useMemo(() => {
    if (!mortgage) return [];
    const validPayments = payments.filter((p) => p.date <= mortgage.currentAsOfDate);
    const sortedDesc = [...validPayments].sort((a, b) => b.date.localeCompare(a.date));

    // Walk back, recording (date → balance just after that point).
    const balanceAtDate = new Map<string, number>();
    let runningBalance = mortgage.currentBalance;
    balanceAtDate.set(mortgage.currentAsOfDate, runningBalance);
    for (const p of sortedDesc) {
      const principalSum = p.allocations.reduce((sum, a) => {
        const bucket = bucketComponent(a.componentType);
        return bucket === 'Principal' || bucket === 'Extra Principal' ? sum + a.amount : sum;
      }, 0);
      balanceAtDate.set(p.date, runningBalance);
      runningBalance += principalSum;
    }

    // Bucket by month — last balance recorded in each calendar month wins.
    const balanceByMonth = new Map<string, number>();
    const sortedDates = [...balanceAtDate.keys()].sort();
    for (const date of sortedDates) {
      balanceByMonth.set(date.slice(0, 7), balanceAtDate.get(date)!);
    }
    if (balanceByMonth.size === 0) return [];

    const sortedMonths = [...balanceByMonth.keys()].sort();
    const allMonths = generateMonthRange(sortedMonths[0]!, sortedMonths[sortedMonths.length - 1]!);
    return allMonths.map((month) => ({
      month,
      // undefined for months with no recorded balance — Recharts breaks the line
      // at undefined values, giving the visual "blank" the user asked for.
      balance: balanceByMonth.get(month),
    }));
  }, [mortgage, payments]);

  const renderBalanceChart = () => {
    if (!mortgage) return null;
    if (balanceTrajectory.length <= 1) {
      return (
        <Card className="mb-4 h-100">
          <CardBody>
            <CardTitle tag="h5">Principal balance over time</CardTitle>
            <p className="text-muted mb-0">
              Record payments with their Principal allocations and the chart will rebuild itself —
              the line is derived from current balance plus payment history.
            </p>
          </CardBody>
        </Card>
      );
    }
    return (
      <Card className="mb-3">
        <CardBody className="py-2">
          <div className="d-flex justify-content-between align-items-baseline mb-1">
            <CardTitle tag="h6" className="mb-0">Principal balance over time</CardTitle>
            <small className="text-muted">
              from {fmt(mortgage.currentBalance)} · {balanceTrajectory.length - 1} payment
              {balanceTrajectory.length - 1 === 1 ? '' : 's'}
            </small>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={balanceTrajectory} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.55)" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="rgba(255,255,255,0.55)"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#20242c', border: '1px solid #6b21a8' }}
                  formatter={(value: number) => fmt(value)}
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

  const renderChart = () => {
    if (monthlyChartData.length === 0) {
      return (
        <Card className="mb-4 h-100">
          <CardBody>
            <CardTitle tag="h5">Monthly payments</CardTitle>
            <p className="text-muted mb-0">Add a payment below to start populating the chart.</p>
          </CardBody>
        </Card>
      );
    }
    return (
      <Card className="mb-3">
        <CardBody className="py-2">
          <CardTitle tag="h6" className="mb-1">Monthly payments</CardTitle>
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
                <Tooltip
                  cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                  contentStyle={{ backgroundColor: '#20242c', border: '1px solid #6b21a8' }}
                  formatter={(value: number) => fmt(value)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {COMPONENTS.map((c) => (
                  <Bar key={c} dataKey={c} stackId="1" fill={COMPONENT_COLORS[c]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    );
  };

  const renderPaymentModal = () => {
    const isPending = createMutation.isPending || updateMutation.isPending;
    return (
      <Modal isOpen={modalOpen} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>{isEditing ? 'Edit payment' : 'Add payment'}</ModalHeader>
        <ModalBody>
          <Form>
            <Row className="g-2">
              <FormGroup className="col-md-3">
                <Label for="pay-date">Payment date</Label>
                <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </FormGroup>
              <FormGroup className="col-md-3">
                <Label for="pay-billing-month">
                  Billing month <span className="text-muted">(optional)</span>
                </Label>
                <Input
                  id="pay-billing-month"
                  type="month"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                />
              </FormGroup>
              <FormGroup className="col-md-3">
                <Label for="pay-category">Category</Label>
                <Input
                  id="pay-category"
                  type="select"
                  value={categoryUid}
                  onChange={(e) => setCategoryUid(e.target.value)}
                >
                  {expenseCategories.length === 0 && <option value="">No expense categories</option>}
                  {expenseCategories.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      {c.name}
                    </option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup className="col-md-3">
                <Label>Total</Label>
                <Input
                  disabled
                  value={fmt(
                    COMPONENTS.reduce((sum, c) => sum + (Number(amounts[c]) || 0), 0),
                  )}
                />
              </FormGroup>
              <FormGroup className="col-12">
                <Label for="pay-description">Description (optional)</Label>
                <Input
                  id="pay-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., March 2024 mortgage payment"
                />
              </FormGroup>
              {COMPONENTS.map((c) => (
                <FormGroup className="col-md-4 col-lg" key={c}>
                  <Label for={`pay-${c}`}>{c}</Label>
                  <Input
                    id={`pay-${c}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amounts[c]}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [c]: e.target.value }))}
                  />
                </FormGroup>
              ))}
              <FormGroup className="col-12">
                <Label for="pay-balance">
                  Balance after this payment <span className="text-muted">(optional)</span>
                </Label>
                <Input
                  id="pay-balance"
                  type="number"
                  step="0.01"
                  placeholder="Leave blank to skip — fill in to record principal at this date for the over-time chart."
                  value={balanceAfter}
                  onChange={(e) => setBalanceAfter(e.target.value)}
                />
              </FormGroup>
            </Row>
            {submitError && <p className="text-danger mt-2 mb-0">{submitError}</p>}
            {!isEditing && (
              <p className="text-muted small mt-3 mb-0">
                Tip: after saving, the dates advance one month and the form keeps your category &amp; description so
                you can keep adding without reopening.
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

  const renderHistory = () => (
    <Card className="mb-0">
      <CardBody>
        <CardTitle tag="h5">Payment history (newest first)</CardTitle>
        {payments.length === 0 ? (
          <p className="text-muted mb-0">No payments recorded yet.</p>
        ) : (
          <Table hover responsive size="sm" className="mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Billing month</th>
                <th>Description</th>
                <th>Category</th>
                <th className="text-end">Principal</th>
                <th className="text-end">Interest</th>
                <th className="text-end">Escrow</th>
                <th className="text-end">Extra</th>
                <th className="text-end">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const buckets: Record<ComponentName | 'Other', number> = {
                  Principal: 0,
                  Interest: 0,
                  Escrow: 0,
                  'Extra Principal': 0,
                  Other: 0,
                };
                for (const a of p.allocations) {
                  buckets[bucketComponent(a.componentType)] += a.amount;
                }
                return (
                  <tr key={p.lineItemUID}>
                    <td>{p.date}</td>
                    <td>{p.billingMonth ? p.billingMonth.slice(0, 7) : '—'}</td>
                    <td>{p.description ?? '—'}</td>
                    <td>{p.categoryName}</td>
                    <td className="text-end">{fmt(buckets.Principal)}</td>
                    <td className="text-end">{fmt(buckets.Interest)}</td>
                    <td className="text-end">{fmt(buckets.Escrow)}</td>
                    <td className="text-end">{fmt(buckets['Extra Principal'])}</td>
                    <td className="text-end fw-semibold">{fmt(p.totalAmount)}</td>
                    <td>
                      <RenderDefaultButton
                        label="Edit"
                        icon="bi-pencil-square"
                        onClick={() => openEdit(p)}
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

  if (mortgageQuery.isLoading) {
    return (
      <Container fluid className="py-4">
        <p>Loading mortgage…</p>
      </Container>
    );
  }
  if (!mortgage) {
    return (
      <Container fluid className="py-4">
        <p className="text-danger">Mortgage not found.</p>
        <Link to="/liabilities">Back to liabilities</Link>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 mortgage-detail-page">
      {renderHeader()}
      {renderMortgageSummary()}
      {renderTabs()}
      <TabContent activeTab={activeTab}>
        <TabPane tabId="overview" className="overview-pane">
          {activeTab === 'overview' && (
            <Row className="g-3">
              <Col xl={5}>{renderYearlyCards()}</Col>
              <Col xl={7}>
                {renderBalanceChart()}
                {renderChart()}
              </Col>
            </Row>
          )}
        </TabPane>
        <TabPane tabId="line-items" className="line-items-pane">
          {activeTab === 'line-items' && renderHistory()}
        </TabPane>
      </TabContent>
      {renderPaymentModal()}
    </Container>
  );
}
