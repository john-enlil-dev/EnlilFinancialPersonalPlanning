import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { holdingsApi } from '../../api/holdings';
import { queryKeys } from '../../api/query-keys';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { Holding } from '../../types/api';

interface HoldingsModalProps {
  containerUid: string | null;
  containerName: string;
  onClose: () => void;
}

interface FormState {
  name: string;
  symbol: string;
  units: string;
  pricePerUnit: string;
  asOfDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const blankForm: FormState = {
  name: '',
  symbol: '',
  units: '0',
  pricePerUnit: '0',
  asOfDate: today(),
};

export default function HoldingsModal({ containerUid, containerName, onClose }: HoldingsModalProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Holding | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerUid) {
      setEditing(null);
      setForm(blankForm);
      setSubmitError(null);
    }
  }, [containerUid]);

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: queryKeys.holdings.byContainer(containerUid ?? ''),
    queryFn: () => holdingsApi.listByContainer(containerUid!),
    enabled: !!containerUid,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.holdings.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.longTermContainers.all });
  };

  const createMutation = useMutation({
    mutationFn: holdingsApi.create,
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof holdingsApi.update>[1] }) =>
      holdingsApi.update(uid, req),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const resetForm = () => {
    setForm(blankForm);
    setEditing(null);
    setSubmitError(null);
  };

  const startEdit = (h: Holding) => {
    setForm({
      name: h.name,
      symbol: h.symbol ?? '',
      units: h.units.toString(),
      pricePerUnit: h.pricePerUnit.toString(),
      asOfDate: h.asOfDate,
    });
    setEditing(h);
    setSubmitError(null);
  };

  const submit = () => {
    if (!containerUid) return;
    const symbol = form.symbol.trim() || null;
    if (editing) {
      updateMutation.mutate({
        uid: editing.uid,
        req: {
          name: form.name,
          symbol,
          units: Number(form.units),
          pricePerUnit: Number(form.pricePerUnit),
          asOfDate: form.asOfDate,
        },
      });
    } else {
      createMutation.mutate({
        longTermContainerUID: containerUid,
        name: form.name,
        symbol,
        units: Number(form.units),
        pricePerUnit: Number(form.pricePerUnit),
        asOfDate: form.asOfDate,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={!!containerUid} toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>Holdings — {containerName}</ModalHeader>
      <ModalBody>
        {isLoading ? (
          <p>Loading...</p>
        ) : holdings.length === 0 ? (
          <p className="text-muted">No holdings yet.</p>
        ) : (
          <Table hover responsive size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Symbol</th>
                <th className="text-end">Units</th>
                <th className="text-end">Price</th>
                <th className="text-end">Value</th>
                <th>As Of</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.uid}>
                  <td>{h.name}</td>
                  <td>{h.symbol ?? '—'}</td>
                  <td className="text-end">{h.units}</td>
                  <td className="text-end">{h.pricePerUnit.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                  <td className="text-end">{h.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                  <td>{h.asOfDate}</td>
                  <td>
                    <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(h)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <hr />

        <h6>{editing ? 'Edit holding' : 'Add holding'}</h6>
        <Form>
          <div className="row g-2">
            <FormGroup className="col-md-4">
              <Label for="h-name">Name</Label>
              <Input id="h-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormGroup>
            <FormGroup className="col-md-2">
              <Label for="h-symbol">Symbol</Label>
              <Input id="h-symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
            </FormGroup>
            <FormGroup className="col-md-2">
              <Label for="h-units">Units</Label>
              <Input id="h-units" type="number" step="0.000001" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
            </FormGroup>
            <FormGroup className="col-md-2">
              <Label for="h-price">Price</Label>
              <Input id="h-price" type="number" step="0.0001" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} />
            </FormGroup>
            <FormGroup className="col-md-2">
              <Label for="h-date">As of</Label>
              <Input id="h-date" type="date" value={form.asOfDate} onChange={(e) => setForm({ ...form, asOfDate: e.target.value })} />
            </FormGroup>
          </div>
          {submitError && <p className="text-danger mt-2 mb-0">{submitError}</p>}
        </Form>
      </ModalBody>
      <ModalFooter>
        {editing && <RenderDefaultButton label="Cancel edit" onClick={resetForm} disabled={isSubmitting} />}
        <RenderDefaultButton label="Close" onClick={onClose} disabled={isSubmitting} />
        <RenderPrimaryButton label={editing ? 'Save changes' : 'Add holding'} onClick={submit} disabled={isSubmitting} />
      </ModalFooter>
    </Modal>
  );
}
