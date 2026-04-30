import { useEffect, useState } from 'react';
import {
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await categoriesApi.list(includeArchived));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [includeArchived]);

  const startCreate = () => {
    setForm(blankForm);
    setEditing(null);
    setCreating(true);
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
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
  };

  const submit = async () => {
    try {
      if (creating) {
        const req: CreateCategoryRequest = {
          name: form.name,
          direction: form.direction,
          description: form.description || null,
        };
        await categoriesApi.create(req);
      } else if (editing) {
        const req: UpdateCategoryRequest = {
          name: form.name,
          direction: form.direction,
          description: form.description || null,
          isArchived: form.isArchived,
        };
        await categoriesApi.update(editing.uid, req);
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  };

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
          </Form>
        </ModalBody>
        <ModalFooter>
          <RenderDefaultButton label="Cancel" onClick={closeModal} />
          <RenderPrimaryButton label="Save" onClick={() => void submit()} />
        </ModalFooter>
      </Modal>
    );
  };

  const renderHeader = () => (
    <div className="d-flex align-items-center mb-3">
      <h1 className="me-auto mb-0">Categories</h1>
      <FormGroup check className="me-3 mb-0">
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
      <RenderPrimaryButton label="New category" onClick={startCreate} />
    </div>
  );

  const renderTable = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (categories.length === 0) return <p className="text-muted">No categories yet.</p>;

    return (
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
        <tbody>
          {categories.map((c) => (
            <tr key={c.uid}>
              <td>{c.name}</td>
              <td>{CATEGORY_DIRECTION_LABELS[c.direction]}</td>
              <td>{c.description ?? '—'}</td>
              <td>{c.isArchived ? <span className="text-muted">Archived</span> : 'Active'}</td>
              <td>
                <RenderDefaultButton label="Edit" onClick={() => startEdit(c)} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <Container className="py-4">
      {renderHeader()}
      {renderTable()}
      {renderModal()}
    </Container>
  );
}
