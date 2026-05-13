import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  Table,
} from 'reactstrap';
import { categoriesApi } from '../api/categories';
import { queryKeys } from '../api/query-keys';
import { CategoryPill } from '../UI/functions/render-category-pill';
import { RenderPageHeader } from '../UI/functions/render-page-header';
import {
  RenderDefaultButton,
  RenderPrimaryButton,
} from '../UI/functions/render-skeleton-button-functions';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api';
import { CATEGORY_DIRECTION_LABELS, CategoryDirection } from '../types/enums';

interface FormState {
  name: string;
  direction: CategoryDirection;
  description: string;
  isArchived: boolean;
}

const blankForm: FormState = {
  name: '',
  direction: CategoryDirection.Expense,
  description: '',
  isArchived: false,
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.categories.list(includeArchived),
    queryFn: () => categoriesApi.list(includeArchived),
  });

  const createMutation = useMutation({
    mutationFn: (req: CreateCategoryRequest) => categoriesApi.create(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      closeModal();
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, req }: { uid: string; req: UpdateCategoryRequest }) =>
      categoriesApi.update(uid, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
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

  const startEdit = (c: Category) => {
    setForm({
      name: c.name,
      direction: c.direction,
      description: c.description ?? '',
      isArchived: c.isArchived,
    });
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
    if (creating) {
      createMutation.mutate({
        name: form.name,
        direction: form.direction,
        description: form.description || null,
      });
    } else if (editing) {
      updateMutation.mutate({
        uid: editing.uid,
        req: {
          name: form.name,
          direction: form.direction,
          description: form.description || null,
          isArchived: form.isArchived,
        },
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const renderModal = () => {
    const isOpen = creating || editing !== null;
    return (
      <Modal isOpen={isOpen} toggle={closeModal}>
        <ModalHeader toggle={closeModal}>{creating ? 'New category' : 'Edit category'}</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label for="direction">Direction</Label>
              <Input
                id="direction"
                type="select"
                value={form.direction}
                onChange={(e) =>
                  setForm({ ...form, direction: Number(e.target.value) as CategoryDirection })
                }
              >
                {Object.entries(CATEGORY_DIRECTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
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
            {!creating && (
              <FormGroup check>
                <Input
                  id="archived"
                  type="checkbox"
                  checked={form.isArchived}
                  onChange={(e) => setForm({ ...form, isArchived: e.target.checked })}
                />
                <Label for="archived" check>
                  Archived
                </Label>
              </FormGroup>
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

  const renderHeaderRight = () => (
    <>
      <FormGroup check className="mb-0">
        <Input
          id="includeArchived"
          type="checkbox"
          checked={includeArchived}
          onChange={(e) => setIncludeArchived(e.target.checked)}
        />
        <Label for="includeArchived" check>
          Show archived
        </Label>
      </FormGroup>
      <RenderPrimaryButton label="New category" icon="bi-plus-lg" onClick={startCreate} />
    </>
  );

  const renderHeader = () => (
    <RenderPageHeader
      title="Categories"
      subtitle="Income / expense / both buckets used by line items and templates."
      rightContent={renderHeaderRight()}
    />
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
            {error instanceof Error ? error.message : 'Failed to load categories'}
          </td>
        </tr>
      );
    if (categories.length === 0)
      return (
        <tr>
          <td colSpan={5} className="text-center text-muted py-3">
            No categories yet.
          </td>
        </tr>
      );

    return categories.map((c) => {
      const directionColor =
        c.direction === CategoryDirection.Income
          ? 'success'
          : c.direction === CategoryDirection.Expense
            ? 'danger'
            : 'info';
      return (
        <tr key={c.uid}>
          <td>
            <CategoryPill categoryUid={c.uid} name={c.name} />
          </td>
          <td>
            <Badge color={directionColor} pill>
              {CATEGORY_DIRECTION_LABELS[c.direction]}
            </Badge>
          </td>
          <td>{c.description ?? '—'}</td>
          <td>
            {c.isArchived ? (
              <Badge color="secondary" pill>
                Archived
              </Badge>
            ) : (
              <Badge color="success" pill>
                Active
              </Badge>
            )}
          </td>
          <td>
            <RenderDefaultButton label="Edit" icon="bi-pencil-square" onClick={() => startEdit(c)} />
          </td>
        </tr>
      );
    });
  };

  const renderTable = () => (
    <Table hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Direction</th>
          <th>Description</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>{renderTableContent()}</tbody>
    </Table>
  );

  return (
    <Container fluid className="py-4">
      {renderHeader()}
      <Card>
        <CardBody className="p-0">{renderTable()}</CardBody>
      </Card>
      {renderModal()}
    </Container>
  );
}
