import type { LineItemQuery } from '../types/api';

export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: (includeArchived: boolean) => ['categories', { includeArchived }] as const,
  },
  lineItems: {
    all: ['line-items'] as const,
    list: (query: LineItemQuery) => ['line-items', query] as const,
  },
  recurringTemplates: {
    all: ['recurring-templates'] as const,
    list: () => ['recurring-templates'] as const,
  },
  longTermContainers: {
    all: ['long-term-containers'] as const,
  },
  holdings: {
    all: ['holdings'] as const,
    byContainer: (containerUid: string) => ['holdings', { containerUid }] as const,
  },
  longTermItems: {
    all: ['long-term-items'] as const,
  },
  retirementContainers: {
    all: ['retirement-containers'] as const,
  },
  retirementHoldings: {
    all: ['retirement-holdings'] as const,
    byContainer: (containerUid: string) => ['retirement-holdings', { containerUid }] as const,
  },
  simpleAssets: {
    all: ['simple-assets'] as const,
  },
  savings: {
    all: ['savings'] as const,
    detail: (uid: string) => ['savings', uid] as const,
    transactions: (uid: string) => ['savings', uid, 'transactions'] as const,
  },
  creditCardDebts: {
    all: ['credit-card-debts'] as const,
    detail: (uid: string) => ['credit-card-debts', uid] as const,
    transactions: (uid: string) => ['credit-card-debts', uid, 'transactions'] as const,
    anchors: (uid: string) => ['credit-card-debts', uid, 'anchors'] as const,
  },
  mortgageDebts: {
    all: ['mortgage-debts'] as const,
    detail: (uid: string) => ['mortgage-debts', uid] as const,
    payments: (uid: string) => ['mortgage-debts', uid, 'payments'] as const,
    snapshots: (uid: string) => ['mortgage-debts', uid, 'snapshots'] as const,
  },
  lineItemAllocations: {
    all: ['line-item-allocations'] as const,
    byLineItem: (lineItemUid: string) => ['line-item-allocations', { lineItemUid }] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    tiles: () => ['dashboard', 'tiles'] as const,
    timeline: () => ['dashboard', 'timeline'] as const,
    categoryVariance: () => ['dashboard', 'category-variance'] as const,
  },
  ledgerReports: {
    all: ['ledger-reports'] as const,
    range: (from: string, to: string) => ['ledger-reports', { from, to }] as const,
  },
};
