import * as XLSX from 'xlsx';
import { Platform } from '../../utils/platform';
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

      const fileName = `Budget_Walking_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;

      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, fileName);
        return { success: true };
      }

      // Native (Android / iOS)
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

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

          // 3. Walking
          if (data.Sheets['Walking']) {
            const walking = XLSX.utils.sheet_to_json<any>(data.Sheets['Walking']);
            for (const w of walking) {
              if (w.Date && w.Steps !== undefined) {
                WalkingRepo.add(Number(w.Steps), Number(w.Distance_KM || 0), Number(w.Speed_KMH || 0), String(w.Date));
                importedCount++;
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
                IncomeRepo.add(typeId, Number(i.Amount), String(i.Date));
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
                ExpenseRepo.add(typeId, e.Subtype ? String(e.Subtype) : null, Number(e.Amount), String(e.Date));
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
