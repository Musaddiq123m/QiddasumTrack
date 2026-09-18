import { ChartDataPoint, WalkingRecord } from '../../types';
import { getDB } from '../database';
import { generateUUID } from '../schema';
import {
  addDays,
  getPast12Months,
  getPast12Weeks,
  getPast7Days,
  getTodayString,
  getYesterdayString,
} from '../../utils/dateUtils';

export class WalkingRepo {
  static getAll(limit: number = 100, offset: number = 0): WalkingRecord[] {
    const db = getDB();
    return db.getAll<WalkingRecord>(
      'SELECT * FROM walking_records ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?;',
      [limit, offset]
    );
  }

  static getTotalCount(): number {
    const db = getDB();
    const row = db.getFirst<{ cnt: number }>('SELECT COUNT(*) as cnt FROM walking_records;');
    return row ? Number(row.cnt) : 0;
  }

  static getForDate(dateStr: string): WalkingRecord[] {
    const db = getDB();
    return db.getAll<WalkingRecord>(
      'SELECT * FROM walking_records WHERE date = ? ORDER BY created_at DESC;',
      [dateStr]
    );
  }

  static getById(id: string): WalkingRecord | null {
    const db = getDB();
    return db.getFirst<WalkingRecord>('SELECT * FROM walking_records WHERE id = ?;', [id]);
  }

  static add(steps: number, distanceKm: number, speedKmh: number, date: string): WalkingRecord {
    const db = getDB();
    const id = generateUUID();
    const now = Date.now();
    db.run(
      'INSERT INTO walking_records (id, date, steps, distance_km, speed_kmh, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [id, date, Math.max(0, Math.round(steps)), Math.max(0, distanceKm), Math.max(0, speedKmh), now, now]
    );
    return this.getById(id)!;
  }

  static update(id: string, steps: number, distanceKm: number, speedKmh: number, date: string): boolean {
    const db = getDB();
    const now = Date.now();
    const result = db.run(
      'UPDATE walking_records SET date = ?, steps = ?, distance_km = ?, speed_kmh = ?, updated_at = ? WHERE id = ?;',
      [date, Math.max(0, Math.round(steps)), Math.max(0, distanceKm), Math.max(0, speedKmh), now, id]
    );
    return result.changes > 0;
  }

  static delete(id: string): boolean {
    const db = getDB();
    const result = db.run('DELETE FROM walking_records WHERE id = ?;', [id]);
    return result.changes > 0;
  }

  /**
   * Returns a set of YYYY-MM-DD dates for a given month that had walking records.
   */
  static getWalkedDatesForMonth(year: number, month: number): Set<string> {
    const db = getDB();
    const mStr = month < 10 ? `0${month}` : `${month}`;
    const start = `${year}-${mStr}-01`;
    const end = `${year}-${mStr}-31`;

    const rows = db.getAll<{ date: string }>(
      'SELECT DISTINCT date FROM walking_records WHERE date >= ? AND date <= ?;',
      [start, end]
    );
    return new Set(rows.map((r) => r.date));
  }

  /**
   * Streak calculation:
   * A day counts as a walking day if the user has at least one record.
   * If walked today, streak is consecutive days ending today.
   * If not walked today, streak reflects the consecutive sequence ending yesterday.
   * Resets when there is a missing walking day.
   */
  static calculateStreak(todayDateStr?: string): number {
    const db = getDB();
    const today = todayDateStr || getTodayString();
    const yesterday = getYesterdayString();

    const uniqueDatesRows = db.getAll<{ date: string }>('SELECT DISTINCT date FROM walking_records ORDER BY date DESC;');
    const dateSet = new Set(uniqueDatesRows.map((r) => r.date));

    let checkDate: string;
    if (dateSet.has(today)) {
      checkDate = today;
    } else if (dateSet.has(yesterday)) {
      checkDate = yesterday;
    } else {
      return 0; // No walk today or yesterday -> streak broken
    }

    let streak = 0;
    while (dateSet.has(checkDate)) {
      streak += 1;
      checkDate = addDays(checkDate, -1);
    }

    return streak;
  }

  /**
   * Line Chart Data for walking:
   * - 7 days: Day by day
   * - 12 weeks: Aggregated by week
   * - 12 months: Aggregated by month
   * Metric: 'steps' or 'distance'
   */
  static getChartData(
    timeframe: '7d' | '12w' | '12m',
    metric: 'steps' | 'distance'
  ): ChartDataPoint[] {
    const db = getDB();

    if (timeframe === '7d') {
      const days = getPast7Days();
      return days.map((d) => {
        const records = db.getAll<WalkingRecord>('SELECT * FROM walking_records WHERE date = ?;', [d.date]);
        const val = records.reduce(
          (sum, r) => sum + (metric === 'steps' ? r.steps : r.distance_km),
          0
        );
        return {
          label: d.label,
          value: metric === 'steps' ? Math.round(val) : Number(val.toFixed(1)),
          rawKey: d.date,
        };
      });
    }

    if (timeframe === '12w') {
      const weeks = getPast12Weeks();
      return weeks.map((w) => {
        const records = db.getAll<WalkingRecord>(
          'SELECT * FROM walking_records WHERE date >= ? AND date <= ?;',
          [w.start, w.end]
        );
        const val = records.reduce(
          (sum, r) => sum + (metric === 'steps' ? r.steps : r.distance_km),
          0
        );
        return {
          label: w.label,
          value: metric === 'steps' ? Math.round(val) : Number(val.toFixed(1)),
          rawKey: `${w.start} to ${w.end}`,
        };
      });
    }

    // 12m
    const months = getPast12Months();
    return months.map((m) => {
      const records = db.getAll<WalkingRecord>(
        'SELECT * FROM walking_records WHERE date LIKE ?;',
        [`${m.key}%`]
      );
      const val = records.reduce(
        (sum, r) => sum + (metric === 'steps' ? r.steps : r.distance_km),
        0
      );
      return {
        label: m.label,
        value: metric === 'steps' ? Math.round(val) : Number(val.toFixed(1)),
        rawKey: m.key,
      };
    });
  }
}
