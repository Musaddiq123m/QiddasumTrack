import * as XLSX from 'xlsx';
import { Platform } from '../../utils/platform';
import { padZero } from '../../utils/dateUtils';
import { getDB } from '../database';
import { WalkingRepo } from './walkingRepo';
import { IncomeRepo } from './incomeRepo';
import { ExpenseRepo } from './expenseRepo';
import { RecurringRepo } from './recurringRepo';

export interface BackupData {
  income_types: any[];
  expense_types: any[];
  expense_subtypes: any[];
  income_records: any[];
  expense_records: any[];
  recurring_expenses: any[];
  walking_records: any[];
  exported_at: string;
}

export class BackupRepo {
  /**
   * Export all database tables into an Excel (.xlsx) file and trigger system share sheet
   */
  static async exportToExcel(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const db = getDB();
      const walking = WalkingRepo.getAll(5000, 0);
      const income = IncomeRepo.getAll(5000, 0);
      const expenses = ExpenseRepo.getAll(5000, 0);
      const recurring = RecurringRepo.getAll();
      const incomeTypes = IncomeRepo.getTypes();
      const expenseTypes = ExpenseRepo.getTypes();
      const subtypes = db.getAll('SELECT * FROM expense_subtypes ORDER BY usage_count DESC;');

      // 1. Walking sheet
      const walkingRows = walking.map((w) => ({
        ID: w.id,
        Date: w.date,
        Steps: w.steps,
        Distance_KM: w.distance_km,
        Speed_KMH: w.speed_kmh,
        Created_At: new Date(w.created_at).toISOString(),
      }));

      // 2. Income sheet
      const incomeRows = income.map((i) => ({
        ID: i.id,
        Date: i.date,
        Type: i.type_name,
        Type_ID: i.type_id,
        Amount: i.amount,
        Notes: i.notes || '',
        Created_At: new Date(i.created_at).toISOString(),
      }));

      // 3. Expense sheet
      const expenseRows = expenses.map((e) => ({
        ID: e.id,
        Date: e.date,
        Type: e.type_name,
        Type_ID: e.expense_type_id,
        Subtype: e.subtype_name || '',
        Subtype_ID: e.expense_subtype_id || '',
        Amount: e.amount,
        Notes: e.notes || '',
        Created_At: new Date(e.created_at).toISOString(),
      }));

      // 4. Recurring sheet
      const recurringRows = recurring.map((r) => ({
        ID: r.id,
        Name: r.name,
        Total_Amount: r.amount,
        Start_Date: r.start_date,
        End_Date: r.end_date,
        Daily_Cost: r.daily_cost,
        Created_At: new Date(r.created_at).toISOString(),
      }));

      // 5. Types & Subtypes
      const incomeTypesRows = incomeTypes.map((t) => ({ ID: t.id, Name: t.name }));
      const expenseTypesRows = expenseTypes.map((t) => ({ ID: t.id, Name: t.name }));
      const subtypeRows = subtypes.map((s: any) => ({
        ID: s.id,
        Expense_Type_ID: s.expense_type_id,
        Name: s.name,
        Usage_Count: s.usage_count,
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(walkingRows), 'Walking');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeRows), 'Income');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), 'Expenses');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recurringRows), 'Recurring');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeTypesRows), 'Income_Types');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseTypesRows), 'Expense_Types');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subtypeRows), 'Subtypes');

      const now = new Date();
      const dd = padZero(now.getDate());
      const mm = padZero(now.getMonth() + 1);
      const yyyy = now.getFullYear();
      const fileName = `Checkpoint_${dd}_${mm}_${yyyy}.xlsx`;

      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, fileName);
        return { success: true };
      }

      // Native (Android / iOS)
      const Sharing = require('expo-sharing');
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      let uri = '';

      // 1. Try modern expo-file-system File/Paths API (Expo SDK 52/54/57)
      try {
        const { File, Paths } = require('expo-file-system');
        if (File && Paths && Paths.document) {
          const file = new File(Paths.document, fileName);
          if (file.exists) {
            file.delete();
          }
          file.create();
          file.write(wbout, { encoding: 'base64' });
          uri = file.uri;
        }
      } catch (e) {
        // fallback
      }

      // 2. Try legacy API if modern API was unavailable
      if (!uri) {
        try {
          const FileSystemLegacy = require('expo-file-system/legacy');
          if (FileSystemLegacy && FileSystemLegacy.documentDirectory && typeof FileSystemLegacy.writeAsStringAsync === 'function') {
            uri = `${FileSystemLegacy.documentDirectory}${fileName}`;
            await FileSystemLegacy.writeAsStringAsync(uri, wbout, {
              encoding: FileSystemLegacy.EncodingType?.Base64 || 'base64',
            });
          }
        } catch (e2) {
          // fallback
        }
      }

      if (!uri) {
        throw new Error('Failed to create file for export.');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Budget & Walking Tracker Data',
          UTI: 'com.microsoft.excel.xlsx',
        });
      }

      return { success: true, filePath: uri };
    } catch (err: any) {
      console.error('Error exporting to excel:', err);
      return { success: false, error: err.message || String(err) };
    }
  }

  /**
   * Import data from an Excel workbook or parsed JSON object
   */
  static async importFromWorkbook(data: any): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const db = getDB();
      let importedCount = 0;

      db.transaction(() => {
        // If workbook object from XLSX
        if (data && data.Sheets) {
          // 1. Income Types
          if (data.Sheets['Income_Types']) {
            const types = XLSX.utils.sheet_to_json<any>(data.Sheets['Income_Types']);
            for (const t of types) {
              if (t.Name) IncomeRepo.addType(t.Name);
            }
          }

          // 2. Expense Types
          if (data.Sheets['Expense_Types']) {
            const types = XLSX.utils.sheet_to_json<any>(data.Sheets['Expense_Types']);
            for (const t of types) {
              if (t.Name) ExpenseRepo.addType(t.Name);
            }
          }

          // Map types for fast ID lookup
          const incTypesMap: { [name: string]: string } = {};
          IncomeRepo.getTypes().forEach((t) => (incTypesMap[t.name.toLowerCase()] = t.id));

          const expTypesMap: { [name: string]: string } = {};
          ExpenseRepo.getTypes().forEach((t) => (expTypesMap[t.name.toLowerCase()] = t.id));

          // 3. Walking (Supports standard tracker format AND direct Strava activity exports)
          const walkingSheet =
            data.Sheets['Walking'] ||
            data.Sheets['walking'] ||
            (data.SheetNames && data.SheetNames.length === 1 ? data.Sheets[data.SheetNames[0]] : null);

          if (walkingSheet) {
            const rawWalking = XLSX.utils.sheet_to_json<any>(walkingSheet);
            console.log('[Import] rawWalking length:', rawWalking.length);
            for (let idx = 0; idx < rawWalking.length; idx++) {
              const w = rawWalking[idx];
              // Filter out non-walk activities if Strava 'Activity Type' column is present
              const activityType = (w['Activity Type'] || w['activity_type'] || w['Type'] || '').toLowerCase();
              if (activityType && !['walk', 'walking', 'hike', 'hiking', 'run', 'running'].includes(activityType)) {
                continue;
              }

              // Parse date (supports YYYY-MM-DD, ISO, Strava's "May 12, 2024, 07:15:00", or Excel serial number)
              const rawDate = w.Date || w.date || w['Activity Date'] || w['activity_date'];
              let formattedDate = '';
              if (rawDate) {
                if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
                  formattedDate = rawDate.trim();
                } else if (typeof rawDate === 'number' && rawDate > 25569) {
                  const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                  const y = d.getUTCFullYear();
                  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
                  const day = String(d.getUTCDate()).padStart(2, '0');
                  formattedDate = `${y}-${m}-${day}`;
                } else if (typeof rawDate === 'string') {
                  const monthMap: { [k: string]: string } = {
                    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
                  };
                  const match = rawDate.match(/([a-zA-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
                  if (match) {
                    const monStr = match[1].slice(0, 3).toLowerCase();
                    const mm = monthMap[monStr] || '01';
                    const dd = match[2].padStart(2, '0');
                    const yyyy = match[3];
                    formattedDate = `${yyyy}-${mm}-${dd}`;
                  } else {
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      formattedDate = `${y}-${m}-${day}`;
                    }
                  }
                }
              }

              // Distance (convert meters to km if > 60)
              let dist = Number(w.Distance_KM ?? w.distance_km ?? w.Distance ?? w.distance ?? 0);
              if (dist > 60) {
                dist = Number((dist / 1000).toFixed(2));
              } else {
                dist = Number(dist.toFixed(2));
              }

              // Steps (if not provided, auto-estimate ~1350 steps/km)
              let steps = Number(w.Steps ?? w.steps ?? 0);
              if ((!steps || isNaN(steps)) && dist > 0) {
                steps = Math.round(dist * 1350);
              }

              // Speed in km/h (convert m/s to km/h if needed)
              let speed = Number(w.Speed_KMH ?? w.speed_kmh ?? w['Average Speed'] ?? w.speed ?? 0);
              if (speed > 0 && speed < 10 && dist > 0) {
                // likely m/s from Strava, convert to km/h
                speed = Number((speed * 3.6).toFixed(1));
              } else {
                speed = Number(speed.toFixed(1));
              }

              if (idx === 0) {
                console.log('[Import] Row 0 parsed:', { rawDate, formattedDate, dist, steps, speed });
              }

              if (formattedDate && (steps > 0 || dist > 0)) {
                try {
                  WalkingRepo.add(steps, dist, speed, formattedDate);
                  importedCount++;
                } catch (rowErr: any) {
                  console.log('[Import] WalkingRepo.add error at row', idx, rowErr?.message);
                }
              }
            }
          }

          // 4. Income Records
          if (data.Sheets['Income']) {
            const income = XLSX.utils.sheet_to_json<any>(data.Sheets['Income']);
            for (const i of income) {
              if (i.Date && i.Amount) {
                const typeName = (i.Type || 'Other').toLowerCase();
                const typeId = incTypesMap[typeName] || IncomeRepo.addType(i.Type || 'Other').id;
                incTypesMap[typeName] = typeId;
                const noteVal = i.Notes ?? i.notes ?? null;
                IncomeRepo.add(typeId, Number(i.Amount), String(i.Date), noteVal ? String(noteVal) : null);
                importedCount++;
              }
            }
          }

          // 5. Expense Records
          if (data.Sheets['Expenses']) {
            const expenses = XLSX.utils.sheet_to_json<any>(data.Sheets['Expenses']);
            for (const e of expenses) {
              if (e.Date && e.Amount) {
                const typeName = (e.Type || 'Others').toLowerCase();
                const typeId = expTypesMap[typeName] || ExpenseRepo.addType(e.Type || 'Others').id;
                expTypesMap[typeName] = typeId;
                const noteVal = e.Notes ?? e.notes ?? null;
                ExpenseRepo.add(
                  typeId,
                  e.Subtype ? String(e.Subtype) : null,
                  Number(e.Amount),
                  String(e.Date),
                  noteVal ? String(noteVal) : null
                );
                importedCount++;
              }
            }
          }

          // 6. Recurring Expenses
          if (data.Sheets['Recurring']) {
            const recurring = XLSX.utils.sheet_to_json<any>(data.Sheets['Recurring']);
            for (const r of recurring) {
              if (r.Name && r.Total_Amount && r.Start_Date && r.End_Date) {
                RecurringRepo.add(String(r.Name), Number(r.Total_Amount), String(r.Start_Date), String(r.End_Date));
                importedCount++;
              }
            }
          }
        }
      });

      return { success: true, count: importedCount };
    } catch (err: any) {
      console.error('Error importing backup:', err);
      return { success: false, count: 0, error: err.message || String(err) };
    }
  }
}
