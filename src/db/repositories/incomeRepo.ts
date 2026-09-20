import { IncomeRecord, IncomeType, PieSlice, StackedBarGroup } from '../../types';
import { getDB } from '../database';
import { generateUUID } from '../schema';
import { getPast12Months } from '../../utils/dateUtils';

import { THEME } from '../../theme/colors';

const PALETTE = THEME.chartPalette;

export class IncomeRepo {
  // --- Category Types ---
  static getTypes(): IncomeType[] {
    const db = getDB();
    return db.getAll<IncomeType>('SELECT * FROM income_types ORDER BY name ASC;');
  }

  static addType(name: string): IncomeType {
    const db = getDB();
    const cleanName = name.trim();
    const existing = db.getFirst<IncomeType>('SELECT * FROM income_types WHERE LOWER(name) = LOWER(?);', [cleanName]);
    if (existing) return existing;

    const id = generateUUID();
    const now = Date.now();
    db.run('INSERT INTO income_types (id, name, created_at) VALUES (?, ?, ?);', [id, cleanName, now]);
    return { id, name: cleanName, created_at: now };
  }

  static deleteType(id: string): boolean {
    const db = getDB();
    const result = db.run('DELETE FROM income_types WHERE id = ?;', [id]);
    return result.changes > 0;
  }

  // --- Records ---
  static getAll(limit: number = 100, offset: number = 0): IncomeRecord[] {
    const db = getDB();
    return db.getAll<IncomeRecord>(
      `SELECT ir.*, it.name as type_name 
       FROM income_records ir 
       JOIN income_types it ON ir.type_id = it.id 
       ORDER BY ir.date DESC, ir.created_at DESC 
       LIMIT ? OFFSET ?;`,
      [limit, offset]
    );
  }

  static getForMonth(yearMonth: string): IncomeRecord[] {
    const db = getDB();
    return db.getAll<IncomeRecord>(
      `SELECT ir.*, it.name as type_name 
       FROM income_records ir 
       JOIN income_types it ON ir.type_id = it.id 
       WHERE ir.date LIKE ? 
       ORDER BY ir.date DESC, ir.created_at DESC;`,
      [`${yearMonth}%`]
    );
  }

  static getById(id: string): IncomeRecord | null {
    const db = getDB();
    return db.getFirst<IncomeRecord>(
      `SELECT ir.*, it.name as type_name 
       FROM income_records ir 
       JOIN income_types it ON ir.type_id = it.id 
       WHERE ir.id = ?;`,
      [id]
    );
  }

  static add(typeId: string, amount: number, date: string, notes?: string | null): IncomeRecord {
    const db = getDB();
    const id = generateUUID();
    const now = Date.now();
    db.run(
      'INSERT INTO income_records (id, type_id, date, amount, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [id, typeId, date, amount, notes || null, now, now]
    );
    return this.getById(id)!;
  }

  static update(id: string, typeId: string, amount: number, date: string, notes?: string | null): boolean {
    const db = getDB();
    const now = Date.now();
    const result = db.run(
      'UPDATE income_records SET type_id = ?, date = ?, amount = ?, notes = ?, updated_at = ? WHERE id = ?;',
      [typeId, date, amount, notes || null, now, id]
    );
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const db = getDB();
    const result = db.run('DELETE FROM income_records WHERE id = ?;', [id]);
    return result.changes > 0;
  }

  // --- Visualizations ---

  /**
   * Monthly Income Distribution by Type (Pie Chart)
   */
  static getMonthlyDistribution(yearMonth: string): { slices: PieSlice[]; total: number } {
    const records = this.getForMonth(yearMonth);
    const totalsByType: { [typeId: string]: { name: string; total: number } } = {};
    let grandTotal = 0;

    for (const rec of records) {
      const typeId = rec.type_id;
      const typeName = rec.type_name || 'Other';
      if (!totalsByType[typeId]) {
        totalsByType[typeId] = { name: typeName, total: 0 };
      }
      totalsByType[typeId].total += rec.amount;
      grandTotal += rec.amount;
    }

    const entries = Object.values(totalsByType).sort((a, b) => b.total - a.total);
    const slices: PieSlice[] = entries.map((item, idx) => ({
      label: item.name,
      value: Math.round(item.total),
      percentage: grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0,
      color: PALETTE[idx % PALETTE.length],
    }));

    return { slices, total: Math.round(grandTotal) };
  }

  /**
   * Yearly Income View (12 Months Stacked Bar Chart)
   */
  static getYearlyStackedBars(selectedMonthKey?: string): { groups: StackedBarGroup[]; typeColors: { [type: string]: string } } {
    const months = getPast12Months(selectedMonthKey);
    const allTypes = this.getTypes();
    const typeColors: { [type: string]: string } = {};

    allTypes.forEach((t, i) => {
      typeColors[t.name] = PALETTE[i % PALETTE.length];
    });

    const groups: StackedBarGroup[] = [];

    for (const m of months) {
      const records = this.getForMonth(m.key);
      const stacksMap: { [typeName: string]: number } = {};
      let monthTotal = 0;

      for (const rec of records) {
        const typeName = rec.type_name || 'Other';
        stacksMap[typeName] = (stacksMap[typeName] || 0) + rec.amount;
        monthTotal += rec.amount;
      }

      const stacks = Object.keys(stacksMap).map((typeName) => ({
        name: typeName,
        value: Math.round(stacksMap[typeName]),
        color: typeColors[typeName] || '#94A3B8',
      }));

      groups.push({
        label: m.label,
        key: m.key,
        total: Math.round(monthTotal),
        stacks,
      });
    }

    return { groups, typeColors };
  }
}
