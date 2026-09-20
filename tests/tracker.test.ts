import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MemoryDatabase, setTestDB } from '../src/db/database';
import { RecurringRepo } from '../src/db/repositories/recurringRepo';
import { WalkingRepo } from '../src/db/repositories/walkingRepo';
import { ExpenseRepo } from '../src/db/repositories/expenseRepo';
import { IncomeRepo } from '../src/db/repositories/incomeRepo';
import { addDays, getTodayString } from '../src/utils/dateUtils';

describe('Budget & Walking Tracker Core Logic', () => {
  let memDb: MemoryDatabase;

  beforeEach(() => {
    memDb = new MemoryDatabase();
    setTestDB(memDb);
  });

  describe('Recurring Expenses & Daily Allocations', () => {
    it('calculates daily allocation without rounding error for even division', () => {
      // 30,000 across 30 days = 1,000/day
      RecurringRepo.add('Rent', 30000, '2026-09-01', '2026-09-30');
      const allocations = RecurringRepo.getAllocationsForDate('2026-09-15');
      assert.strictEqual(allocations.length, 1);
      assert.strictEqual(allocations[0].name, 'Rent');
      assert.strictEqual(allocations[0].daily_cost, 1000);
    });

    it('calculates daily allocation without rounding error for uneven division', () => {
      // 100 across 3 days: 33.34, 33.33, 33.33 -> sum = 100.00
      RecurringRepo.add('Test Uneven', 100, '2026-09-01', '2026-09-03');
      const day1 = RecurringRepo.getAllocationsForDate('2026-09-01');
      const day2 = RecurringRepo.getAllocationsForDate('2026-09-02');
      const day3 = RecurringRepo.getAllocationsForDate('2026-09-03');
      assert.strictEqual(day1.length, 1);
      assert.strictEqual(day2.length, 1);
      assert.strictEqual(day3.length, 1);

      const sum = day1[0].daily_cost + day2[0].daily_cost + day3[0].daily_cost;
      assert.strictEqual(sum, 100);
    });

    it('detects 2-day expiration warning', () => {
      const today = getTodayString();
      const expiringIn2Days = addDays(today, 2);
      const expiringIn5Days = addDays(today, 5);

      RecurringRepo.add('Rent Expiring', 30000, addDays(today, -28), expiringIn2Days);
      RecurringRepo.add('Gym Safe', 5000, addDays(today, -10), expiringIn5Days);

      const warnings = RecurringRepo.getExpiringWithin(2, today);
      assert.strictEqual(warnings.length, 1);
      assert.strictEqual(warnings[0].expense.name, 'Rent Expiring');
      assert.strictEqual(warnings[0].daysRemaining, 2);
    });
  });

  describe('Walking Streak Calculation', () => {
    it('computes correct streak when walked today', () => {
      const today = getTodayString();
      WalkingRepo.add(5000, 3.5, 4.8, today);
      WalkingRepo.add(6000, 4.0, 5.0, addDays(today, -1));
      WalkingRepo.add(7000, 5.0, 5.2, addDays(today, -2));

      const streak = WalkingRepo.calculateStreak(today);
      assert.strictEqual(streak, 3);
    });

    it('computes correct streak when walked yesterday but not today yet', () => {
      const today = getTodayString();
      WalkingRepo.add(6000, 4.0, 5.0, addDays(today, -1));
      WalkingRepo.add(7000, 5.0, 5.2, addDays(today, -2));

      const streak = WalkingRepo.calculateStreak(today);
      assert.strictEqual(streak, 2);
    });

    it('resets streak to 0 if yesterday was missed', () => {
      const today = getTodayString();
      // Walked 2 days ago, but missed yesterday and today
      WalkingRepo.add(7000, 5.0, 5.2, addDays(today, -2));

      const streak = WalkingRepo.calculateStreak(today);
      assert.strictEqual(streak, 0);
    });
  });

  describe('Expense Subtypes & Frequency Ordering', () => {
    it('auto-memorizes subtypes and orders them by frequency', () => {
      const types = ExpenseRepo.getTypes();
      const foodType = types.find((t) => t.name === 'Food') || types[0];

      // Enter Shawarma 3 times
      ExpenseRepo.add(foodType.id, 'Shawarma', 450, '2026-09-17');
      ExpenseRepo.add(foodType.id, 'Shawarma', 450, '2026-09-16');
      ExpenseRepo.add(foodType.id, 'Shawarma', 500, '2026-09-15');

      // Enter Broast 1 time
      ExpenseRepo.add(foodType.id, 'Broast', 850, '2026-09-17');

      const subtypes = ExpenseRepo.getSubtypesForType(foodType.id);
      assert.strictEqual(subtypes.length, 2);
      assert.strictEqual(subtypes[0].name, 'Shawarma');
      assert.strictEqual(subtypes[0].usage_count, 3);
      assert.strictEqual(subtypes[1].name, 'Broast');
      assert.strictEqual(subtypes[1].usage_count, 1);
    });

    it('allows expense without subtype', () => {
      const types = ExpenseRepo.getTypes();
      const others = types.find((t) => t.name === 'Others') || types[0];

      const record = ExpenseRepo.add(others.id, null, 90, '2026-09-17');
      assert.strictEqual(record.amount, 90);
      assert.strictEqual(record.expense_subtype_id, null);
    });
  });

  describe('Income & Category Reporting', () => {
    it('aggregates monthly distribution by type', () => {
      const types = IncomeRepo.getTypes();
      const salary = types.find((t) => t.name === 'Salary') || types[0];
      const parents = types.find((t) => t.name === 'Parents') || types[1];

      IncomeRepo.add(salary.id, 200000, '2026-09-01');
      IncomeRepo.add(parents.id, 30000, '2026-09-05');

      const dist = IncomeRepo.getMonthlyDistribution('2026-09');
      assert.strictEqual(dist.total, 230000);
      assert.strictEqual(dist.slices.length, 2);
      assert.strictEqual(dist.slices[0].label, 'Salary');
      assert.strictEqual(dist.slices[0].value, 200000);
    });

    it('successfully adds new expense and income categories', () => {
      const initialExpenseTypes = ExpenseRepo.getTypes().length;
      const newExp = ExpenseRepo.addType('Entertainment');
      assert.strictEqual(newExp.name, 'Entertainment');
      const updatedExpTypes = ExpenseRepo.getTypes();
      assert.strictEqual(updatedExpTypes.length, initialExpenseTypes + 1);
      assert.ok(updatedExpTypes.some((t) => t.name === 'Entertainment'));

      const initialIncomeTypes = IncomeRepo.getTypes().length;
      const newInc = IncomeRepo.addType('Investments');
      assert.strictEqual(newInc.name, 'Investments');
      const updatedIncTypes = IncomeRepo.getTypes();
      assert.strictEqual(updatedIncTypes.length, initialIncomeTypes + 1);
      assert.ok(updatedIncTypes.some((t) => t.name === 'Investments'));
    });

    it('successfully imports sample_tracker_data.xlsx workbook', async () => {
      const XLSX = await import('xlsx');
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '..', 'sample_tracker_data.xlsx');
      const fileBuffer = fs.readFileSync(filePath);
      const wb = XLSX.read(fileBuffer, { type: 'buffer' });

      const { BackupRepo } = await import('../src/db/repositories/backupRepo');
      const result = await BackupRepo.importFromWorkbook(wb);
      assert.strictEqual(result.success, true);
      assert.ok(result.count > 0, 'Expected imported records count > 0');

      const walkingRecords = WalkingRepo.getAll();
      assert.ok(walkingRecords.length >= 10, 'Expected at least 10 walking records');

      const expenseRecords = ExpenseRepo.getAll();
      assert.ok(expenseRecords.length >= 10, 'Expected at least 10 expense records');

      const recurringRecords = RecurringRepo.getAll();
      assert.ok(recurringRecords.length >= 3, 'Expected at least 3 recurring expenses');

      // Verify the 2-day expiration warning triggers for Gym Membership
      const warnings = RecurringRepo.getExpiringWithin(2);
      assert.ok(warnings.some((w) => w.expense.name === 'Gym Membership'));
    });

    it('successfully parses and imports Strava activities CSV format', async () => {
      const XLSX = await import('xlsx');
      const { BackupRepo } = await import('../src/db/repositories/backupRepo');

      // Simulated Strava export CSV with meters and m/s, plus a non-walk activity (Ride)
      const stravaCsvData = [
        {
          'Activity Date': 'May 10, 2026, 06:30:00 AM',
          'Activity Type': 'Walk',
          'Distance': 5400, // 5.4 km (in meters)
          'Average Speed': 1.39, // ~5.0 km/h (in m/s)
        },
        {
          'Activity Date': '2026-05-11 07:15:00',
          'Activity Type': 'Hike',
          'Distance': 8200, // 8.2 km
          'Average Speed': 1.11, // ~4.0 km/h
        },
        {
          'Activity Date': '2026-05-12 18:00:00',
          'Activity Type': 'Ride', // Should be ignored (bike ride)
          'Distance': 25000,
          'Average Speed': 6.94,
        },
      ];

      const ws = XLSX.utils.json_to_sheet(stravaCsvData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      const initialCount = WalkingRepo.getAll().length;
      const result = await BackupRepo.importFromWorkbook(wb);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.count, 2, 'Only 2 walking/hiking activities should be imported');

      const walksMay10 = WalkingRepo.getForDate('2026-05-10');
      assert.strictEqual(walksMay10.length, 1);
      assert.strictEqual(walksMay10[0].distance_km, 5.4);
      assert.strictEqual(walksMay10[0].speed_kmh, 5.0);
      assert.ok(walksMay10[0].steps > 7000, 'Steps should be auto-estimated from km (~7290)');

      const walksMay12 = WalkingRepo.getForDate('2026-05-12');
      assert.strictEqual(walksMay12.length, 0, 'Bike ride on May 12 must not be imported');
    });

    it('formats duration correctly as X hrs Y minutes or hours/minutes only', () => {
      const { formatDuration } = require('../src/utils/dateUtils');
      assert.strictEqual(formatDuration(0), '0 hrs');
      assert.strictEqual(formatDuration(45), '45 minutes');
      assert.strictEqual(formatDuration(60), '1 hr');
      assert.strictEqual(formatDuration(120), '2 hrs');
      assert.strictEqual(formatDuration(75), '1 hr 15 minutes');
      assert.strictEqual(formatDuration(150), '2 hrs 30 minutes');

      // Round to hours mode for 12w and 12m
      assert.strictEqual(formatDuration(0, true), '0 hrs');
      assert.strictEqual(formatDuration(55, true), '1 hr');
      assert.strictEqual(formatDuration(119, true), '2 hrs');
      assert.strictEqual(formatDuration(530, true), '9 hrs');
    });

    it('calculates duration in walking chart data accurately', () => {
      const today = getTodayString();
      // 5 km at 5 km/h = 1 hour = 60 minutes
      WalkingRepo.add(6500, 5.0, 5.0, today);
      const data = WalkingRepo.getChartData('7d', 'steps');
      const todayPoint = data.find((p) => p.rawKey === today);
      assert.ok(todayPoint);
      assert.strictEqual(todayPoint.durationMinutes, 60);
      assert.strictEqual(todayPoint.durationHours, 1.0);
    });

    it('formats currency and net balance properly for positive and negative amounts', () => {
      const { formatCurrency, formatBalance } = require('../src/utils/dateUtils');
      assert.strictEqual(formatCurrency(0), 'Rs. 0');
      assert.strictEqual(formatCurrency(25000), 'Rs. 25,000');
      assert.strictEqual(formatCurrency(-8500), '-Rs. 8,500');

      assert.strictEqual(formatBalance(0), 'Rs. 0');
      assert.strictEqual(formatBalance(15000), '+Rs. 15,000');
      assert.strictEqual(formatBalance(-4200), '-Rs. 4,200');
    });

    it('reverses yearly breakdown and hides trailing months with 0-0-0', () => {
      const mockMonths = [
        { key: '2025-10', total: 0 },
        { key: '2025-11', total: 0 },
        { key: '2025-12', total: 0 },
        { key: '2026-01', total: 0 },
        { key: '2026-08', total: 40000 },
        { key: '2026-09', total: 50000 },
      ];

      const reversed = [...mockMonths].reverse();
      assert.strictEqual(reversed[0].key, '2026-09', 'Current month must be first');

      const lastActiveIdx = reversed.reduce(
        (lastIdx, row, idx) => (row.total !== 0 ? idx : lastIdx),
        0
      );
      const visible = reversed.slice(0, lastActiveIdx + 1);
      assert.strictEqual(visible.length, 2, 'Only active months (Sep and Aug) should be visible');
      assert.strictEqual(visible[0].key, '2026-09');
      assert.strictEqual(visible[1].key, '2026-08');
    });

    it('persists notes for expenses and income and round-trips via BackupRepo', async () => {
      const expTypes = ExpenseRepo.getTypes();
      const food = expTypes.find((t) => t.name === 'Food') || expTypes[0];
      const expense = ExpenseRepo.add(food.id, 'Shawarma', 450, '2026-09-18', '2 shawarmas + garlic sauce');
      assert.strictEqual(expense.notes, '2 shawarmas + garlic sauce');

      // Update notes
      ExpenseRepo.update(expense.id, food.id, 'Shawarma', 500, '2026-09-18', 'updated note: 2 shawarmas + drinks');
      const updatedExpense = ExpenseRepo.getById(expense.id);
      assert.strictEqual(updatedExpense?.notes, 'updated note: 2 shawarmas + drinks');
      assert.strictEqual(updatedExpense?.amount, 500);

      // Income with notes
      const incTypes = IncomeRepo.getTypes();
      const salary = incTypes.find((t) => t.name === 'Salary') || incTypes[0];
      const income = IncomeRepo.add(salary.id, 99550, '2026-09-02', 'Monthly base salary after tax');
      assert.strictEqual(income.notes, 'Monthly base salary after tax');

      IncomeRepo.update(income.id, salary.id, 100000, '2026-09-02', 'Final salary credited');
      const updatedIncome = IncomeRepo.getById(income.id);
      assert.strictEqual(updatedIncome?.notes, 'Final salary credited');

      // Backup export/import round-trip
      const XLSX = await import('xlsx');
      const { BackupRepo } = await import('../src/db/repositories/backupRepo');

      // Create a mock workbook with notes
      const expenseSheetData = [
        {
          Date: '2026-09-10',
          Type: 'Food',
          Subtype: 'Chai',
          Amount: 80,
          Notes: 'Evening tea with snack',
        },
      ];
      const incomeSheetData = [
        {
          Date: '2026-09-01',
          Type: 'Salary',
          Amount: 99550,
          Notes: 'September Paycheck',
        },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseSheetData), 'Expenses');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeSheetData), 'Income');

      const importRes = await BackupRepo.importFromWorkbook(wb);
      assert.strictEqual(importRes.success, true);

      const importedExpenses = ExpenseRepo.getAll();
      const chaiRecord = importedExpenses.find((e) => e.subtype_name === 'Chai' && e.date === '2026-09-10');
      assert.ok(chaiRecord, 'Chai record should be imported');
      assert.strictEqual(chaiRecord.notes, 'Evening tea with snack');

      const importedIncomes = IncomeRepo.getAll();
      const paycheckRecord = importedIncomes.find((i) => i.date === '2026-09-01');
      assert.ok(paycheckRecord, 'Paycheck should be imported');
      assert.strictEqual(paycheckRecord.notes, 'September Paycheck');
    });

    it('successfully imports and verifies imported_previous_expenses.xlsx control totals', async () => {
      const XLSX = await import('xlsx');
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '..', 'imported_previous_expenses.xlsx');
      const fileBuffer = fs.readFileSync(filePath);
      const wb = XLSX.read(fileBuffer, { type: 'buffer' });

      const { BackupRepo } = await import('../src/db/repositories/backupRepo');
      const result = await BackupRepo.importFromWorkbook(wb);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.count, 118, 'Expected 112 expenses + 6 incomes = 118 records');

      // Verify September 2026 expense and income totals
      const expensesSep = ExpenseRepo.getForMonth('2026-09');
      const totalExpense = expensesSep.reduce((sum, e) => sum + e.amount, 0);
      assert.strictEqual(totalExpense, 95754, 'Total expenses must match exactly 95,754 PKR');

      const incomesSep = IncomeRepo.getForMonth('2026-09');
      const totalIncome = incomesSep.reduce((sum, i) => sum + i.amount, 0);
      assert.strictEqual(totalIncome, 214550, 'Total income must match exactly 214,550 PKR');

      // Verify category rules
      // 1. Chai has category Food and subcategory Chai
      const chaiList = expensesSep.filter((e) => e.subtype_name === 'Chai');
      assert.ok(chaiList.length > 0);
      assert.ok(chaiList.every((e) => e.type_name === 'Food'));

      // 2. Chicken Parhata is in Breakfast
      const parhataList = expensesSep.filter((e) => e.subtype_name === 'Chicken Parhata');
      assert.ok(parhataList.length > 0);
      assert.ok(parhataList.every((e) => e.type_name === 'Breakfast'));

      // 3. Outings with Hassan
      const outingList = expensesSep.filter((e) => e.type_name === 'Outing');
      assert.ok(outingList.length >= 2);
      assert.ok(outingList.some((e) => e.subtype_name === 'Anatummy With Hassan' && e.amount === 2909));
      assert.ok(outingList.some((e) => e.subtype_name === 'Meeting Hassan' && e.amount === 871));
    });
  });
});
