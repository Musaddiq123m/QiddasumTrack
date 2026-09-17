import {
  ChartDataPoint,
  DateGroupedExpenses,
  ExpenseRecord,
  ExpenseSubtype,
  ExpenseType,
  HorizontalBarItem,
} from '../../types';
import { getDB } from '../database';
import { generateUUID } from '../schema';
import { RecurringRepo } from './recurringRepo';
import { formatDisplayDate, getPast12Months } from '../../utils/dateUtils';

const EXPENSE_PALETTE = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export class ExpenseRepo {
  // --- Category Types ---
  static getTypes(): ExpenseType[] {
    const db = getDB();
    return db.getAll<ExpenseType>('SELECT * FROM expense_types ORDER BY name ASC;');
  }

  static addType(name: string): ExpenseType {
    const db = getDB();
    const cleanName = name.trim();
    const existing = db.getFirst<ExpenseType>('SELECT * FROM expense_types WHERE LOWER(name) = LOWER(?);', [cleanName]);
    if (existing) return existing;

    const id = generateUUID();
    const now = Date.now();
    db.run('INSERT INTO expense_types (id, name, created_at) VALUES (?, ?, ?);', [id, cleanName, now]);
    return { id, name: cleanName, created_at: now };
  }

  static deleteType(id: string): boolean {
    const db = getDB();
    const result = db.run('DELETE FROM expense_types WHERE id = ?;', [id]);
    return result.changes > 0;
  }

  // --- Subtypes (Frequency Ordered) ---
  static getSubtypesForType(expenseTypeId: string): ExpenseSubtype[] {
    const db = getDB();
    return db.getAll<ExpenseSubtype>(
      'SELECT * FROM expense_subtypes WHERE expense_type_id = ? ORDER BY usage_count DESC, name ASC;',
      [expenseTypeId]
    );
  }

  /**
   * Find or create subtype and increment usage frequency
   */
  static ensureSubtype(expenseTypeId: string, name?: string | null): string | null {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const db = getDB();

    const existing = db.getFirst<ExpenseSubtype>(
      'SELECT * FROM expense_subtypes WHERE expense_type_id = ? AND LOWER(name) = LOWER(?);',
      [expenseTypeId, cleanName]
    );

    if (existing) {
      db.run('UPDATE expense_subtypes SET usage_count = usage_count + 1 WHERE id = ?;', [existing.id]);
      return existing.id;
    }

    const id = generateUUID();
    const now = Date.now();
    db.run(
      'INSERT INTO expense_subtypes (id, expense_type_id, name, usage_count, created_at) VALUES (?, ?, ?, ?, ?);',
      [id, expenseTypeId, cleanName, 1, now]
    );
    return id;
  }

  // --- Records ---
  static getAll(limit: number = 100, offset: number = 0): ExpenseRecord[] {
    const db = getDB();
    return db.getAll<ExpenseRecord>(
      `SELECT er.*, et.name as type_name, es.name as subtype_name 
       FROM expense_records er 
       JOIN expense_types et ON er.expense_type_id = et.id 
       LEFT JOIN expense_subtypes es ON er.expense_subtype_id = es.id 
       ORDER BY er.date DESC, er.created_at DESC 
       LIMIT ? OFFSET ?;`,
      [limit, offset]
    );
  }

  static getForMonth(yearMonth: string): ExpenseRecord[] {
    const db = getDB();
    return db.getAll<ExpenseRecord>(
      `SELECT er.*, et.name as type_name, es.name as subtype_name 
       FROM expense_records er 
       JOIN expense_types et ON er.expense_type_id = et.id 
       LEFT JOIN expense_subtypes es ON er.expense_subtype_id = es.id 
       WHERE er.date LIKE ? 
       ORDER BY er.date DESC, er.created_at DESC;`,
      [`${yearMonth}%`]
    );
  }

  static getById(id: string): ExpenseRecord | null {
    const db = getDB();
    return db.getFirst<ExpenseRecord>(
      `SELECT er.*, et.name as type_name, es.name as subtype_name 
       FROM expense_records er 
       JOIN expense_types et ON er.expense_type_id = et.id 
       LEFT JOIN expense_subtypes es ON er.expense_subtype_id = es.id 
       WHERE er.id = ?;`,
      [id]
    );
  }

  static add(expenseTypeId: string, subtypeName: string | null | undefined, amount: number, date: string): ExpenseRecord {
    const subtypeId = this.ensureSubtype(expenseTypeId, subtypeName);
    const db = getDB();
    const id = generateUUID();
    const now = Date.now();
    db.run(
      'INSERT INTO expense_records (id, expense_type_id, expense_subtype_id, date, amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [id, expenseTypeId, subtypeId, date, amount, now, now]
    );
    return this.getById(id)!;
  }

  static update(id: string, expenseTypeId: string, subtypeName: string | null | undefined, amount: number, date: string): boolean {
    const subtypeId = this.ensureSubtype(expenseTypeId, subtypeName);
    const db = getDB();
    const now = Date.now();
    const result = db.run(
      'UPDATE expense_records SET expense_type_id = ?, expense_subtype_id = ?, date = ?, amount = ?, updated_at = ? WHERE id = ?;',
      [expenseTypeId, subtypeId, date, amount, now, id]
    );
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const db = getDB();
    const result = db.run('DELETE FROM expense_records WHERE id = ?;', [id]);
    return result.changes > 0;
  }

  // --- Timeline with Date Grouping & Recurring Section ---
  static getTimelineGrouped(limit: number = 60, offset: number = 0): DateGroupedExpenses[] {
    const records = this.getAll(limit, offset);
    const dateMap: { [date: string]: ExpenseRecord[] } = {};

    for (const rec of records) {
      if (!dateMap[rec.date]) {
        dateMap[rec.date] = [];
      }
      dateMap[rec.date].push(rec);
    }

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));
    const grouped: DateGroupedExpenses[] = [];

    for (const d of sortedDates) {
      const expenses = dateMap[d];
      const recurringAllocations = RecurringRepo.getAllocationsForDate(d);
      const totalDirect = expenses.reduce((sum, e) => sum + e.amount, 0);

      grouped.push({
        date: d,
        displayDate: formatDisplayDate(d),
        totalExpense: Math.round(totalDirect),
        expenses,
        recurringAllocations,
      });
    }

    return grouped;
  }

  // --- Monthly Expense Ranking (Horizontal Bar Chart) ---
  /**
   * Ranked horizontal bars for a month:
   * - Normal expense types (sum of records in that month)
   * - Recurring expenses appear as their own separate categories (Rent, Gym, etc.)
   */
  static getMonthlyRankingWithRecurring(yearMonth: string): { items: HorizontalBarItem[]; total: number } {
    const records = this.getForMonth(yearMonth);
    const typeTotals: { [typeId: string]: { name: string; amount: number } } = {};

    for (const rec of records) {
      const typeId = rec.expense_type_id;
      const typeName = rec.type_name || 'Other';
      if (!typeTotals[typeId]) {
        typeTotals[typeId] = { name: typeName, amount: 0 };
      }
      typeTotals[typeId].amount += rec.amount;
    }

    const items: HorizontalBarItem[] = [];

    // Normal expense categories
    for (const [typeId, data] of Object.entries(typeTotals)) {
      items.push({
        id: typeId,
        name: data.name,
        amount: Math.round(data.amount),
        percentage: 0,
        color: '',
        isRecurring: false,
      });
    }

    // Recurring expenses for this month
    const recurringTotals = RecurringRepo.getMonthlyRecurringTotals(yearMonth);
    for (const rec of recurringTotals) {
      items.push({
        id: `rec_${rec.recurringId}`,
        name: rec.name,
        amount: Math.round(rec.amount),
        percentage: 0,
        color: '',
        isRecurring: true,
      });
    }

    // Sort by amount descending
    items.sort((a, b) => b.amount - a.amount);

    const grandTotal = items.reduce((sum, item) => sum + item.amount, 0);
    items.forEach((item, idx) => {
      item.percentage = grandTotal > 0 ? Math.round((item.amount / grandTotal) * 100) : 0;
      item.color = item.isRecurring ? '#6366F1' : EXPENSE_PALETTE[idx % EXPENSE_PALETTE.length];
    });

    return { items, total: Math.round(grandTotal) };
  }

  // --- Subtype Drilldown Breakdown (Horizontal Bar Chart) ---
  /**
   * For normal expense types: breakdown by subtype in the selected month
   */
  static getSubtypeBreakdown(expenseTypeId: string, yearMonth: string): { items: HorizontalBarItem[]; total: number } {
    const records = this.getForMonth(yearMonth).filter((r) => r.expense_type_id === expenseTypeId);
    const subtypeTotals: { [name: string]: number } = {};
    let grandTotal = 0;

    for (const rec of records) {
      const name = rec.subtype_name || 'General / None';
      subtypeTotals[name] = (subtypeTotals[name] || 0) + rec.amount;
      grandTotal += rec.amount;
    }

    const items: HorizontalBarItem[] = Object.keys(subtypeTotals).map((name, idx) => {
      const amount = Math.round(subtypeTotals[name]);
      return {
        id: name,
        name,
        amount,
        percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
        color: EXPENSE_PALETTE[idx % EXPENSE_PALETTE.length],
        isRecurring: false,
      };
    });

    items.sort((a, b) => b.amount - a.amount);
    return { items, total: Math.round(grandTotal) };
  }

  // --- Yearly Expense Line Chart (Last 12 Months) ---
  /**
   * Total expenses per month including recurring allocations
   */
  static getYearlyLineData(selectedMonthKey?: string): ChartDataPoint[] {
    const months = getPast12Months(selectedMonthKey);
    const result: ChartDataPoint[] = [];

    for (const m of months) {
      const records = this.getForMonth(m.key);
      const directTotal = records.reduce((sum, r) => sum + r.amount, 0);

      const recurringTotals = RecurringRepo.getMonthlyRecurringTotals(m.key);
      const recurringTotal = recurringTotals.reduce((sum, r) => sum + r.amount, 0);

      const total = Math.round(directTotal + recurringTotal);
      result.push({
        label: m.label,
        value: total,
        rawKey: m.key,
      });
    }

    return result;
  }
}
