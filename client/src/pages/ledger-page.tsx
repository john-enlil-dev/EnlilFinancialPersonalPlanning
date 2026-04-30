import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
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
  Row,
  Table,
} from 'reactstrap';
import { categoriesApi } from '../api/categories';
import { lineItemsApi } from '../api/line-items';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../UI/functions/render-skeleton-button-functions';
import type {
  Category,
  CreateLineItemRequest,
  LineItem,
  UpdateLineItemRequest,
} from '../types/api';
import { CategoryDirection, DIRECTION_LABELS, Direction } from '../types/enums';

interface FormState {
  direction: Direction;
  amount: string;
  date: string;
  description: string;
  categoryUID: string;
}

const toIsoDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const todayIso = (): string => toIsoDate(new Date());

const currentMonthRange = (): { from: string; to: string } => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toIsoDate(first), to: toIsoDate(last) };
};

const blankForm = (): FormState => ({
  direction: Direction.Expense,
  amount: '',
  date: todayIso(),
  description: '',
  categoryUID: '',
});

export default function LedgerPage() {
  const [items, setItems] = useState<LineItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDirection, setFilterDirection] = useState<Direction | ''>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState<string>(() => currentMonthRange().from);
  const [filterTo, setFilterTo] = useState<string>(() => currentMonthRange().to);

  const [editing, setEditing] = useState<LineItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [li, cats] = await Promise.all([
        lineItemsApi.list({
          direction: filterDirection === '' ? undefined : filterDirection,
          categoryUID: filterCategory || undefined,
          fromDate: filterFrom || undefined,
          toDate: filterTo || undefined,
        }),
        categoriesApi.list(false),
      ]);
      // Newest first. Tiebreak by UID for stable order on same-date rows.
      const sorted = [...li].sort((a, b) => {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return a.uid.localeCompare(b.uid);
      });
      setItems(sorted);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filterDirection, filterCategory, filterFrom, filterTo]);

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

  const startEdit = (li: LineItem) => {
    setForm({
      direction: li.direction,
      amount: li.amount.toString(),
      date: li.date,
      description: li.description ?? '',
      categoryUID: li.categoryUID,
    });
    setEditing(li);
    setCreating(false);
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
  };

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.categoryUID) {
      setError('Pick a category');
      return;
    }
    try {
      const payload: CreateLineItemRequest = {
        direction: form.direction,
        amount,
        date: form.date,
        description: form.description || null,
        categoryUID: form.categoryUID,
      };
      if (creating) {
        await lineItemsApi.create(payload);
      } else if (editing) {
        await lineItemsApi.update(editing.uid, payload as UpdateLineItemRequest);
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const renderFilters = () => (
    <Row className="mb-3 g-2 align-items-end">
      <Col md="2">
        <Label for="filter-from">From</Label>
        <Input
          id="filter-from"
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
        />
      </Col>
      <Col md="2">
        <Label for="filter-to">To</Label>
        <Input
          id="filter-to"
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
        />
      </Col>
      <Col md="2">
        <Label for="filter-direction">Direction</Label>
        <Input
          id="filter-direction"
          type="select"
          value={filterDirection}
          onChange={(e) => {
            const v = e.target.value;
            setFilterDirection(v === '' ? '' : (Number(v) as Direction));
          }}
        >
          <option value="">All</option>
          {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Input>
      </Col>
      <Col md="3">
        <Label for="filter-category">Category</Label>
        <Input
          id="filter-category"
          type="select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.uid} value={c.uid}>
              {c.name}
            </option>
          ))}
        </Input>
      </Col>
    </Row>
  );

  const renderModal = () => {
    const isOpen = creating || editing !== null;
    return (
      <Modal isOpen={isOpen} toggle={closeModal}>
        <ModalHeader toggle={closeModal}>{creating ? 'New line item' : 'Edit line item'}</ModalHeader>
        <ModalBody>
          <Form>
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
              <Label for="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
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
              <Label for="description">Description</Label>
              <Input
                id="description"
                type="textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormGroup>
            {editing?.sourceTemplateUID && (
              <p className="text-muted small mb-0">
                Seeded from template: <strong>{editing.sourceTemplateName}</strong>. Saving will mark this row as
                manually edited so future template re-seeds skip it.
              </p>
            )}
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
      <h1 className="me-auto mb-0">Ledger</h1>
      <RenderPrimaryButton label="New line item" onClick={startCreate} />
    </div>
  );

  const renderTable = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (items.length === 0) return <p className="text-muted">No line items match the current filters.</p>;

    return (
      <Table hover responsive>
        <thead>
          <tr>
            <th>Date ↓</th>
            <th>Direction</th>
            <th className="text-end">Amount</th>
            <th>Category</th>
            <th>Description</th>
            <th>Source</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((li) => {
            const isIncome = li.direction === Direction.Income;
            return (
              <tr key={li.uid}>
                <td>{li.date}</td>
                <td>
                  <Badge color={isIncome ? 'success' : 'danger'} pill>
                    {DIRECTION_LABELS[li.direction]}
                  </Badge>
                </td>
                <td className={`text-end fw-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
                  {isIncome ? '+' : '−'}
                  {li.amount.toFixed(2)}
                </td>
                <td>{li.categoryName}</td>
                <td>{li.description ?? '—'}</td>
                <td>
                  {li.sourceTemplateName ? (
                    <span title={li.wasManuallyEdited ? 'Manually edited' : 'Auto-seeded'}>
                      {li.sourceTemplateName}
                      {li.wasManuallyEdited && (
                        <Badge color="warning" pill className="ms-2">
                          edited
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">manual</span>
                  )}
                </td>
                <td>
                  <RenderDefaultButton label="Edit" onClick={() => startEdit(li)} />
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
      {renderFilters()}
      {renderTable()}
      {renderModal()}
    </Container>
  );
}
