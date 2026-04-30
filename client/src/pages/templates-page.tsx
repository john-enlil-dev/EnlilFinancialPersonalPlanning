import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
} from 'reactstrap';
import { categoriesApi } from '../api/categories';
import { recurringTemplatesApi } from '../api/recurring-templates';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../UI/functions/render-skeleton-button-functions';
import type {
  Category,
  CreateRecurringTemplateRequest,
  RecurringTemplate,
  UpdateRecurringTemplateRequest,
} from '../types/api';
import {
  CADENCE_LABELS,
  Cadence,
  CategoryDirection,
  DAY_OF_WEEK_LABELS,
  DIRECTION_LABELS,
  DayOfWeek,
  Direction,
} from '../types/enums';

interface FormState {
  name: string;
  direction: Direction;
  categoryUID: string;
  amount: string;
  description: string;
  startDate: string;
  endDate: string;
  cadence: Cadence;
  dayOfMonth: string;
  useLastDayOfMonth: boolean;
  dayOfWeek: DayOfWeek | '';
  monthOfQuarter: number | '';
  monthOfYear: number | '';
  intervalDays: string;
}

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const blankForm = (): FormState => ({
  name: '',
  direction: Direction.Expense,
  categoryUID: '',
  amount: '',
  description: '',
  startDate: todayIso(),
  endDate: '',
  cadence: Cadence.Monthly,
  dayOfMonth: '1',
  useLastDayOfMonth: false,
  dayOfWeek: '',
  monthOfQuarter: '',
  monthOfYear: '',
  intervalDays: '',
});

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const summarizeCadence = (t: RecurringTemplate): string => {
  switch (t.cadence) {
    case Cadence.Daily:
      return 'Daily';
    case Cadence.Weekly:
      return t.dayOfWeek !== null ? `Weekly on ${DAY_OF_WEEK_LABELS[t.dayOfWeek]}` : 'Weekly';
    case Cadence.BiWeekly:
      return t.dayOfWeek !== null ? `Bi-weekly on ${DAY_OF_WEEK_LABELS[t.dayOfWeek]}` : 'Bi-weekly';
    case Cadence.Monthly:
      return t.useLastDayOfMonth ? 'Monthly on last day' : `Monthly on day ${t.dayOfMonth ?? '?'}`;
    case Cadence.Quarterly: {
      const day = t.useLastDayOfMonth ? 'last day' : `day ${t.dayOfMonth ?? '?'}`;
      return `Quarterly, month ${t.monthOfQuarter ?? '?'} of quarter, ${day}`;
    }
    case Cadence.Annually: {
      const month = t.monthOfYear ? MONTH_LABELS[t.monthOfYear - 1] : '?';
      const day = t.useLastDayOfMonth ? 'last day' : `day ${t.dayOfMonth ?? '?'}`;
      return `Annually on ${month} ${day}`;
    }
    case Cadence.CustomDays:
      return `Every ${t.intervalDays ?? '?'} days`;
    default:
      return 'Unknown';
  }
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<RecurringTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tpls, cats] = await Promise.all([recurringTemplatesApi.list(), categoriesApi.list(false)]);
      setTemplates(tpls);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const eligibleCategories = useMemo(() => {
    return categories.filter((c) => {
      if (form.direction === Direction.Income)
        return c.direction === CategoryDirection.Income || c.direction === CategoryDirection.Both;
      return c.direction === CategoryDirection.Expense || c.direction === CategoryDirection.Both;
    });
  }, [categories, form.direction]);

  const startCreate = () => {
    setForm(blankForm());
    setEditing(null);
    setCreating(true);
  };

  const startEdit = (t: RecurringTemplate) => {
    setForm({
      name: t.name,
      direction: t.direction,
      categoryUID: t.categoryUID,
      amount: t.amount.toString(),
      description: t.description ?? '',
      startDate: t.startDate,
      endDate: t.endDate ?? '',
      cadence: t.cadence,
      dayOfMonth: t.dayOfMonth?.toString() ?? '',
      useLastDayOfMonth: t.useLastDayOfMonth,
      dayOfWeek: t.dayOfWeek ?? '',
      monthOfQuarter: t.monthOfQuarter ?? '',
      monthOfYear: t.monthOfYear ?? '',
      intervalDays: t.intervalDays?.toString() ?? '',
    });
    setEditing(t);
    setCreating(false);
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
  };

  const submit = async () => {
    if (!form.categoryUID) {
      setError('Pick a category');
      return;
    }

    const payload: CreateRecurringTemplateRequest = {
      name: form.name,
      direction: form.direction,
      categoryUID: form.categoryUID,
      amount: Number(form.amount),
      description: form.description || null,
      startDate: form.startDate,
      endDate: form.endDate || null,
      cadence: form.cadence,
      dayOfMonth: form.useLastDayOfMonth || form.dayOfMonth === '' ? null : Number(form.dayOfMonth),
      useLastDayOfMonth: form.useLastDayOfMonth,
      dayOfWeek: form.dayOfWeek === '' ? null : form.dayOfWeek,
      monthOfQuarter: form.monthOfQuarter === '' ? null : form.monthOfQuarter,
      monthOfYear: form.monthOfYear === '' ? null : form.monthOfYear,
      intervalDays: form.intervalDays === '' ? null : Number(form.intervalDays),
    };

    try {
      if (creating) {
        await recurringTemplatesApi.create(payload);
      } else if (editing) {
        await recurringTemplatesApi.update(editing.uid, payload as UpdateRecurringTemplateRequest);
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const renderDayOfMonthBlock = () => (
    <>
      <FormGroup>
        <Label for="dayOfMonth">Day of month</Label>
        <Input
          id="dayOfMonth"
          type="select"
          value={form.dayOfMonth}
          disabled={form.useLastDayOfMonth}
          onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
        >
          <option value="">—</option>
          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Input>
      </FormGroup>
      <FormGroup check className="mb-3">
        <Input
          id="useLastDay"
          type="checkbox"
          checked={form.useLastDayOfMonth}
          onChange={(e) =>
            setForm({
              ...form,
              useLastDayOfMonth: e.target.checked,
              dayOfMonth: e.target.checked ? '' : '1',
            })
          }
        />
        <Label for="useLastDay" check>
          Use last day of month (handles 29/30/31 cases)
        </Label>
      </FormGroup>
    </>
  );

  const renderDayOfWeekBlock = () => (
    <FormGroup>
      <Label for="dayOfWeek">Day of week</Label>
      <Input
        id="dayOfWeek"
        type="select"
        value={form.dayOfWeek}
        onChange={(e) =>
          setForm({
            ...form,
            dayOfWeek: e.target.value === '' ? '' : (Number(e.target.value) as DayOfWeek),
          })
        }
      >
        <option value="">Pick a day...</option>
        {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Input>
    </FormGroup>
  );

  const renderMonthOfQuarterBlock = () => (
    <FormGroup>
      <Label for="monthOfQuarter">Month of quarter</Label>
      <Input
        id="monthOfQuarter"
        type="select"
        value={form.monthOfQuarter}
        onChange={(e) =>
          setForm({
            ...form,
            monthOfQuarter: e.target.value === '' ? '' : Number(e.target.value),
          })
        }
      >
        <option value="">—</option>
        <option value={1}>1 (Jan / Apr / Jul / Oct)</option>
        <option value={2}>2 (Feb / May / Aug / Nov)</option>
        <option value={3}>3 (Mar / Jun / Sep / Dec)</option>
      </Input>
    </FormGroup>
  );

  const renderMonthOfYearBlock = () => (
    <FormGroup>
      <Label for="monthOfYear">Month of year</Label>
      <Input
        id="monthOfYear"
        type="select"
        value={form.monthOfYear}
        onChange={(e) =>
          setForm({
            ...form,
            monthOfYear: e.target.value === '' ? '' : Number(e.target.value),
          })
        }
      >
        <option value="">—</option>
        {MONTH_LABELS.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </Input>
    </FormGroup>
  );

  const renderIntervalDaysBlock = () => (
    <FormGroup>
      <Label for="intervalDays">Interval (days)</Label>
      <Input
        id="intervalDays"
        type="number"
        min="1"
        value={form.intervalDays}
        onChange={(e) => setForm({ ...form, intervalDays: e.target.value })}
      />
    </FormGroup>
  );

  const renderCadenceFields = () => {
    switch (form.cadence) {
      case Cadence.Daily:
        return null;
      case Cadence.Weekly:
      case Cadence.BiWeekly:
        return renderDayOfWeekBlock();
      case Cadence.Monthly:
        return renderDayOfMonthBlock();
      case Cadence.Quarterly:
        return (
          <>
            {renderMonthOfQuarterBlock()}
            {renderDayOfMonthBlock()}
          </>
        );
      case Cadence.Annually:
        return (
          <>
            {renderMonthOfYearBlock()}
            {renderDayOfMonthBlock()}
          </>
        );
      case Cadence.CustomDays:
        return renderIntervalDaysBlock();
      default:
        return null;
    }
  };

  const renderModal = () => {
    const isOpen = creating || editing !== null;
    return (
      <Modal isOpen={isOpen} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {creating ? 'New recurring template' : 'Edit recurring template'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rent, Mortgage, Salary..."
              />
            </FormGroup>
            <FormGroup>
              <Label for="direction">Direction</Label>
              <Input
                id="direction"
                type="select"
                value={form.direction}
                onChange={(e) =>
                  setForm({
                    ...form,
                    direction: Number(e.target.value) as Direction,
                    categoryUID: '',
                  })
                }
              >
                {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Input>
            </FormGroup>
            <FormGroup>
              <Label for="category">Category</Label>
              <Input
                id="category"
                type="select"
                value={form.categoryUID}
                onChange={(e) => setForm({ ...form, categoryUID: e.target.value })}
              >
                <option value="">Pick one...</option>
                {eligibleCategories.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name}
                  </option>
                ))}
              </Input>
            </FormGroup>
            <FormGroup>
              <Label for="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="description">Description</Label>
              <Input
                id="description"
                type="textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="endDate">End date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </FormGroup>
            <hr />
            <FormGroup>
              <Label for="cadence">Cadence</Label>
              <Input
                id="cadence"
                type="select"
                value={form.cadence}
                onChange={(e) => setForm({ ...form, cadence: Number(e.target.value) as Cadence })}
              >
                {Object.entries(CADENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Input>
            </FormGroup>
            {renderCadenceFields()}
          </Form>
        </ModalBody>
        <ModalFooter>
          <RenderDefaultButton label="Cancel" onClick={closeModal} />
          <RenderPrimaryButton label="Save" onClick={() => void submit()} />
        </ModalFooter>
      </Modal>
    );
  };

  const renderHeader = () => (
    <div className="d-flex align-items-center mb-3">
      <h1 className="me-auto mb-0">Recurring templates</h1>
      <RenderPrimaryButton label="New template" onClick={startCreate} />
    </div>
  );

  const renderTable = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (templates.length === 0) return <p className="text-muted">No recurring templates yet.</p>;

    return (
      <Table hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Direction</th>
            <th className="text-end">Amount</th>
            <th>Schedule</th>
            <th>Start</th>
            <th>End</th>
            <th>Category</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => {
            const isIncome = t.direction === Direction.Income;
            return (
              <tr key={t.uid}>
                <td className="fw-semibold">{t.name}</td>
                <td>
                  <Badge color={isIncome ? 'success' : 'danger'} pill>
                    {DIRECTION_LABELS[t.direction]}
                  </Badge>
                </td>
                <td className={`text-end fw-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
                  {isIncome ? '+' : '−'}
                  {t.amount.toFixed(2)}
                </td>
                <td>{summarizeCadence(t)}</td>
                <td>{t.startDate}</td>
                <td>{t.endDate ?? '—'}</td>
                <td>{t.categoryName}</td>
                <td>
                  <RenderDefaultButton label="Edit" onClick={() => startEdit(t)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  return (
    <Container className="py-4">
      {renderHeader()}
      {renderTable()}
      {renderModal()}
    </Container>
  );
}
