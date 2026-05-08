import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { longTermContainersApi } from '../../api/long-term-containers';
import { queryKeys } from '../../api/query-keys';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { LongTermContainer } from '../../types/api';
import HoldingsModal from './holdings-modal';

interface FormState {
  name: string;
  institution: string;
}

const blankForm: FormState = { name: '', institution: '' };

export default function LongTermContainersSection() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LongTermContainer | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [holdingsFor, setHoldingsFor] = useState<LongTermContainer | null>(null);

  const { data: containers = [], isLoading } = useQuery({
    queryKey: queryKeys.longTermContainers.all,
    queryFn: longTermContainersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: longTermContainersApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.longTermContainers.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof longTermContainersApi.update>[1] }) =>
      longTermContainersApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.longTermContainers.all });
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

  const startEdit = (c: LongTermContainer) => {
    setForm({ name: c.name, institution: c.institution ?? '' });
    setEditing(c);
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
    };
    if (creating) createMutation.mutate(payload);
    else if (editing) updateMutation.mutate({ uid: editing.uid, req: payload });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const renderModal = () => {
    const isOpen = creating || editing !== null;
    return (
      <Modal isOpen={isOpen} toggle={closeModal}>
        <ModalHeader toggle={closeModal}>
          {creating ? 'New container' : 'Edit container'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="ltc-name">Name</Label>
              <Input id="ltc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormGroup>
            <FormGroup>
              <Label for="ltc-institution">Institution</Label>
              <Input
                id="ltc-institution"
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                placeholder="e.g., Vanguard, Fidelity"
              />
            </FormGroup>
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
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="mb-0">Brokerage / investment containers</h4>
        <RenderPrimaryButton label="New container" onClick={startCreate} />
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : containers.length === 0 ? (
        <p className="text-muted">No containers yet.</p>
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Institution</th>
              <th className="text-end">Current Value</th>
              <th>As Of</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {containers.map((c) => (
              <tr key={c.uid}>
                <td className="fw-semibold">{c.name}</td>
                <td>{c.institution ?? '—'}</td>
                <td className="text-end">{c.currentValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td>{c.currentAsOfDate}</td>
                <td className="d-flex gap-2">
                  <RenderDefaultButton label="Holdings" onClick={() => setHoldingsFor(c)} />
                  <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(c)} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {renderModal()}
      <HoldingsModal
        containerUid={holdingsFor?.uid ?? null}
        containerName={holdingsFor?.name ?? ''}
        onClose={() => setHoldingsFor(null)}
      />
    </div>
  );
}
