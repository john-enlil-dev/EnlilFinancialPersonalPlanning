import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
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
import { mortgageDebtsApi } from '../../api/mortgage-debts';
import { queryKeys } from '../../api/query-keys';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { MortgageDebt } from '../../types/api';
import { LOAN_TYPE_LABELS, LoanType } from '../../types/enums';

interface FormState {
  name: string;
  institution: string;
  originalPrincipal: string;
  interestRate: string;
  termMonths: string;
  startDate: string;
  loanType: LoanType;
  monthlyPaymentPI: string;
  escrowMonthly: string;
  pmiMonthly: string;
  currentBalance: string;
  currentAsOfDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const blankForm: FormState = {
  name: '',
  institution: '',
  originalPrincipal: '0',
  interestRate: '0',
  termMonths: '360',
  startDate: today(),
  loanType: LoanType.Fixed,
  monthlyPaymentPI: '0',
  escrowMonthly: '0',
  pmiMonthly: '0',
  currentBalance: '0',
  currentAsOfDate: today(),
};

export default function MortgagesTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MortgageDebt | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: mortgages = [], isLoading } = useQuery({
    queryKey: queryKeys.mortgageDebts.all,
    queryFn: mortgageDebtsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: mortgageDebtsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mortgageDebts.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof mortgageDebtsApi.update>[1] }) =>
      mortgageDebtsApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mortgageDebts.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const startCreate = () => {
    setForm(blankForm);
    setEditing(null);
    setCreating(true);
    setSubmitError(null);
  };

  const startEdit = (m: MortgageDebt) => {
    setForm({
      name: m.name,
      institution: m.institution ?? '',
      originalPrincipal: m.originalPrincipal.toString(),
      interestRate: m.interestRate.toString(),
      termMonths: m.termMonths.toString(),
      startDate: m.startDate,
      loanType: m.loanType,
      monthlyPaymentPI: m.monthlyPaymentPI.toString(),
      escrowMonthly: m.escrowMonthly.toString(),
      pmiMonthly: m.pmiMonthly.toString(),
      currentBalance: m.currentBalance.toString(),
      currentAsOfDate: m.currentAsOfDate,
    });
    setEditing(m);
    setCreating(false);
    setSubmitError(null);
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
    setSubmitError(null);
  };

  const submit = () => {
    const payload = {
      name: form.name,
      institution: form.institution.trim() || null,
      originalPrincipal: Number(form.originalPrincipal),
      interestRate: Number(form.interestRate),
      termMonths: Number(form.termMonths),
      startDate: form.startDate,
      loanType: form.loanType,
      monthlyPaymentPI: Number(form.monthlyPaymentPI),
      escrowMonthly: Number(form.escrowMonthly),
      pmiMonthly: Number(form.pmiMonthly),
      linkedRecurringTemplateUID: editing?.linkedRecurringTemplateUID ?? null,
      currentBalance: Number(form.currentBalance),
      currentAsOfDate: form.currentAsOfDate,
    };
    if (creating) createMutation.mutate(payload);
    else if (editing) updateMutation.mutate({ uid: editing.uid, req: payload });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const renderModal = () => {
    const isOpen = creating || editing !== null;
    return (
      <Modal isOpen={isOpen} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {creating ? 'New mortgage' : 'Edit mortgage'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <div className="row g-2">
              <FormGroup className="col-md-6">
                <Label for="m-name">Name</Label>
                <Input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="m-institution">Institution</Label>
                <Input id="m-institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-principal">Original principal</Label>
                <Input id="m-principal" type="number" step="0.01" value={form.originalPrincipal} onChange={(e) => setForm({ ...form, originalPrincipal: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-rate">Interest rate (decimal)</Label>
                <Input id="m-rate" type="number" step="0.000001" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-term">Term (months)</Label>
                <Input id="m-term" type="number" value={form.termMonths} onChange={(e) => setForm({ ...form, termMonths: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-start">Start date</Label>
                <Input id="m-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-loan-type">Loan type</Label>
                <Input
                  id="m-loan-type"
                  type="select"
                  value={form.loanType}
                  onChange={(e) => setForm({ ...form, loanType: Number(e.target.value) as LoanType })}
                >
                  {Object.entries(LOAN_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-pi">Monthly P&amp;I</Label>
                <Input id="m-pi" type="number" step="0.01" value={form.monthlyPaymentPI} onChange={(e) => setForm({ ...form, monthlyPaymentPI: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-escrow">Escrow / month</Label>
                <Input id="m-escrow" type="number" step="0.01" value={form.escrowMonthly} onChange={(e) => setForm({ ...form, escrowMonthly: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-4">
                <Label for="m-pmi">PMI / month</Label>
                <Input id="m-pmi" type="number" step="0.01" value={form.pmiMonthly} onChange={(e) => setForm({ ...form, pmiMonthly: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="m-balance">Current balance</Label>
                <Input id="m-balance" type="number" step="0.01" value={form.currentBalance} onChange={(e) => setForm({ ...form, currentBalance: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="m-date">As-of date</Label>
                <Input id="m-date" type="date" value={form.currentAsOfDate} onChange={(e) => setForm({ ...form, currentAsOfDate: e.target.value })} />
              </FormGroup>
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

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <RenderPrimaryButton label="New mortgage" onClick={startCreate} />
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : mortgages.length === 0 ? (
        <p className="text-muted">No mortgages yet.</p>
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Institution</th>
              <th>Type</th>
              <th className="text-end">Rate</th>
              <th className="text-end">Term</th>
              <th className="text-end">P&amp;I</th>
              <th className="text-end">Balance</th>
              <th>As Of</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mortgages.map((m) => (
              <tr key={m.uid}>
                <td className="fw-semibold">
                  <Link to={`/liabilities/mortgages/${m.uid}`} className="enlil-row-link">
                    {m.name}
                  </Link>
                </td>
                <td>{m.institution ?? '—'}</td>
                <td>
                  <Badge color="info" pill>
                    {LOAN_TYPE_LABELS[m.loanType]}
                  </Badge>
                </td>
                <td className="text-end">{(m.interestRate * 100).toFixed(3)}%</td>
                <td className="text-end">{m.termMonths} mo</td>
                <td className="text-end">{m.monthlyPaymentPI.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td className="text-end">{m.currentBalance.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td>{m.currentAsOfDate}</td>
                <td>
                  <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(m)} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {renderModal()}
    </div>
  );
}
