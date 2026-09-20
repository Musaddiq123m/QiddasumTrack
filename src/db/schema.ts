export const DEFAULT_INCOME_TYPES = [
  'Salary',
  'Parents',
  'Freelance',
  'Bonus',
  'Other',
];

export const DEFAULT_EXPENSE_TYPES = [
  'Food',
  'Transportation',
  'Clothing',
  'Grocery',
  'Electronics',
  'Others',
];

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS income_types (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS expense_types (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS expense_subtypes (
  id TEXT PRIMARY KEY,
  expense_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(expense_type_id, name),
  FOREIGN KEY(expense_type_id) REFERENCES expense_types(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subtypes_usage ON expense_subtypes(expense_type_id, usage_count DESC);

CREATE TABLE IF NOT EXISTS income_records (
  id TEXT PRIMARY KEY,
  type_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(type_id) REFERENCES income_types(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_income_date ON income_records(date DESC);

CREATE TABLE IF NOT EXISTS expense_records (
  id TEXT PRIMARY KEY,
  expense_type_id TEXT NOT NULL,
  expense_subtype_id TEXT,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(expense_type_id) REFERENCES expense_types(id) ON DELETE RESTRICT,
  FOREIGN KEY(expense_subtype_id) REFERENCES expense_subtypes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expense_date ON expense_records(date DESC);

CREATE TABLE IF NOT EXISTS recurring_expenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_dates ON recurring_expenses(start_date, end_date);

CREATE TABLE IF NOT EXISTS walking_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  steps INTEGER NOT NULL,
  distance_km REAL NOT NULL,
  speed_kmh REAL NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_walking_date ON walking_records(date DESC);
`;

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
