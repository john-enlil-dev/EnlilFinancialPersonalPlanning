import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  CardBody,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverBody,
  Table,
} from 'reactstrap';
import { categoriesApi } from '../api/categories';
import { lineItemsApi } from '../api/line-items';
import { queryKeys } from '../api/query-keys';
import { CategoryPill } from '../UI/functions/render-category-pill';
import { RenderMultiSelect } from '../UI/functions/render-multi-select';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import {
  RenderDangerButton,
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../UI/functions/render-skeleton-button-functions';
import type {
  CreateLineItemRequest,
  LineItem,
  LineItemLinkage,
  LineItemQuery,
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
  const queryClient = useQueryClient();

  const [filterDirection, setFilterDirection] = useState<Direction | ''>('');
  const [filterCategoryUids, setFilterCategoryUids] = useState<string[]>([]);
  const [filterFrom, setFilterFrom] = useState<string>(() => currentMonthRange().from);
  const [filterTo, setFilterTo] = useState<string>(() => currentMonthRange().to);

  const [editing, setEditing] = useState<LineItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deletingItem, setDeletingItem] = useState<LineItem | null>(null);
  const [linkages, setLinkages] = useState<LineItemLinkage[] | null>(null);
  const [linkagesError, setLinkagesError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadingLinkages, setLoadingLinkages] = useState(false);

  type FilterKey = 'date' | 'direction' | 'category';
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const toggleFilter = (key: FilterKey) =>
    setOpenFilter((cur) => (cur === key ? null : key));
  const closeFilter = () => setOpenFilter(null);

  const defaultRange = currentMonthRange();
  const dateActive = filterFrom !== defaultRange.from || filterTo !== defaultRange.to;
  const directionActive = filterDirection !== '';
  const categoryActive = filterCategoryUids.length > 0;

  const filters: LineItemQuery = {
    direction: filterDirection === '' ? undefined : filterDirection,
    categoryUIDs: filterCategoryUids.length > 0 ? filterCategoryUids : undefined,
    fromDate: filterFrom || undefined,
    toDate: filterTo || undefined,
  };

  const lineItemsQuery = useQuery({
    queryKey: queryKeys.lineItems.list(filters),
    queryFn: () => lineItemsApi.list(filters),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(false),
    queryFn: () => categoriesApi.list(false),
  });

  const items = useMemo(() => {
    const data = lineItemsQuery.data ?? [];
    return [...data].sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return a.uid.localeCompare(b.uid);
    });
  }, [lineItemsQuery.data]);

  const total = useMemo(() => {
    return items.reduce((acc, li) => {
      const signed = li.direction === Direction.Income ? li.amount : -li.amount;
      return acc + signed;
    }, 0);
  }, [items]);

  const categories = categoriesQuery.data ?? [];
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.uid, label: c.name })),
    [categories],
  );

  const createMutation = useMutation({
    mutationFn: (req: CreateLineItemRequest) => lineItemsApi.create(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.lineItems.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: UpdateLineItemRequest }) =>
      lineItemsApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.lineItems.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (uid: string) => lineItemsApi.delete(uid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.lineItems.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.savings.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.creditCardDebts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mortgageDebts.all });
      closeDelete();
    },
    onError: (e) => setDeleteError(e instanceof Error ? e.message : 'Delete failed'),
  });

  const startDelete = async (li: LineItem) => {
    setDeletingItem(li);
    setLinkages(null);
    setLinkagesError(null);
    setDeleteError(null);
    setLoadingLinkages(true);
    try {
      const links = await lineItemsApi.getLinkages(li.uid);
      setLinkages(links);
    } catch (e) {
      setLinkagesError(e instanceof Error ? e.message : 'Failed to load linkages');
    } finally {
      setLoadingLinkages(false);
    }
  };

  const closeDelete = () => {
    setDeletingItem(null);
    setLinkages(null);
    setLinkagesError(null);
    setDeleteError(null);
    setLoadingLinkages(false);
  };

  const confirmDelete = () => {
    if (deletingItem) deleteMutation.mutate(deletingItem.uid);
  };

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
    setSubmitError(null);
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
    setSubmitError(null);
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
    setSubmitError(null);
  };

  const submit = () => {
    if (!form.categoryUID) {
      setSubmitError('Pick a category');
      return;
    }
    const payload: CreateLineItemRequest = {
      direction: form.direction,
      amount: Number(form.amount),
      date: form.date,
      description: form.description || null,
      categoryUID: form.categoryUID,
    };
    if (creating) {
      createMutation.mutate(payload);
    } else if (editing) {
      updateMutation.mutate({ uid: editing.uid, req: payload as UpdateLineItemRequest });
    }
  };

  const clearDateFilter = () => {
    const { from, to } = currentMonthRange();
    setFilterFrom(from);
    setFilterTo(to);
  };
  const clearDirectionFilter = () => setFilterDirection('');
  const clearCategoryFilter = () => setFilterCategoryUids([]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
            {submitError && <p className="text-danger mt-2 mb-0">{submitError}</p>}
          </Form>
        </ModalBody>
        <ModalFooter>
          <RenderDefaultButton label="Cancel" onClick={closeModal} disabled={isSubmitting} />
          <RenderPrimaryButton label="Save" onClick={submit} disabled={isSubmitting} />
        </ModalFooter>
      </Modal>
    );
  };

  const renderHeader = () => (
    <RenderPageHeader
      title="Ledger"
      subtitle="Track income and expenses across your accounts."
      rightContent={<RenderPrimaryButton label="New line item" icon="bi-plus-lg" onClick={startCreate} />}
    />
  );

  const renderFilterIcon = (key: FilterKey, id: string, isActive: boolean) => (
    <button
      id={id}
      type="button"
      className={`filter-icon-btn${isActive ? ' is-active' : ''}`}
      onClick={() => toggleFilter(key)}
      aria-label={`Filter ${key}`}
    >
      <i className={`bi ${isActive ? 'bi-funnel-fill' : 'bi-funnel'}`} aria-hidden="true" />
    </button>
  );

  const renderDatePopover = () => (
    <Popover
      isOpen={openFilter === 'date'}
      target="filter-icon-date"
      placement="bottom"
      toggle={closeFilter}
      trigger="legacy"
      popperClassName="filter-popover"
    >
      <PopoverBody>
        <FormGroup>
          <Label for="popover-from" className="small mb-1">
            From
          </Label>
          <Input
            id="popover-from"
            type="date"
            bsSize="sm"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </FormGroup>
        <FormGroup className="mb-2">
          <Label for="popover-to" className="small mb-1">
            To
          </Label>
          <Input
            id="popover-to"
            type="date"
            bsSize="sm"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </FormGroup>
        <div className="d-flex justify-content-end">
          <RenderDefaultButton label="Reset to this month" onClick={clearDateFilter} />
        </div>
      </PopoverBody>
    </Popover>
  );

  const renderDirectionPopover = () => (
    <Popover
      isOpen={openFilter === 'direction'}
      target="filter-icon-direction"
      placement="bottom"
      toggle={closeFilter}
      trigger="legacy"
      popperClassName="filter-popover"
    >
      <PopoverBody>
        <FormGroup className="mb-2">
          <Label for="popover-direction" className="small mb-1">
            Direction
          </Label>
          <Input
            id="popover-direction"
            type="select"
            bsSize="sm"
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
        </FormGroup>
        <div className="d-flex justify-content-end">
          <RenderDefaultButton label="Clear" onClick={clearDirectionFilter} disabled={!directionActive} />
        </div>
      </PopoverBody>
    </Popover>
  );

  const renderCategoryPopover = () => (
    <Popover
      isOpen={openFilter === 'category'}
      target="filter-icon-category"
      placement="bottom"
      toggle={closeFilter}
      trigger="legacy"
      popperClassName="filter-popover"
    >
      <PopoverBody style={{ minWidth: 280 }}>
        <FormGroup className="mb-2">
          <Label className="small mb-1">Categories</Label>
          <RenderMultiSelect
            id="popover-categories"
            options={categoryOptions}
            selectedValues={filterCategoryUids}
            onChange={setFilterCategoryUids}
            placeholder="All categories"
            size="sm"
          />
        </FormGroup>
        <div className="d-flex justify-content-end">
          <RenderDefaultButton label="Clear" onClick={clearCategoryFilter} disabled={!categoryActive} />
        </div>
      </PopoverBody>
    </Popover>
  );

  const renderTableContent = () => {
    if (lineItemsQuery.isLoading)
      return (
        <tr>
          <td colSpan={7} className="text-center py-3">
            Loading...
          </td>
        </tr>
      );
    if (lineItemsQuery.error)
      return (
        <tr>
          <td colSpan={7} className="text-center text-danger py-3">
            {lineItemsQuery.error instanceof Error
              ? lineItemsQuery.error.message
              : 'Failed to load ledger'}
          </td>
        </tr>
      );
    if (items.length === 0)
      return (
        <tr>
          <td colSpan={7} className="text-center text-muted py-3">
            No line items match the current filters.
          </td>
        </tr>
      );

    return items.map((li) => {
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
          <td>
            <CategoryPill categoryUid={li.categoryUID} name={li.categoryName} />
          </td>
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
            <div className="d-flex gap-2">
              <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(li)} />
              <RenderDangerButton
                label="Delete"
                icon="bi-trash"
                onClick={() => void startDelete(li)}
              />
            </div>
          </td>
        </tr>
      );
    });
  };

  const renderDeleteModal = () => {
    const isOpen = deletingItem !== null;
    const hasLinkages = linkages && linkages.length > 0;
    const isDeleting = deleteMutation.isPending;
    return (
      <Modal isOpen={isOpen} toggle={closeDelete}>
        <ModalHeader toggle={closeDelete}>Delete line item</ModalHeader>
        <ModalBody>
          {deletingItem && (
            <p className="mb-3">
              Delete <strong>{deletingItem.categoryName}</strong> on{' '}
              <strong>{deletingItem.date}</strong> for{' '}
              <strong>${deletingItem.amount.toFixed(2)}</strong>?
            </p>
          )}
          {loadingLinkages && <p className="text-muted mb-0">Checking for linked records…</p>}
          {linkagesError && <p className="text-danger mb-0">{linkagesError}</p>}
          {!loadingLinkages && hasLinkages && (
            <div className="mb-0">
              <p className="mb-2">
                This line item is also linked to the following — deleting will remove it from
                those views too:
              </p>
              <ul className="mb-0">
                {linkages!.map((l, i) => (
                  <li key={i}>
                    {l.entityType}: <strong>{l.entityName}</strong>
                    {l.componentType ? ` — ${l.componentType}` : ''} ($
                    {l.amount.toFixed(2)})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!loadingLinkages && linkages && linkages.length === 0 && (
            <p className="text-muted mb-0">No other records are linked to this line item.</p>
          )}
          {deleteError && <p className="text-danger mt-2 mb-0">{deleteError}</p>}
        </ModalBody>
        <ModalFooter>
          <RenderDefaultButton label="Cancel" onClick={closeDelete} disabled={isDeleting} />
          <RenderDangerButton
            label="Delete"
            icon="bi-trash"
            onClick={confirmDelete}
            disabled={isDeleting || loadingLinkages}
          />
        </ModalFooter>
      </Modal>
    );
  };

  const renderTable = () => (
    <Table hover responsive>
      <thead>
        <tr>
          <th>
            Date ↑
            {renderFilterIcon('date', 'filter-icon-date', dateActive)}
          </th>
          <th>
            Direction
            {renderFilterIcon('direction', 'filter-icon-direction', directionActive)}
          </th>
          <th className="text-end">Amount</th>
          <th>
            Category
            {renderFilterIcon('category', 'filter-icon-category', categoryActive)}
          </th>
          <th>Description</th>
          <th>Source</th>
          <th />
        </tr>
      </thead>
      <tbody>{renderTableContent()}</tbody>
      <tfoot>
        <tr>
          <td colSpan={2}>Total</td>
          <td
            className={`text-end fw-semibold ${total >= 0 ? 'text-income' : 'text-expense'}`}
          >
            {total >= 0 ? '+' : '−'}
            {Math.abs(total).toFixed(2)}
          </td>
          <td colSpan={4} />
        </tr>
      </tfoot>
    </Table>
  );

  return (
    <Container fluid className="py-4">
      {renderHeader()}
      <Card>
        <CardBody className="p-0">{renderTable()}</CardBody>
      </Card>
      {renderDatePopover()}
      {renderDirectionPopover()}
      {renderCategoryPopover()}
      {renderModal()}
      {renderDeleteModal()}
    </Container>
  );
}
