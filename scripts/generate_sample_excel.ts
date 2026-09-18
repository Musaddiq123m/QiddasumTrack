import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

const now = new Date();
const todayStr = formatDate(now);
const y = now.getFullYear();
const m = now.getMonth() + 1;

// 1. Income Types
const incomeTypes = [
  { ID: 'inc_type_salary', Name: 'Salary' },
  { ID: 'inc_type_parents', Name: 'Parents' },
  { ID: 'inc_type_freelance', Name: 'Freelance' },
  { ID: 'inc_type_bonus', Name: 'Bonus' },
  { ID: 'inc_type_other', Name: 'Other' },
];

// 2. Expense Types
const expenseTypes = [
  { ID: 'exp_type_food', Name: 'Food' },
  { ID: 'exp_type_trans', Name: 'Transportation' },
  { ID: 'exp_type_cloth', Name: 'Clothing' },
  { ID: 'exp_type_groc', Name: 'Grocery' },
  { ID: 'exp_type_elec', Name: 'Electronics' },
  { ID: 'exp_type_other', Name: 'Others' },
];

// 3. Subtypes
const subtypes = [
  { ID: 'sub_shawarma', Expense_Type_ID: 'exp_type_food', Name: 'Shawarma', Usage_Count: 15 },
  { ID: 'sub_broast', Expense_Type_ID: 'exp_type_food', Name: 'Broast', Usage_Count: 8 },
  { ID: 'sub_pizza', Expense_Type_ID: 'exp_type_food', Name: 'Pizza', Usage_Count: 5 },
  { ID: 'sub_burger', Expense_Type_ID: 'exp_type_food', Name: 'Burger', Usage_Count: 3 },
  { ID: 'sub_uber', Expense_Type_ID: 'exp_type_trans', Name: 'Uber', Usage_Count: 12 },
  { ID: 'sub_careem', Expense_Type_ID: 'exp_type_trans', Name: 'Careem', Usage_Count: 6 },
  { ID: 'sub_fuel', Expense_Type_ID: 'exp_type_trans', Name: 'Fuel', Usage_Count: 4 },
];

// 4. Walking Records (Walking streak: walked today, yesterday, 2 days ago, 3 days ago, etc.)
const walkingRows = [
  {
    ID: 'w_1',
    Date: todayStr,
    Steps: 8421,
    Distance_KM: 5.8,
    Speed_KMH: 5.2,
    Created_At: now.toISOString(),
  },
  {
    ID: 'w_2',
    Date: formatDate(addDays(now, -1)),
    Steps: 9150,
    Distance_KM: 6.2,
    Speed_KMH: 5.4,
    Created_At: addDays(now, -1).toISOString(),
  },
  {
    ID: 'w_3',
    Date: formatDate(addDays(now, -2)),
    Steps: 6102,
    Distance_KM: 4.1,
    Speed_KMH: 4.8,
    Created_At: addDays(now, -2).toISOString(),
  },
  {
    ID: 'w_4',
    Date: formatDate(addDays(now, -3)),
    Steps: 10450,
    Distance_KM: 7.3,
    Speed_KMH: 5.5,
    Created_At: addDays(now, -3).toISOString(),
  },
  {
    ID: 'w_5',
    Date: formatDate(addDays(now, -4)),
    Steps: 7800,
    Distance_KM: 5.2,
    Speed_KMH: 5.0,
    Created_At: addDays(now, -4).toISOString(),
  },
  {
    ID: 'w_6',
    Date: formatDate(addDays(now, -5)),
    Steps: 8900,
    Distance_KM: 6.0,
    Speed_KMH: 5.1,
    Created_At: addDays(now, -5).toISOString(),
  },
  {
    ID: 'w_7',
    Date: formatDate(addDays(now, -6)),
    Steps: 7200,
    Distance_KM: 4.9,
    Speed_KMH: 4.9,
    Created_At: addDays(now, -6).toISOString(),
  },
  // Previous weeks walking data
  {
    ID: 'w_8',
    Date: formatDate(addDays(now, -10)),
    Steps: 8500,
    Distance_KM: 5.9,
    Speed_KMH: 5.2,
    Created_At: addDays(now, -10).toISOString(),
  },
  {
    ID: 'w_9',
    Date: formatDate(addDays(now, -14)),
    Steps: 9400,
    Distance_KM: 6.5,
    Speed_KMH: 5.3,
    Created_At: addDays(now, -14).toISOString(),
  },
  {
    ID: 'w_10',
    Date: formatDate(addDays(now, -20)),
    Steps: 6800,
    Distance_KM: 4.5,
    Speed_KMH: 4.7,
    Created_At: addDays(now, -20).toISOString(),
  },
];

// 5. Income Records (Current month + previous months for 12m stacked bar chart)
const incomeRows = [
  {
    ID: 'inc_1',
    Date: `${y}-${padZero(m)}-01`,
    Type: 'Salary',
    Type_ID: 'inc_type_salary',
    Amount: 200000,
    Created_At: now.toISOString(),
  },
  {
    ID: 'inc_2',
    Date: `${y}-${padZero(m)}-05`,
    Type: 'Parents',
    Type_ID: 'inc_type_parents',
    Amount: 30000,
    Created_At: now.toISOString(),
  },
  {
    ID: 'inc_3',
    Date: `${y}-${padZero(m)}-12`,
    Type: 'Freelance',
    Type_ID: 'inc_type_freelance',
    Amount: 45000,
    Created_At: now.toISOString(),
  },
  // Previous month 1
  {
    ID: 'inc_4',
    Date: formatDate(addDays(now, -35)),
    Type: 'Salary',
    Type_ID: 'inc_type_salary',
    Amount: 200000,
    Created_At: addDays(now, -35).toISOString(),
  },
  {
    ID: 'inc_5',
    Date: formatDate(addDays(now, -33)),
    Type: 'Freelance',
    Type_ID: 'inc_type_freelance',
    Amount: 25000,
    Created_At: addDays(now, -33).toISOString(),
  },
  // Previous month 2
  {
    ID: 'inc_6',
    Date: formatDate(addDays(now, -65)),
    Type: 'Salary',
    Type_ID: 'inc_type_salary',
    Amount: 200000,
    Created_At: addDays(now, -65).toISOString(),
  },
  {
    ID: 'inc_7',
    Date: formatDate(addDays(now, -62)),
    Type: 'Bonus',
    Type_ID: 'inc_type_bonus',
    Amount: 50000,
    Created_At: addDays(now, -62).toISOString(),
  },
];

// 6. Expense Records (Daily timeline + monthly ranking + subtype drilldown)
const yesterdayStr = formatDate(addDays(now, -1));
const twoDaysAgoStr = formatDate(addDays(now, -2));

const expenseRows = [
  // Today's expenses
  {
    ID: 'exp_1',
    Date: todayStr,
    Type: 'Food',
    Type_ID: 'exp_type_food',
    Subtype: 'Shawarma',
    Subtype_ID: 'sub_shawarma',
    Amount: 450,
    Created_At: now.toISOString(),
  },
  {
    ID: 'exp_2',
    Date: todayStr,
    Type: 'Transportation',
    Type_ID: 'exp_type_trans',
    Subtype: 'Uber',
    Subtype_ID: 'sub_uber',
    Amount: 620,
    Created_At: now.toISOString(),
  },
  {
    ID: 'exp_3',
    Date: todayStr,
    Type: 'Others',
    Type_ID: 'exp_type_other',
    Subtype: '',
    Subtype_ID: '',
    Amount: 90,
    Created_At: now.toISOString(),
  },

  // Yesterday's expenses
  {
    ID: 'exp_4',
    Date: yesterdayStr,
    Type: 'Food',
    Type_ID: 'exp_type_food',
    Subtype: 'Broast',
    Subtype_ID: 'sub_broast',
    Amount: 850,
    Created_At: addDays(now, -1).toISOString(),
  },
  {
    ID: 'exp_5',
    Date: yesterdayStr,
    Type: 'Transportation',
    Type_ID: 'exp_type_trans',
    Subtype: 'Uber',
    Subtype_ID: 'sub_uber',
    Amount: 500,
    Created_At: addDays(now, -1).toISOString(),
  },
  {
    ID: 'exp_6',
    Date: yesterdayStr,
    Type: 'Grocery',
    Type_ID: 'exp_type_groc',
    Subtype: 'Milk & Bread',
    Subtype_ID: '',
    Amount: 380,
    Created_At: addDays(now, -1).toISOString(),
  },

  // Two days ago expenses
  {
    ID: 'exp_7',
    Date: twoDaysAgoStr,
    Type: 'Food',
    Type_ID: 'exp_type_food',
    Subtype: 'Pizza',
    Subtype_ID: 'sub_pizza',
    Amount: 1700,
    Created_At: addDays(now, -2).toISOString(),
  },
  {
    ID: 'exp_8',
    Date: twoDaysAgoStr,
    Type: 'Electronics',
    Type_ID: 'exp_type_elec',
    Subtype: 'Power Bank',
    Subtype_ID: '',
    Amount: 2500,
    Created_At: addDays(now, -2).toISOString(),
  },

  // Additional expenses this month for rich subtype drilldown under Food
  {
    ID: 'exp_9',
    Date: `${y}-${padZero(m)}-03`,
    Type: 'Food',
    Type_ID: 'exp_type_food',
    Subtype: 'Shawarma',
    Subtype_ID: 'sub_shawarma',
    Amount: 900,
    Created_At: now.toISOString(),
  },
  {
    ID: 'exp_10',
    Date: `${y}-${padZero(m)}-06`,
    Type: 'Food',
    Type_ID: 'exp_type_food',
    Subtype: 'Burger',
    Subtype_ID: 'sub_burger',
    Amount: 1000,
    Created_At: now.toISOString(),
  },
  {
    ID: 'exp_11',
    Date: `${y}-${padZero(m)}-08`,
    Type: 'Food',
    Type_ID: 'exp_type_food',
    Subtype: 'Shawarma',
    Subtype_ID: 'sub_shawarma',
    Amount: 1350,
    Created_At: now.toISOString(),
  },
  {
    ID: 'exp_12',
    Date: `${y}-${padZero(m)}-10`,
    Type: 'Transportation',
    Type_ID: 'exp_type_trans',
    Subtype: 'Fuel',
    Subtype_ID: 'sub_fuel',
    Amount: 3500,
    Created_At: now.toISOString(),
  },
  {
    ID: 'exp_13',
    Date: `${y}-${padZero(m)}-11`,
    Type: 'Clothing',
    Type_ID: 'exp_type_cloth',
    Subtype: 'Running Shoes',
    Subtype_ID: '',
    Amount: 4800,
    Created_At: now.toISOString(),
  },
];

// 7. Recurring Expenses:
// - Rent: Rs. 30,000 for entire month (Rs. 1,000/day)
// - Gym Membership: EXPIRES IN 2 DAYS! (triggers the 2-day warning banner!)
// - Electricity: Rs. 12,000 for current month
const monthStart = `${y}-${padZero(m)}-01`;
const daysInCurrentMonth = new Date(y, m, 0).getDate();
const monthEnd = `${y}-${padZero(m)}-${padZero(daysInCurrentMonth)}`;
const expiringIn2DaysStr = formatDate(addDays(now, 2));

const recurringRows = [
  {
    ID: 'rec_rent',
    Name: 'Rent',
    Total_Amount: 30000,
    Start_Date: monthStart,
    End_Date: monthEnd,
    Daily_Cost: Math.round(30000 / daysInCurrentMonth),
    Created_At: now.toISOString(),
  },
  {
    ID: 'rec_gym',
    Name: 'Gym Membership',
    Total_Amount: 5000,
    Start_Date: formatDate(addDays(now, -28)),
    End_Date: expiringIn2DaysStr, // Expiring in 2 days from today!
    Daily_Cost: 167,
    Created_At: addDays(now, -28).toISOString(),
  },
  {
    ID: 'rec_elec',
    Name: 'Electricity',
    Total_Amount: 12000,
    Start_Date: monthStart,
    End_Date: monthEnd,
    Daily_Cost: Math.round(12000 / daysInCurrentMonth),
    Created_At: now.toISOString(),
  },
];

// Build Workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(walkingRows), 'Walking');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeRows), 'Income');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), 'Expenses');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recurringRows), 'Recurring');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeTypes), 'Income_Types');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseTypes), 'Expense_Types');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subtypes), 'Subtypes');

const outPath = path.join(__dirname, '..', 'sample_tracker_data.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`Created sample test file at: ${outPath}`);
