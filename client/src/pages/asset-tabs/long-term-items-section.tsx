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
import { longTermItemsApi } from '../../api/long-term-items';
import { queryKeys } from '../../api/query-keys';
import { RenderCreatableSubtypeSelect } from '../../UI/functions/render-creatable-subtype-select';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { LongTermItem } from '../../types/api';

interface FormState {
  name: string;
  subtype: string | null;
  currentValue: string;
  currentAsOfDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const blankForm: FormState = { name: '', subtype: null, currentValue: '0', currentAsOfDate: today() };

export default function LongTermItemsSection() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LongTermItem | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.longTermItems.all,
    queryFn: longTermItemsApi.list,
  });

  const subtypeOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.subtype).filter((s): s is string => !!s))),
    [items],
  );

  const createMutation = useMutation({
    mutationFn: longTermItemsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.longTermItems.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof longTermItemsApi.update>[1] }) =>
      longTermItemsApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.longTermItems.all });
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

  const startEdit = (i: LongTermItem) => {
    setForm({
      name: i.name,
      subtype: i.subtype,
      currentValue: i.currentValue.toString(),
      currentAsOfDate: i.currentAsOfDate,
    });
    setEditing(i);
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
      subtype: form.subtype,
      currentValue: Number(form.currentValue),
      currentAsOfDate: form.currentAsOfDate,
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
          {creating ? 'New long-term item' : 'Edit long-term item'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="lti-name">Name</Label>
              <Input
                id="lti-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="lti-subtype">Subtype</Label>
              <RenderCreatableSubtypeSelect
                id="lti-subtype"
                value={form.subtype}
                options={subtypeOptions}
                onChange={(v) => setForm({ ...form, subtype: v })}
                placeholder="e.g., House, Art, Jewelry"
              />
            </FormGroup>
            <FormGroup>
              <Label for="lti-value">Current value</Label>
              <Input
                id="lti-value"
                type="number"
                step="0.01"
                value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="lti-date">As-of date</Label>
              <Input
                id="lti-date"
                type="date"
                value={form.currentAsOfDate}
                onChange={(e) => setForm({ ...form, currentAsOfDate: e.target.value })}
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="mb-0">Possessions (houses, art, jewelry, etc.)</h4>
        <RenderPrimaryButton label="New item" onClick={startCreate} />
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No items yet.</p>
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Subtype</th>
              <th className="text-end">Current Value</th>
              <th>As Of</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.uid}>
                <td className="fw-semibold">{i.name}</td>
                <td>{i.subtype ?? '—'}</td>
                <td className="text-end">{i.currentValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                <td>{i.currentAsOfDate}</td>
                <td>
                  <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(i)} />
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
