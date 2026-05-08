import type {
  AccountType,
  Cadence,
  CategoryDirection,
  CompoundingFrequency,
  DayOfWeek,
  Direction,
  LinkedEntityType,
  LoanType,
} from './enums';

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
  categoryUIDs?: string[];
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

// Long-Term Containers + Holdings
export interface LongTermContainer {
  uid: string;
  name: string;
  institution: string | null;
  currentValue: number;
  currentAsOfDate: string;
}

export interface CreateLongTermContainerRequest {
  name: string;
  institution: string | null;
}

export interface UpdateLongTermContainerRequest {
  name: string;
  institution: string | null;
}

export interface Holding {
  uid: string;
  longTermContainerUID: string;
  name: string;
  symbol: string | null;
  units: number;
  pricePerUnit: number;
  value: number;
  asOfDate: string;
}

export interface CreateHoldingRequest {
  longTermContainerUID: string;
  name: string;
  symbol: string | null;
  units: number;
  pricePerUnit: number;
  asOfDate: string;
}

export interface UpdateHoldingRequest {
  name: string;
  symbol: string | null;
  units: number;
  pricePerUnit: number;
  asOfDate: string;
}

// Long-Term Items
export interface LongTermItem {
  uid: string;
  name: string;
  subtype: string | null;
  currentValue: number;
  currentAsOfDate: string;
}

export interface CreateLongTermItemRequest {
  name: string;
  subtype: string | null;
  currentValue: number;
  currentAsOfDate: string;
}

export interface UpdateLongTermItemRequest extends CreateLongTermItemRequest {}

// Retirement Containers + Holdings
export interface RetirementContainer {
  uid: string;
  name: string;
  institution: string | null;
  accountType: AccountType;
  currentValue: number;
  currentAsOfDate: string;
}

export interface CreateRetirementContainerRequest {
  name: string;
  institution: string | null;
  accountType: AccountType;
}

export interface UpdateRetirementContainerRequest extends CreateRetirementContainerRequest {}

export interface RetirementHolding {
  uid: string;
  retirementContainerUID: string;
  name: string;
  symbol: string | null;
  units: number;
  pricePerUnit: number;
  value: number;
  asOfDate: string;
}

export interface CreateRetirementHoldingRequest {
  retirementContainerUID: string;
  name: string;
  symbol: string | null;
  units: number;
  pricePerUnit: number;
  asOfDate: string;
}

export interface UpdateRetirementHoldingRequest {
  name: string;
  symbol: string | null;
  units: number;
  pricePerUnit: number;
  asOfDate: string;
}

// Simple Assets
export interface SimpleAsset {
  uid: string;
  name: string;
  subtype: string | null;
  currentValue: number;
  currentAsOfDate: string;
}

export interface CreateSimpleAssetRequest {
  name: string;
  subtype: string | null;
  currentValue: number;
  currentAsOfDate: string;
}

export interface UpdateSimpleAssetRequest extends CreateSimpleAssetRequest {}

// Savings
export interface Savings {
  uid: string;
  name: string;
  institution: string | null;
  subtype: string | null;
  compoundingFrequency: CompoundingFrequency;
  currentRate: number;
  currentRateAsOfDate: string;
  currentValue: number;
  currentValueAsOfDate: string;
}

export interface CreateSavingsRequest {
  name: string;
  institution: string | null;
  subtype: string | null;
  compoundingFrequency: CompoundingFrequency;
  currentRate: number;
  currentRateAsOfDate: string;
  currentValue: number;
  currentValueAsOfDate: string;
}

export interface UpdateSavingsRequest extends CreateSavingsRequest {}

// Credit Card Debts
export interface CreditCardDebt {
  uid: string;
  name: string;
  institution: string | null;
  apr: number;
  creditLimit: number;
  minimumPayment: number;
  currentBalance: number;
  currentAsOfDate: string;
}

export interface CreateCreditCardDebtRequest {
  name: string;
  institution: string | null;
  apr: number;
  creditLimit: number;
  minimumPayment: number;
  currentBalance: number;
  currentAsOfDate: string;
}

export interface UpdateCreditCardDebtRequest extends CreateCreditCardDebtRequest {}

// Mortgage Debts
export interface MortgageDebt {
  uid: string;
  name: string;
  institution: string | null;
  originalPrincipal: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  loanType: LoanType;
  monthlyPaymentPI: number;
  escrowMonthly: number;
  pmiMonthly: number;
  linkedRecurringTemplateUID: string | null;
  currentBalance: number;
  currentAsOfDate: string;
}

export interface CreateMortgageDebtRequest {
  name: string;
  institution: string | null;
  originalPrincipal: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  loanType: LoanType;
  monthlyPaymentPI: number;
  escrowMonthly: number;
  pmiMonthly: number;
  linkedRecurringTemplateUID: string | null;
  currentBalance: number;
  currentAsOfDate: string;
}

export interface UpdateMortgageDebtRequest extends CreateMortgageDebtRequest {}

// Line Item Allocations
export interface LineItemAllocation {
  uid: string;
  lineItemUID: string;
  linkedEntityUID: string;
  linkedEntityType: LinkedEntityType;
  componentType: string | null;
  amount: number;
  affectsLinkedBalance: boolean;
}

export interface CreateLineItemAllocationRequest {
  lineItemUID: string;
  linkedEntityUID: string;
  linkedEntityType: LinkedEntityType;
  componentType: string | null;
  amount: number;
  affectsLinkedBalance: boolean;
}

export interface UpdateLineItemAllocationRequest {
  linkedEntityUID: string;
  linkedEntityType: LinkedEntityType;
  componentType: string | null;
  amount: number;
  affectsLinkedBalance: boolean;
}

// Mortgage Payments — derived view of LineItem + LineItemAllocations linked to a mortgage.
export interface MortgagePaymentAllocation {
  uid: string;
  componentType: string | null;
  amount: number;
  affectsLinkedBalance: boolean;
}

export interface MortgagePayment {
  lineItemUID: string;
  date: string;
  billingMonth: string | null;
  totalAmount: number;
  description: string | null;
  categoryUID: string;
  categoryName: string;
  allocations: MortgagePaymentAllocation[];
}

export interface CreateMortgagePaymentAllocationInput {
  componentType: string | null;
  amount: number;
}

export interface CreateMortgagePaymentRequest {
  date: string;
  categoryUID: string;
  description: string | null;
  allocations: CreateMortgagePaymentAllocationInput[];
  billingMonth: string | null;
  balanceAfterPayment: number | null;
}

export interface MortgageBalanceSnapshot {
  uid: string;
  date: string;
  balance: number;
}
