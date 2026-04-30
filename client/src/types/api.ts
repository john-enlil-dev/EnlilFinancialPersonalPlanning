import type { Cadence, CategoryDirection, DayOfWeek, Direction } from './enums';

export interface Category {
  uid: string;
  name: string;
  direction: CategoryDirection;
  description: string | null;
  isArchived: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  direction: CategoryDirection;
  description: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  direction: CategoryDirection;
  description: string | null;
  isArchived: boolean;
}

export interface LineItem {
  uid: string;
  direction: Direction;
  amount: number;
  date: string;
  description: string | null;
  categoryUID: string;
  categoryName: string;
  sourceTemplateUID: string | null;
  sourceTemplateName: string | null;
  wasManuallyEdited: boolean;
}

export interface CreateLineItemRequest {
  direction: Direction;
  amount: number;
  date: string;
  description: string | null;
  categoryUID: string;
}

export interface UpdateLineItemRequest extends CreateLineItemRequest {}

export interface LineItemQuery {
  fromDate?: string;
  toDate?: string;
  direction?: Direction;
  categoryUID?: string;
}

export interface RecurringTemplate {
  uid: string;
  name: string;
  direction: Direction;
  categoryUID: string;
  categoryName: string;
  amount: number;
  description: string | null;
  startDate: string;
  endDate: string | null;
  cadence: Cadence;
  dayOfMonth: number | null;
  useLastDayOfMonth: boolean;
  dayOfWeek: DayOfWeek | null;
  monthOfQuarter: number | null;
  monthOfYear: number | null;
  intervalDays: number | null;
}

export interface CreateRecurringTemplateRequest {
  name: string;
  direction: Direction;
  categoryUID: string;
  amount: number;
  description: string | null;
  startDate: string;
  endDate: string | null;
  cadence: Cadence;
  dayOfMonth: number | null;
  useLastDayOfMonth: boolean;
  dayOfWeek: DayOfWeek | null;
  monthOfQuarter: number | null;
  monthOfYear: number | null;
  intervalDays: number | null;
}

export interface UpdateRecurringTemplateRequest extends CreateRecurringTemplateRequest {}
