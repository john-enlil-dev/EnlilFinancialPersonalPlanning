import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
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
import { savingsApi } from '../../api/savings';
import { queryKeys } from '../../api/query-keys';
import { RenderCreatableSubtypeSelect } from '../../UI/functions/render-creatable-subtype-select';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { Savings } from '../../types/api';
import { COMPOUNDING_FREQUENCY_LABELS, CompoundingFrequency } from '../../types/enums';

interface FormState {
  name: string;
  institution: string;
  subtype: string | null;
  compoundingFrequency: CompoundingFrequency;
  currentRate: string;
  currentRateAsOfDate: string;
  currentValue: string;
  currentValueAsOfDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const blankForm: FormState = {
  name: '',
  institution: '',
  subtype: null,
  compoundingFrequency: CompoundingFrequency.Daily,
  currentRate: '0',
  currentRateAsOfDate: today(),
  currentValue: '0',
  currentValueAsOfDate: today(),
};

export default function SavingsTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Savings | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: savings = [], isLoading } = useQuery({
    queryKey: queryKeys.savings.all,
    queryFn: savingsApi.list,
  });

  const subtypeOptions = useMemo(
    () => Array.from(new Set(savings.map((s) => s.subtype).filter((s): s is string => !!s))),
    [savings],
  );

  const createMutation = useMutation({
    mutationFn: savingsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.savings.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof savingsApi.update>[1] }) =>
      savingsApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.savings.all });
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

  const startEdit = (s: Savings) => {
    setForm({
      name: s.name,
      institution: s.institution ?? '',
      subtype: s.subtype,
      compoundingFrequency: s.compoundingFrequency,
      currentRate: s.currentRate.toString(),
      currentRateAsOfDate: s.currentRateAsOfDate,
      currentValue: s.currentValue.toString(),
      currentValueAsOfDate: s.currentValueAsOfDate,
    });
    setEditing(s);
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
      subtype: form.subtype,
      compoundingFrequency: form.compoundingFrequency,
      currentRate: Number(form.currentRate),
      currentRateAsOfDate: form.currentRateAsOfDate,
      currentValue: Number(form.currentValue),
      currentValueAsOfDate: form.currentValueAsOfDate,
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
          {creating ? 'New savings account' : 'Edit savings account'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <div className="row g-2">
              <FormGroup className="col-md-6">
                <Label for="sav-name">Name</Label>
                <Input id="sav-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="sav-institution">Institution</Label>
                <Input
                  id="sav-institution"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="e.g., Ally, Marcus, Capital One"
                />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="sav-subtype">Subtype</Label>
                <RenderCreatableSubtypeSelect
                  id="sav-subtype"
                  value={form.subtype}
                  options={subtypeOptions}
                  onChange={(v) => setForm({ ...form, subtype: v })}
                  placeholder="e.g., HYSA, Money Market, CD"
                />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="sav-compound">Compounding</Label>
                <Input
                  id="sav-compound"
                  type="select"
                  value={form.compoundingFrequency}
                  onChange={(e) => setForm({ ...form, compoundingFrequency: Number(e.target.value) as CompoundingFrequency })}
                >
                  {Object.entries(COMPOUNDING_FREQUENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Input>
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="sav-rate">Current rate (decimal, e.g. 0.045)</Label>
                <Input id="sav-rate" type="number" step="0.000001" value={form.currentRate} onChange={(e) => setForm({ ...form, currentRate: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="sav-rate-date">Rate as-of</Label>
                <Input id="sav-rate-date" type="date" value={form.currentRateAsOfDate} onChange={(e) => setForm({ ...form, currentRateAsOfDate: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="sav-value">Current value</Label>
                <Input id="sav-value" type="number" step="0.01" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
              </FormGroup>
              <FormGroup className="col-md-6">
                <Label for="sav-value-date">Value as-of</Label>
                <Input id="sav-value-date" type="date" value={form.currentValueAsOfDate} onChange={(e) => setForm({ ...form, currentValueAsOfDate: e.target.value })} />
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
        <RenderPrimaryButton label="New savings account" onClick={startCreate} />
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : savings.length === 0 ? (
        <p className="text-muted">No savings accounts yet.</p>
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Institution</th>
              <th>Subtype</th>
              <th className="text-end">Rate (APY)</th>
              <th className="text-end">Current Value</th>
              <th>As Of</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {savings.map((s) => (
              <tr key={s.uid}>
                <td className="fw-semibold">{s.name}</td>
                <td>{s.institution ?? '—'}</td>
                <td>{s.subtype ?? '—'}</td>
                <td className="text-end">{(s.currentRate * 100).toFixed(3)}%</td>
                <td className="text-end">{s.currentValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td>{s.currentValueAsOfDate}</td>
                <td>
                  <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(s)} />
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
