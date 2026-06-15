import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
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
import { categoriesApi } from '../../api/categories';
import { creditCardDebtsApi } from '../../api/credit-card-debts';
import { queryKeys } from '../../api/query-keys';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { CreditCardDebt } from '../../types/api';

interface FormState {
  name: string;
  institution: string;
  apr: string;
  creditLimit: string;
  minimumPayment: string;
  currentBalance: string;
  currentAsOfDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const blankForm: FormState = {
  name: '',
  institution: '',
  apr: '0',
  creditLimit: '0',
  minimumPayment: '0',
  currentBalance: '0',
  currentAsOfDate: today(),
};

export default function CreditCardsTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CreditCardDebt | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [reconcileCategoryUid, setReconcileCategoryUid] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: queryKeys.creditCardDebts.all,
    queryFn: creditCardDebtsApi.list,
  });

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.list(false),
    queryFn: () => categoriesApi.list(false),
  });

  const eligibleCategories = useMemo(
    () => categories.filter((c) => !c.isArchived),
    [categories],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.creditCardDebts.all });
  };

  const createMutation = useMutation({
    mutationFn: creditCardDebtsApi.create,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof creditCardDebtsApi.update>[1] }) =>
      creditCardDebtsApi.update(uid, req),
    onSuccess: invalidate,
  });

  const reconcileMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof creditCardDebtsApi.reconcile>[1] }) =>
      creditCardDebtsApi.reconcile(uid, req),
    onSuccess: invalidate,
  });

  const startCreate = () => {
    setForm(blankForm);
    setEditing(null);
    setCreating(true);
    setReconcileCategoryUid('');
    setSubmitError(null);
  };

  const startEdit = (c: CreditCardDebt) => {
    setForm({
      name: c.name,
      institution: c.institution ?? '',
      apr: c.apr.toString(),
      creditLimit: c.creditLimit.toString(),
      minimumPayment: c.minimumPayment.toString(),
      currentBalance: c.currentBalance.toString(),
      currentAsOfDate: c.currentAsOfDate,
    });
    setEditing(c);
    setCreating(false);
    setReconcileCategoryUid('');
    setSubmitError(null);
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
    setSubmitError(null);
  };

  const balanceChanged = editing !== null && Number(form.currentBalance) !== editing.currentBalance;

  const submit = async () => {
    setSubmitError(null);
    try {
      if (creating) {
        await createMutation.mutateAsync({
          name: form.name,
          institution: form.institution.trim() || null,
          apr: Number(form.apr),
          creditLimit: Number(form.creditLimit),
          minimumPayment: Number(form.minimumPayment),
          currentBalance: Number(form.currentBalance),
          currentAsOfDate: form.currentAsOfDate,
        });
      } else if (editing) {
        await updateMutation.mutateAsync({
          uid: editing.uid,
          req: {
            name: form.name,
            institution: form.institution.trim() || null,
            apr: Number(form.apr),
            creditLimit: Number(form.creditLimit),
            minimumPayment: Number(form.minimumPayment),
          },
        });

        // D7: changing the balance field is a reconcile (records an anchor + drift adjustment).
        if (balanceChanged) {
          const newBalance = Number(form.currentBalance);
          if (!Number.isFinite(newBalance) || newBalance < 0) {
            setSubmitError('Enter a balance of zero or more.');
            return;
          }
          if (!reconcileCategoryUid) {
            setSubmitError('Pick a category for the balance adjustment.');
            return;
          }
          await reconcileMutation.mutateAsync({
            uid: editing.uid,
            req: {
              date: form.currentAsOfDate,
              assertedBalance: newBalance,
              categoryUID: reconcileCategoryUid,
              note: 'Edited from card list',
            },
          });
        }
      }
      closeModal();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || reconcileMutation.isPending;

  const renderReconcileFields = () => {
    if (!editing) return null;
    return (
      <>
        <FormGroup className="col-md-6">
          <Label for="cc-balance">Current balance</Label>
          <Input
            id="cc-balance"
            type="number"
            step="0.01"
            value={form.currentBalance}
            onChange={(e) => setForm({ ...form, currentBalance: e.target.value })}
          />
        </FormGroup>
        <FormGroup className="col-md-6">
          <Label for="cc-date">As-of date</Label>
          <Input
            id="cc-date"
            type="date"
            value={form.currentAsOfDate}
            onChange={(e) => setForm({ ...form, currentAsOfDate: e.target.value })}
          />
        </FormGroup>
        {balanceChanged && (
          <FormGroup className="col-12">
            <Label for="cc-reconcile-category">
              Adjustment category{' '}
              <span className="text-muted">(the balance change is recorded as a reconciliation)</span>
            </Label>
            <Input
              id="cc-reconcile-category"
              type="select"
              value={reconcileCategoryUid}
              onChange={(e) => setReconcileCategoryUid(e.target.value)}
            >
              <option value="">Select a category…</option>
              {eligibleCategories.map((c) => (
                <option key={c.uid} value={c.uid}>
                  {c.name}
                </option>
              ))}
            </Input>
          </FormGroup>
        )}
      </>
    );
  };

  const renderModal = () => {
    const isOpen = creating || editing !== null;
    return (
      <Modal isOpen={isOpen} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {creating ? 'New credit card' : 'Edit credit card'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <div className="row g-2">
              <FormGroup className="col-md-6">
                <Label for="cc-name">Name</Label>
                <Input id="cc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="cc-institution">Institution</Label>
                <Input id="cc-institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="cc-apr">APR (decimal)</Label>
                <Input id="cc-apr" type="number" step="0.000001" value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="cc-limit">Credit limit</Label>
                <Input id="cc-limit" type="number" step="0.01" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="cc-min">Minimum payment</Label>
                <Input id="cc-min" type="number" step="0.01" value={form.minimumPayment} onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })} />
              </FormGroup>
              {creating ? (
                <>
                  <FormGroup className="col-md-6">
                    <Label for="cc-balance">Opening balance</Label>
                    <Input id="cc-balance" type="number" step="0.01" value={form.currentBalance} onChange={(e) => setForm({ ...form, currentBalance: e.target.value })} />
                  </FormGroup>
                  <FormGroup className="col-md-6">
                    <Label for="cc-date">As-of date</Label>
                    <Input id="cc-date" type="date" value={form.currentAsOfDate} onChange={(e) => setForm({ ...form, currentAsOfDate: e.target.value })} />
                  </FormGroup>
                </>
              ) : (
                renderReconcileFields()
              )}
            </div>
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

  const renderTableContent = () => {
    if (isLoading)
      return (
        <tr>
          <td colSpan={8} className="text-center py-3">
            Loading...
          </td>
        </tr>
      );
    if (cards.length === 0)
      return (
        <tr>
          <td colSpan={8} className="text-center text-muted py-3">
            No credit cards yet.
          </td>
        </tr>
      );
    return cards.map((c) => (
      <tr key={c.uid}>
        <td className="fw-semibold">
          <Link to={`/liabilities/credit-cards/${c.uid}`} className="enlil-row-link">
            {c.name}
          </Link>
        </td>
        <td>{c.institution ?? '—'}</td>
        <td className="text-end">{(c.apr * 100).toFixed(2)}%</td>
        <td className="text-end">
          {c.creditLimit.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
        </td>
        <td className="text-end">
          {c.minimumPayment.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
        </td>
        <td className="text-end">
          {c.currentBalance.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
        </td>
        <td>{c.currentAsOfDate}</td>
        <td>
          <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(c)} />
        </td>
      </tr>
    ));
  };

  const renderTable = () => (
    <Table hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Institution</th>
          <th className="text-end">APR</th>
          <th className="text-end">Limit</th>
          <th className="text-end">Min Payment</th>
          <th className="text-end">Balance</th>
          <th>As Of</th>
          <th />
        </tr>
      </thead>
      <tbody>{renderTableContent()}</tbody>
    </Table>
  );

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <RenderPrimaryButton label="New credit card" onClick={startCreate} />
      </div>
      <Card>
        <CardBody className="p-0">{renderTable()}</CardBody>
      </Card>
      {renderModal()}
    </div>
  );
}
