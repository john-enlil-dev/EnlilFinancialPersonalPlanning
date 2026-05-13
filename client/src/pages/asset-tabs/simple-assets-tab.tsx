import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
import { simpleAssetsApi } from '../../api/simple-assets';
import { queryKeys } from '../../api/query-keys';
import { RenderCreatableSubtypeSelect } from '../../UI/functions/render-creatable-subtype-select';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { SimpleAsset } from '../../types/api';

interface FormState {
  name: string;
  subtype: string | null;
  currentValue: string;
  currentAsOfDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const blankForm: FormState = {
  name: '',
  subtype: null,
  currentValue: '0',
  currentAsOfDate: today(),
};

export default function SimpleAssetsTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SimpleAsset | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: assets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.simpleAssets.all,
    queryFn: simpleAssetsApi.list,
  });

  const subtypeOptions = useMemo(
    () => Array.from(new Set(assets.map((a) => a.subtype).filter((s): s is string => !!s))),
    [assets],
  );

  const createMutation = useMutation({
    mutationFn: simpleAssetsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.simpleAssets.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof simpleAssetsApi.update>[1] }) =>
      simpleAssetsApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.simpleAssets.all });
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

  const startEdit = (a: SimpleAsset) => {
    setForm({
      name: a.name,
      subtype: a.subtype,
      currentValue: a.currentValue.toString(),
      currentAsOfDate: a.currentAsOfDate,
    });
    setEditing(a);
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
          {creating ? 'New simple asset' : 'Edit simple asset'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="sa-name">Name</Label>
              <Input
                id="sa-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="sa-subtype">Subtype</Label>
              <RenderCreatableSubtypeSelect
                id="sa-subtype"
                value={form.subtype}
                options={subtypeOptions}
                onChange={(v) => setForm({ ...form, subtype: v })}
                placeholder="e.g., Cash, Checking"
              />
            </FormGroup>
            <FormGroup>
              <Label for="sa-value">Current value</Label>
              <Input
                id="sa-value"
                type="number"
                step="0.01"
                value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="sa-date">As-of date</Label>
              <Input
                id="sa-date"
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

  const renderToolbar = () => (
    <div className="d-flex justify-content-end mb-3">
      <RenderPrimaryButton label="New simple asset" onClick={startCreate} />
    </div>
  );

  const renderTableContent = () => {
    if (isLoading)
      return (
        <tr>
          <td colSpan={5} className="text-center py-3">
            Loading...
          </td>
        </tr>
      );
    if (error)
      return (
        <tr>
          <td colSpan={5} className="text-center text-danger py-3">
            {error instanceof Error ? error.message : 'Failed to load simple assets'}
          </td>
        </tr>
      );
    if (assets.length === 0)
      return (
        <tr>
          <td colSpan={5} className="text-center text-muted py-3">
            No simple assets yet.
          </td>
        </tr>
      );

    return assets.map((a) => (
      <tr key={a.uid}>
        <td className="fw-semibold">{a.name}</td>
        <td>{a.subtype ?? '—'}</td>
        <td className="text-end">
          {a.currentValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
        </td>
        <td>{a.currentAsOfDate}</td>
        <td>
          <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(a)} />
        </td>
      </tr>
    ));
  };

  const renderTable = () => (
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
      <tbody>{renderTableContent()}</tbody>
    </Table>
  );

  return (
    <div>
      {renderToolbar()}
      <Card>
        <CardBody className="p-0">{renderTable()}</CardBody>
      </Card>
      {renderModal()}
    </div>
  );
}
