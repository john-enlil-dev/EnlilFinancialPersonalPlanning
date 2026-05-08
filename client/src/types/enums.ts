export const Direction = {
  Income: 1,
  Expense: 2,
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export const CategoryDirection = {
  Income: 1,
  Expense: 2,
  Both: 3,
} as const;
export type CategoryDirection = (typeof CategoryDirection)[keyof typeof CategoryDirection];

export const Cadence = {
  Daily: 1,
  Weekly: 2,
  BiWeekly: 3,
  Monthly: 4,
  Quarterly: 5,
  Annually: 6,
  CustomDays: 7,
} as const;
export type Cadence = (typeof Cadence)[keyof typeof Cadence];

export const DayOfWeek = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export const AccountType = {
  Traditional401k: 1,
  Roth401k: 2,
  TraditionalIRA: 3,
  RothIRA: 4,
  HSA: 5,
  Pension: 6,
  Other: 7,
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const LoanType = {
  Fixed: 1,
  ARM: 2,
  Other: 3,
} as const;
export type LoanType = (typeof LoanType)[keyof typeof LoanType];

export const CompoundingFrequency = {
  Daily: 1,
  Monthly: 2,
  Quarterly: 3,
  Annual: 4,
} as const;
export type CompoundingFrequency =
  (typeof CompoundingFrequency)[keyof typeof CompoundingFrequency];

export const LinkedEntityType = {
  SimpleAsset: 1,
  Savings: 2,
  CreditCardDebt: 3,
  MortgageDebt: 4,
  LongTermContainer: 5,
  LongTermItem: 6,
  RetirementContainer: 7,
} as const;
export type LinkedEntityType = (typeof LinkedEntityType)[keyof typeof LinkedEntityType];

export const DIRECTION_LABELS: Record<Direction, string> = {
  [Direction.Income]: 'Income',
  [Direction.Expense]: 'Expense',
};

export const CATEGORY_DIRECTION_LABELS: Record<CategoryDirection, string> = {
  [CategoryDirection.Income]: 'Income',
  [CategoryDirection.Expense]: 'Expense',
  [CategoryDirection.Both]: 'Both',
};

export const CADENCE_LABELS: Record<Cadence, string> = {
  [Cadence.Daily]: 'Daily',
  [Cadence.Weekly]: 'Weekly',
  [Cadence.BiWeekly]: 'Bi-weekly',
  [Cadence.Monthly]: 'Monthly',
  [Cadence.Quarterly]: 'Quarterly',
  [Cadence.Annually]: 'Annually',
  [Cadence.CustomDays]: 'Custom (every N days)',
};

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.Sunday]: 'Sunday',
  [DayOfWeek.Monday]: 'Monday',
  [DayOfWeek.Tuesday]: 'Tuesday',
  [DayOfWeek.Wednesday]: 'Wednesday',
  [DayOfWeek.Thursday]: 'Thursday',
  [DayOfWeek.Friday]: 'Friday',
  [DayOfWeek.Saturday]: 'Saturday',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.Traditional401k]: 'Traditional 401(k)',
  [AccountType.Roth401k]: 'Roth 401(k)',
  [AccountType.TraditionalIRA]: 'Traditional IRA',
  [AccountType.RothIRA]: 'Roth IRA',
  [AccountType.HSA]: 'HSA',
  [AccountType.Pension]: 'Pension',
  [AccountType.Other]: 'Other',
};

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  [LoanType.Fixed]: 'Fixed',
  [LoanType.ARM]: 'ARM',
  [LoanType.Other]: 'Other',
};

export const COMPOUNDING_FREQUENCY_LABELS: Record<CompoundingFrequency, string> = {
  [CompoundingFrequency.Daily]: 'Daily',
  [CompoundingFrequency.Monthly]: 'Monthly',
  [CompoundingFrequency.Quarterly]: 'Quarterly',
  [CompoundingFrequency.Annual]: 'Annual',
};

export const LINKED_ENTITY_TYPE_LABELS: Record<LinkedEntityType, string> = {
  [LinkedEntityType.SimpleAsset]: 'Simple Asset',
  [LinkedEntityType.Savings]: 'Savings',
  [LinkedEntityType.CreditCardDebt]: 'Credit Card',
  [LinkedEntityType.MortgageDebt]: 'Mortgage',
  [LinkedEntityType.LongTermContainer]: 'Long-Term Container',
  [LinkedEntityType.LongTermItem]: 'Long-Term Item',
  [LinkedEntityType.RetirementContainer]: 'Retirement',
};
