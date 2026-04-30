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
