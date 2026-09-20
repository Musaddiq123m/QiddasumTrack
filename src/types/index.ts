export interface WalkingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  steps: number;
  distance_km: number;
  speed_kmh: number;
  created_at: number;
  updated_at: number;
}

export interface IncomeType {
  id: string;
  name: string;
  created_at: number;
}

export interface IncomeRecord {
  id: string;
  type_id: string;
  type_name?: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes?: string | null;
  created_at: number;
  updated_at: number;
}

export interface ExpenseType {
  id: string;
  name: string;
  created_at: number;
}

export interface ExpenseSubtype {
  id: string;
  expense_type_id: string;
  name: string;
  usage_count: number;
  created_at: number;
}

export interface ExpenseRecord {
  id: string;
  expense_type_id: string;
  type_name?: string;
  expense_subtype_id: string | null;
  subtype_name?: string | null;
  date: string; // YYYY-MM-DD
  amount: number;
  notes?: string | null;
  created_at: number;
  updated_at: number;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  daily_cost?: number;
  created_at: number;
  updated_at: number;
}

export interface DailyAllocation {
  id: string;
  name: string;
  daily_cost: number;
  total_amount: number;
  start_date: string;
  end_date: string;
}

export interface DateGroupedExpenses {
  date: string;
  displayDate: string; // "TODAY", "YESTERDAY", or "15 Sep 2026"
  totalExpense: number;
  expenses: ExpenseRecord[];
  recurringAllocations: DailyAllocation[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  rawKey?: string; // e.g. YYYY-MM for drilldown
  distanceKm?: number;
  steps?: number;
  speedKmh?: number;
  durationHours?: number;
  durationMinutes?: number;
  periodTitle?: string;
}

export interface StackedBarGroup {
  label: string;
  key: string; // YYYY-MM
  total: number;
  stacks: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface HorizontalBarItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  isRecurring?: boolean;
}
