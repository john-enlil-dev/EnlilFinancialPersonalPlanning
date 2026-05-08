import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { retirementContainersApi } from '../../api/retirement-containers';
import { queryKeys } from '../../api/query-keys';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../../UI/functions/render-skeleton-button-functions';
import type { RetirementContainer } from '../../types/api';
import { ACCOUNT_TYPE_LABELS, AccountType } from '../../types/enums';
import RetirementHoldingsModal from './retirement-holdings-modal';

interface FormState {
  name: string;
  institution: string;
  accountType: AccountType;
}

const blankForm: FormState = {
  name: '',
  institution: '',
  accountType: AccountType.Traditional401k,
};

export default function RetirementTab() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RetirementContainer | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [holdingsFor, setHoldingsFor] = useState<RetirementContainer | null>(null);

  const { data: containers = [], isLoading } = useQuery({
    queryKey: queryKeys.retirementContainers.all,
    queryFn: retirementContainersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: retirementContainersApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.retirementContainers.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: Parameters<typeof retirementContainersApi.update>[1] }) =>
      retirementContainersApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.retirementContainers.all });
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

  const startEdit = (c: RetirementContainer) => {
    setForm({ name: c.name, institution: c.institution ?? '', accountType: c.accountType });
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
      accountType: form.accountType,
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
          {creating ? 'New retirement account' : 'Edit retirement account'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="rc-name">Name</Label>
              <Input id="rc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormGroup>
            <FormGroup>
              <Label for="rc-institution">Institution</Label>
              <Input
                id="rc-institution"
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                placeholder="e.g., Fidelity, Vanguard"
              />
            </FormGroup>
            <FormGroup>
              <Label for="rc-type">Account type</Label>
              <Input
                id="rc-type"
                type="select"
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: Number(e.target.value) as AccountType })}
              >
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Input>
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
      <div className="d-flex justify-content-end mb-3">
        <RenderPrimaryButton label="New retirement account" onClick={startCreate} />
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : containers.length === 0 ? (
        <p className="text-muted">No retirement accounts yet.</p>
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Institution</th>
              <th>Type</th>
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
                <td>
                  <Badge color="info" pill>
                    {ACCOUNT_TYPE_LABELS[c.accountType]}
                  </Badge>
                </td>
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
      <RetirementHoldingsModal
        containerUid={holdingsFor?.uid ?? null}
        containerName={holdingsFor?.name ?? ''}
        onClose={() => setHoldingsFor(null)}
      />
    </div>
  );
}
