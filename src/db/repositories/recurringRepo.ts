import { DailyAllocation, RecurringExpense } from '../../types';
import { getDB } from '../database';
import { generateUUID } from '../schema';
import { getDaysDifference, getTodayString } from '../../utils/dateUtils';

export class RecurringRepo {
  static getAll(): RecurringExpense[] {
    const db = getDB();
    const rows = db.getAll<RecurringExpense>('SELECT * FROM recurring_expenses ORDER BY start_date DESC;');
    return rows.map((r) => {
      const days = Math.max(1, getDaysDifference(r.start_date, r.end_date));
      return {
        ...r,
        daily_cost: Math.round(r.amount / days),
      };
    });
  }

  static getById(id: string): RecurringExpense | null {
    const db = getDB();
    const row = db.getFirst<RecurringExpense>('SELECT * FROM recurring_expenses WHERE id = ?;', [id]);
    if (!row) return null;
    const days = Math.max(1, getDaysDifference(row.start_date, row.end_date));
    return {
      ...row,
      daily_cost: Math.round(row.amount / days),
    };
  }

  static add(name: string, amount: number, startDate: string, endDate: string): RecurringExpense {
    const db = getDB();
    const id = generateUUID();
    const now = Date.now();
    db.run(
      'INSERT INTO recurring_expenses (id, name, amount, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [id, name.trim(), amount, startDate, endDate, now, now]
    );
    return this.getById(id)!;
  }

  static update(id: string, name: string, amount: number, startDate: string, endDate: string): boolean {
    const db = getDB();
    const now = Date.now();
    const result = db.run(
      'UPDATE recurring_expenses SET name = ?, amount = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?;',
      [name.trim(), amount, startDate, endDate, now, id]
    );
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const db = getDB();
    const result = db.run('DELETE FROM recurring_expenses WHERE id = ?;', [id]);
    return result.changes > 0;
  }

  /**
   * Get active recurring expenses for a specific single date
   */
  static getAllocationsForDate(dateStr: string): DailyAllocation[] {
    const recurring = this.getAll();
    const allocations: DailyAllocation[] = [];

    for (const item of recurring) {
      if (dateStr >= item.start_date && dateStr <= item.end_date) {
        const totalDays = Math.max(1, getDaysDifference(item.start_date, item.end_date));
        // Calculate daily allocation avoiding rounding errors:
        // dailyBase = floor(amount * 100 / totalDays) / 100
        // Remainder cents are allocated to the first few days
        const totalCents = Math.round(item.amount * 100);
        const baseCents = Math.floor(totalCents / totalDays);
        const remainderCents = totalCents - (baseCents * totalDays);

        const currentDayIndex = getDaysDifference(item.start_date, dateStr) - 1;
        const dayCents = currentDayIndex < remainderCents ? baseCents + 1 : baseCents;
        const dailyCost = dayCents / 100;

        allocations.push({
          id: item.id,
          name: item.name,
          daily_cost: Number((dayCents / 100).toFixed(2)),
          total_amount: item.amount,
          start_date: item.start_date,
          end_date: item.end_date,
        });
      }
    }

    return allocations;
  }

  /**
   * Get total allocated cost of all recurring expenses for a given month (YYYY-MM)
   * Each recurring expense contributes its daily cost for each day it was active in that month.
   */
  static getMonthlyRecurringTotals(yearMonth: string): { name: string; amount: number; recurringId: string }[] {
    const recurring = this.getAll();
    const [y, m] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();

    const totalsMap: { [id: string]: { name: string; amount: number; recurringId: string } } = {};

    for (const item of recurring) {
      let monthTotal = 0;
      const totalDays = Math.max(1, getDaysDifference(item.start_date, item.end_date));
      const totalCents = Math.round(item.amount * 100);
      const baseCents = Math.floor(totalCents / totalDays);
      const remainderCents = totalCents - (baseCents * totalDays);

      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${y}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`;
        if (dStr >= item.start_date && dStr <= item.end_date) {
          const dayIndex = getDaysDifference(item.start_date, dStr) - 1;
          const dayCents = dayIndex < remainderCents ? baseCents + 1 : baseCents;
          monthTotal += dayCents / 100;
        }
      }

      if (monthTotal > 0) {
        totalsMap[item.id] = {
          recurringId: item.id,
          name: item.name,
          amount: Math.round(monthTotal),
        };
      }
    }

    return Object.values(totalsMap);
  }

  /**
   * Check for recurring expenses expiring within N days (default 2 days before end date).
   * Generates persistent warning banner until renewed or extended.
   */
  static getExpiringWithin(daysNotice: number = 2, todayDateStr?: string): { expense: RecurringExpense; daysRemaining: number }[] {
    const today = todayDateStr || getTodayString();
    const all = this.getAll();
    const expiring: { expense: RecurringExpense; daysRemaining: number }[] = [];

    for (const item of all) {
      // Days remaining until end_date
      // if today is 2026-09-28 and end_date is 2026-09-30, diff is 2 days
      const daysUntilEnd = getDaysDifference(today, item.end_date) - 1;
      // We warn if it is active (today <= end_date) and daysUntilEnd <= daysNotice
      if (daysUntilEnd >= 0 && daysUntilEnd <= daysNotice) {
        expiring.push({
          expense: item,
          daysRemaining: daysUntilEnd,
        });
      }
    }

    return expiring;
  }
}
