import { Platform } from '../utils/platform';
import {
  CREATE_TABLES_SQL,
  DEFAULT_EXPENSE_TYPES,
  DEFAULT_INCOME_TYPES,
  generateUUID,
} from './schema';

export interface IDatabase {
  getAll<T = any>(sql: string, params?: any[]): T[];
  getFirst<T = any>(sql: string, params?: any[]): T | null;
  run(sql: string, params?: any[]): { changes: number; lastInsertRowId?: number };
  exec(sql: string): void;
  transaction<T>(fn: () => T): T;
}

let dbInstance: IDatabase | null = null;

// Native SQLite implementation via expo-sqlite
class NativeSQLiteDatabase implements IDatabase {
  private db: any;

  constructor() {
    const SQLite = require('expo-sqlite');
    this.db = SQLite.openDatabaseSync('budget_walking_tracker.db');
    this.init();
  }

  private init() {
    this.db.execSync('PRAGMA foreign_keys = ON;');
    this.db.execSync(CREATE_TABLES_SQL);
    try {
      this.db.execSync('ALTER TABLE expense_records ADD COLUMN notes TEXT;');
    } catch (_) {}
    try {
      this.db.execSync('ALTER TABLE income_records ADD COLUMN notes TEXT;');
    } catch (_) {}
    this.seedDefaults();
  }

  private seedDefaults() {
    const incomeCount = this.db.getFirstSync('SELECT COUNT(*) as cnt FROM income_types;') as { cnt: number };
    if (!incomeCount || incomeCount.cnt === 0) {
      const now = Date.now();
      for (const name of DEFAULT_INCOME_TYPES) {
        this.db.runSync(
          'INSERT OR IGNORE INTO income_types (id, name, created_at) VALUES (?, ?, ?);',
          [generateUUID(), name, now]
        );
      }
    }

    const expenseCount = this.db.getFirstSync('SELECT COUNT(*) as cnt FROM expense_types;') as { cnt: number };
    if (!expenseCount || expenseCount.cnt === 0) {
      const now = Date.now();
      for (const name of DEFAULT_EXPENSE_TYPES) {
        this.db.runSync(
          'INSERT OR IGNORE INTO expense_types (id, name, created_at) VALUES (?, ?, ?);',
          [generateUUID(), name, now]
        );
      }
    }
  }

  getAll<T = any>(sql: string, params: any[] = []): T[] {
    return this.db.getAllSync(sql, params) as T[];
  }

  getFirst<T = any>(sql: string, params: any[] = []): T | null {
    const row = this.db.getFirstSync(sql, params);
    return (row as T) || null;
  }

  run(sql: string, params: any[] = []): { changes: number; lastInsertRowId?: number } {
    return this.db.runSync(sql, params);
  }

  exec(sql: string): void {
    this.db.execSync(sql);
  }

  transaction<T>(fn: () => T): T {
    return this.db.withTransactionSync(fn);
  }
}

// In-memory / Web fallback database implementing our relational models
export class MemoryDatabase implements IDatabase {
  public tables: {
    income_types: any[];
    expense_types: any[];
    expense_subtypes: any[];
    income_records: any[];
    expense_records: any[];
    recurring_expenses: any[];
    walking_records: any[];
  } = {
    income_types: [],
    expense_types: [],
    expense_subtypes: [],
    income_records: [],
    expense_records: [],
    recurring_expenses: [],
    walking_records: [],
  };

  constructor() {
    this.loadFromStorage();
    this.seedDefaults();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('budget_walking_db_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.tables = { ...this.tables, ...parsed };
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('budget_walking_db_v1', JSON.stringify(this.tables));
      }
    } catch {
      // Ignore storage write errors
    }
  }

  private seedDefaults() {
    const now = Date.now();
    if (this.tables.income_types.length === 0) {
      for (const name of DEFAULT_INCOME_TYPES) {
        this.tables.income_types.push({ id: generateUUID(), name, created_at: now });
      }
    }
    if (this.tables.expense_types.length === 0) {
      for (const name of DEFAULT_EXPENSE_TYPES) {
        this.tables.expense_types.push({ id: generateUUID(), name, created_at: now });
      }
    }
    this.saveToStorage();
  }

  getAll<T = any>(sql: string, params: any[] = []): T[] {
    const cleanSql = sql.trim();

    // income_types
    if (cleanSql.includes('FROM income_types')) {
      let list = [...this.tables.income_types];
      if (cleanSql.includes('WHERE id = ?')) {
        list = list.filter((t) => t.id === params[0]);
      }
      if (cleanSql.includes('LOWER(name) = LOWER(?)')) {
        const nameParam = (params[0] || '').toLowerCase();
        list = list.filter((t) => t.name.toLowerCase() === nameParam);
      }
      return list.sort((a, b) => a.name.localeCompare(b.name)) as any;
    }

    // expense_types
    if (cleanSql.includes('FROM expense_types')) {
      let list = [...this.tables.expense_types];
      if (cleanSql.includes('WHERE id = ?')) {
        list = list.filter((t) => t.id === params[0]);
      }
      if (cleanSql.includes('LOWER(name) = LOWER(?)')) {
        const nameParam = (params[0] || '').toLowerCase();
        list = list.filter((t) => t.name.toLowerCase() === nameParam);
      }
      return list.sort((a, b) => a.name.localeCompare(b.name)) as any;
    }

    // expense_subtypes
    if (cleanSql.includes('FROM expense_subtypes')) {
      let list = [...this.tables.expense_subtypes];
      if (cleanSql.includes('expense_type_id = ?')) {
        const typeId = params[0];
        list = list.filter((s) => s.expense_type_id === typeId);
      }
      if (cleanSql.includes('LOWER(name) = LOWER(?)')) {
        const nameParam = (params[1] || params[0] || '').toLowerCase();
        list = list.filter((s) => s.name.toLowerCase() === nameParam);
      }
      return list.sort((a, b) => b.usage_count - a.usage_count || a.name.localeCompare(b.name)) as any;
    }

    // income_records
    if (cleanSql.includes('FROM income_records')) {
      let list = this.tables.income_records.map((ir) => {
        const it = this.tables.income_types.find((t) => t.id === ir.type_id);
        return { ...ir, notes: ir.notes || null, type_name: it?.name || 'Unknown' };
      });
      if (cleanSql.includes('WHERE ir.id = ?') || cleanSql.includes('WHERE id = ?')) {
        list = list.filter((r) => r.id === params[0]);
      } else if (cleanSql.includes('date LIKE ?')) {
        const prefix = (params[0] || '').replace('%', '');
        list = list.filter((r) => r.date.startsWith(prefix));
      } else if (cleanSql.includes('date >= ?') && cleanSql.includes('date <= ?')) {
        const [start, end] = params;
        list = list.filter((r) => r.date >= start && r.date <= end);
      }
      list.sort((a, b) => b.date.localeCompare(a.date) || b.created_at - a.created_at);
      if (cleanSql.includes('LIMIT ?')) {
        const limit = params[params.length - 2];
        const offset = params[params.length - 1];
        return list.slice(offset, offset + limit) as any;
      }
      return list as any;
    }

    // expense_records
    if (cleanSql.includes('FROM expense_records')) {
      let list = this.tables.expense_records.map((er) => {
        const et = this.tables.expense_types.find((t) => t.id === er.expense_type_id);
        const es = this.tables.expense_subtypes.find((s) => s.id === er.expense_subtype_id);
        return {
          ...er,
          notes: er.notes || null,
          type_name: et?.name || 'Unknown',
          subtype_name: es?.name || null,
        };
      });
      if (cleanSql.includes('WHERE er.id = ?') || cleanSql.includes('WHERE id = ?')) {
        list = list.filter((r) => r.id === params[0]);
      } else if (cleanSql.includes('date LIKE ?')) {
        const prefix = (params[0] || '').replace('%', '');
        list = list.filter((r) => r.date.startsWith(prefix));
      } else if (cleanSql.includes('date >= ?') && cleanSql.includes('date <= ?')) {
        const [start, end] = params;
        list = list.filter((r) => r.date >= start && r.date <= end);
      }
      list.sort((a, b) => b.date.localeCompare(a.date) || b.created_at - a.created_at);
      if (cleanSql.includes('LIMIT ?')) {
        const limit = params[params.length - 2];
        const offset = params[params.length - 1];
        return list.slice(offset, offset + limit) as any;
      }
      return list as any;
    }

    // recurring_expenses
    if (cleanSql.includes('FROM recurring_expenses')) {
      let list = [...this.tables.recurring_expenses];
      if (cleanSql.includes('WHERE id = ?')) {
        list = list.filter((r) => r.id === params[0]);
      }
      return list.sort((a, b) => b.start_date.localeCompare(a.start_date)) as any;
    }

    // walking_records
    if (cleanSql.includes('FROM walking_records')) {
      let list = [...this.tables.walking_records];
      if (cleanSql.includes('COUNT(*)')) {
        return [{ cnt: list.length }] as any;
      }
      if (cleanSql.includes('WHERE id = ?')) {
        list = list.filter((r) => r.id === params[0]);
      } else if (cleanSql.includes('date = ?')) {
        list = list.filter((r) => r.date === params[0]);
      } else if (cleanSql.includes('date >= ?') && cleanSql.includes('date <= ?')) {
        list = list.filter((r) => r.date >= params[0] && r.date <= params[1]);
      } else if (cleanSql.includes('date LIKE ?')) {
        const prefix = (params[0] || '').replace('%', '');
        list = list.filter((r) => r.date.startsWith(prefix));
      }
      if (cleanSql.includes('DISTINCT date')) {
        const uniqueDates = Array.from(new Set(list.map((r) => r.date))).sort();
        return uniqueDates.map((date) => ({ date })) as any;
      }
      list.sort((a, b) => b.date.localeCompare(a.date) || b.created_at - a.created_at);
      if (cleanSql.includes('LIMIT ?')) {
        const limit = params[params.length - 2];
        const offset = params[params.length - 1];
        return list.slice(offset, offset + limit) as any;
      }
      return list as any;
    }

    return [];
  }

  getFirst<T = any>(sql: string, params: any[] = []): T | null {
    const list = this.getAll<T>(sql, params);
    return list.length > 0 ? list[0] : null;
  }

  run(sql: string, params: any[] = []): { changes: number; lastInsertRowId?: number } {
    const cleanSql = sql.trim();
    let changes = 0;

    // INSERT INTO income_types
    if (cleanSql.includes('INTO income_types')) {
      const [id, name, created_at] = params;
      this.tables.income_types.push({ id, name, created_at });
      changes = 1;
    }
    // INSERT INTO expense_types
    else if (cleanSql.includes('INTO expense_types')) {
      const [id, name, created_at] = params;
      this.tables.expense_types.push({ id, name, created_at });
      changes = 1;
    }
    // INSERT INTO expense_subtypes
    else if (cleanSql.includes('INTO expense_subtypes')) {
      const [id, expense_type_id, name, usage_count, created_at] = params;
      this.tables.expense_subtypes.push({ id, expense_type_id, name, usage_count, created_at });
      changes = 1;
    }
    // UPDATE expense_subtypes
    else if (cleanSql.includes('UPDATE expense_subtypes SET usage_count = usage_count + 1')) {
      const id = params[0];
      const item = this.tables.expense_subtypes.find((s) => s.id === id);
      if (item) {
        item.usage_count += 1;
        changes = 1;
      }
    }
    // INSERT INTO income_records
    else if (cleanSql.includes('INTO income_records')) {
      if (params.length >= 7) {
        const [id, type_id, date, amount, notes, created_at, updated_at] = params;
        this.tables.income_records.push({ id, type_id, date, amount, notes: notes || null, created_at, updated_at });
      } else {
        const [id, type_id, date, amount, created_at, updated_at] = params;
        this.tables.income_records.push({ id, type_id, date, amount, notes: null, created_at, updated_at });
      }
      changes = 1;
    }
    // UPDATE income_records
    else if (cleanSql.includes('UPDATE income_records')) {
      if (params.length >= 6) {
        const [type_id, date, amount, notes, updated_at, id] = params;
        const idx = this.tables.income_records.findIndex((r) => r.id === id);
        if (idx !== -1) {
          this.tables.income_records[idx] = {
            ...this.tables.income_records[idx],
            type_id,
            date,
            amount,
            notes: notes || null,
            updated_at,
          };
          changes = 1;
        }
      } else {
        const [type_id, date, amount, updated_at, id] = params;
        const idx = this.tables.income_records.findIndex((r) => r.id === id);
        if (idx !== -1) {
          this.tables.income_records[idx] = { ...this.tables.income_records[idx], type_id, date, amount, updated_at };
          changes = 1;
        }
      }
    }
    // DELETE FROM income_records
    else if (cleanSql.includes('DELETE FROM income_records')) {
      const id = params[0];
      const prev = this.tables.income_records.length;
      this.tables.income_records = this.tables.income_records.filter((r) => r.id !== id);
      changes = prev - this.tables.income_records.length;
    }
    // INSERT INTO expense_records
    else if (cleanSql.includes('INTO expense_records')) {
      if (params.length >= 8) {
        const [id, expense_type_id, expense_subtype_id, date, amount, notes, created_at, updated_at] = params;
        this.tables.expense_records.push({
          id,
          expense_type_id,
          expense_subtype_id: expense_subtype_id || null,
          date,
          amount,
          notes: notes || null,
          created_at,
          updated_at,
        });
      } else {
        const [id, expense_type_id, expense_subtype_id, date, amount, created_at, updated_at] = params;
        this.tables.expense_records.push({
          id,
          expense_type_id,
          expense_subtype_id: expense_subtype_id || null,
          date,
          amount,
          notes: null,
          created_at,
          updated_at,
        });
      }
      changes = 1;
    }
    // UPDATE expense_records
    else if (cleanSql.includes('UPDATE expense_records')) {
      if (params.length >= 7) {
        const [expense_type_id, expense_subtype_id, date, amount, notes, updated_at, id] = params;
        const idx = this.tables.expense_records.findIndex((r) => r.id === id);
        if (idx !== -1) {
          this.tables.expense_records[idx] = {
            ...this.tables.expense_records[idx],
            expense_type_id,
            expense_subtype_id: expense_subtype_id || null,
            date,
            amount,
            notes: notes || null,
            updated_at,
          };
          changes = 1;
        }
      } else {
        const [expense_type_id, expense_subtype_id, date, amount, updated_at, id] = params;
        const idx = this.tables.expense_records.findIndex((r) => r.id === id);
        if (idx !== -1) {
          this.tables.expense_records[idx] = {
            ...this.tables.expense_records[idx],
            expense_type_id,
            expense_subtype_id: expense_subtype_id || null,
            date,
            amount,
            updated_at,
          };
          changes = 1;
        }
      }
    }
    // DELETE FROM expense_records
    else if (cleanSql.includes('DELETE FROM expense_records')) {
      const id = params[0];
      const prev = this.tables.expense_records.length;
      this.tables.expense_records = this.tables.expense_records.filter((r) => r.id !== id);
      changes = prev - this.tables.expense_records.length;
    }
    // INSERT INTO recurring_expenses
    else if (cleanSql.includes('INTO recurring_expenses')) {
      const [id, name, amount, start_date, end_date, created_at, updated_at] = params;
      this.tables.recurring_expenses.push({ id, name, amount, start_date, end_date, created_at, updated_at });
      changes = 1;
    }
    // UPDATE recurring_expenses
    else if (cleanSql.includes('UPDATE recurring_expenses')) {
      const [name, amount, start_date, end_date, updated_at, id] = params;
      const idx = this.tables.recurring_expenses.findIndex((r) => r.id === id);
      if (idx !== -1) {
        this.tables.recurring_expenses[idx] = {
          ...this.tables.recurring_expenses[idx],
          name,
          amount,
          start_date,
          end_date,
          updated_at,
        };
        changes = 1;
      }
    }
    // DELETE FROM recurring_expenses
    else if (cleanSql.includes('DELETE FROM recurring_expenses')) {
      const id = params[0];
      const prev = this.tables.recurring_expenses.length;
      this.tables.recurring_expenses = this.tables.recurring_expenses.filter((r) => r.id !== id);
      changes = prev - this.tables.recurring_expenses.length;
    }
    // INSERT INTO walking_records
    else if (cleanSql.includes('INTO walking_records')) {
      const [id, date, steps, distance_km, speed_kmh, created_at, updated_at] = params;
      this.tables.walking_records.push({ id, date, steps, distance_km, speed_kmh, created_at, updated_at });
      changes = 1;
    }
    // UPDATE walking_records
    else if (cleanSql.includes('UPDATE walking_records')) {
      const [date, steps, distance_km, speed_kmh, updated_at, id] = params;
      const idx = this.tables.walking_records.findIndex((r) => r.id === id);
      if (idx !== -1) {
        this.tables.walking_records[idx] = {
          ...this.tables.walking_records[idx],
          date,
          steps,
          distance_km,
          speed_kmh,
          updated_at,
        };
        changes = 1;
      }
    }
    // DELETE FROM walking_records
    else if (cleanSql.includes('DELETE FROM walking_records')) {
      const id = params[0];
      const prev = this.tables.walking_records.length;
      this.tables.walking_records = this.tables.walking_records.filter((r) => r.id !== id);
      changes = prev - this.tables.walking_records.length;
    }
    // DELETE category types
    else if (cleanSql.includes('DELETE FROM income_types')) {
      const id = params[0];
      this.tables.income_types = this.tables.income_types.filter((t) => t.id !== id);
      changes = 1;
    } else if (cleanSql.includes('DELETE FROM expense_types')) {
      const id = params[0];
      this.tables.expense_types = this.tables.expense_types.filter((t) => t.id !== id);
      this.tables.expense_subtypes = this.tables.expense_subtypes.filter((s) => s.expense_type_id !== id);
      changes = 1;
    }

    this.saveToStorage();
    return { changes };
  }

  exec(_sql: string): void {
    // Schema creation is handled in-memory
  }

  transaction<T>(fn: () => T): T {
    return fn();
  }

  resetAll(): void {
    this.tables = {
      income_types: [],
      expense_types: [],
      expense_subtypes: [],
      income_records: [],
      expense_records: [],
      recurring_expenses: [],
      walking_records: [],
    };
    this.seedDefaults();
  }
}

export function getDB(): IDatabase {
  if (!dbInstance) {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        dbInstance = new NativeSQLiteDatabase();
      } catch (err) {
        console.warn('Could not initialize native SQLite, falling back to in-memory/localStorage store', err);
        dbInstance = new MemoryDatabase();
      }
    } else {
      dbInstance = new MemoryDatabase();
    }
  }
  return dbInstance;
}

export function setTestDB(customDB: IDatabase): void {
  dbInstance = customDB;
}
