import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Raw parsed transactions by date
interface RawExpense {
  date: string; // YYYY-MM-DD
  origDesc: string;
  category: string;
  subcategory: string;
  amount: number;
  notes?: string;
}

interface RawIncome {
  date: string;
  type: string;
  amount: number;
  notes?: string;
}

const dailyExpenseTotalsExpected: { [date: string]: number } = {
  '2026-09-02': 32585,
  '2026-09-03': 2740,
  '2026-09-04': 3260,
  '2026-09-05': 1320,
  '2026-09-06': 785,
  '2026-09-07': 1600,
  '2026-09-08': 350,
  '2026-09-09': 1505,
  '2026-09-10': 2620,
  '2026-09-11': 7115,
  '2026-09-12': 760,
  '2026-09-13': 12300,
  '2026-09-14': 1160,
  '2026-09-15': 6049,
  '2026-09-16': 700,
  '2026-09-17': 8840,
  '2026-09-18': 1995,
  '2026-09-19': 8675,
  '2026-09-20': 1395,
};

const dailyIncomeTotalsExpected: { [date: string]: number } = {
  '2026-09-02': 134550,
  '2026-09-04': 25000,
  '2026-09-14': 25000,
  '2026-09-19': 30000,
};

const incomes: RawIncome[] = [
  // 2 Sept
  { date: '2026-09-02', type: 'Salary', amount: 99550, notes: 'Salary credited' },
  { date: '2026-09-02', type: 'Loan Repayment', amount: 10000, notes: 'Ashar returned 10k' },
  { date: '2026-09-02', type: 'Parents', amount: 25000, notes: 'From ABBA' },

  // 4 Sept
  { date: '2026-09-04', type: 'Loan Repayment', amount: 25000, notes: 'Ashar returned' },

  // 14 Sept
  { date: '2026-09-14', type: 'Parents', amount: 25000, notes: 'From ABBA' },

  // 19 Sept
  { date: '2026-09-19', type: 'Parents', amount: 30000, notes: 'From ABBA' },
];

const expenses: RawExpense[] = [
  // --- 2 Sept Wednesday (Total: 32,585) ---
  // Top half:
  { date: '2026-09-02', origDesc: 'grocery', category: 'Groceries', subcategory: 'Grocery', amount: 5685, notes: 'grocery' },
  { date: '2026-09-02', origDesc: 'Dollar store + Drinking...', category: 'Household', subcategory: 'Dollar Store', amount: 3185, notes: 'Dollar store + Drinking items' },
  { date: '2026-09-02', origDesc: 'WiFi router + 40MB', category: 'Utilities', subcategory: 'WiFi Router', amount: 8615, notes: 'WiFi router + 40MB connection setup' },
  { date: '2026-09-02', origDesc: 'Anatummy With Hassan', category: 'Outing', subcategory: 'Anatummy With Hassan', amount: 2909, notes: 'Going out with Hassan to Anatummy' },
  { date: '2026-09-02', origDesc: 'Meeting Hassan', category: 'Outing', subcategory: 'Meeting Hassan', amount: 871, notes: 'Meeting Hassan transport / outing' },
  { date: '2026-09-02', origDesc: 'Home Agreement', category: 'Housing', subcategory: 'Home Agreement', amount: 400, notes: 'Home Agreement paperwork' },
  { date: '2026-09-02', origDesc: 'Biryani', category: 'Dinner', subcategory: 'Biryani', amount: 430, notes: 'Biryani' },
  { date: '2026-09-02', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 350, notes: 'Office commute' },
  // Chicken Parhata + C... (350) -> 270 Parhata + 80 Chai
  { date: '2026-09-02', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-02', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  { date: '2026-09-02', origDesc: 'Agent commission', category: 'Housing', subcategory: 'Agent Commission', amount: 5000, notes: 'Agent commission' },

  // Bottom half of 2 Sept:
  // Chicken Parhata + C... (570) -> 80 Chai + 490 Chicken Parhata
  { date: '2026-09-02', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 490, notes: 'Chicken Parhata (from combo 570)' },
  { date: '2026-09-02', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 570)' },
  // Chicken Parhata + C... (570) -> 80 Chai + 490 Chicken Parhata
  { date: '2026-09-02', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 490, notes: 'Chicken Parhata (from combo 570)' },
  { date: '2026-09-02', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 570)' },
  { date: '2026-09-02', origDesc: 'Airport to house', category: 'Transport', subcategory: 'Airport', amount: 2500, notes: 'Airport to house cab' },
  { date: '2026-09-02', origDesc: 'Kababjees', category: 'Dinner', subcategory: 'Kababjees', amount: 800, notes: 'Kababjees dinner' },
  { date: '2026-09-02', origDesc: 'Coming to apartment', category: 'Transport', subcategory: 'Apartment Cab', amount: 350, notes: 'Coming to apartment cab' },

  // --- 3 Sept Thursday (Total: 2,740) ---
  // Coffee (Gave money...) 1000
  { date: '2026-09-03', origDesc: 'Coffee', category: 'Food', subcategory: 'Coffee', amount: 1000, notes: 'Coffee (Gave money...)' },
  // shawarma and Chai (580) -> 500 Shawarma (Dinner) + 80 Chai (Food)
  { date: '2026-09-03', origDesc: 'Shawarma', category: 'Dinner', subcategory: 'Shawarma', amount: 500, notes: 'Shawarma (from combo 580)' },
  { date: '2026-09-03', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 580)' },
  // Water nosel, bowl etc 1080
  { date: '2026-09-03', origDesc: 'Water nosel, bowl etc', category: 'Household', subcategory: 'Hardware', amount: 1080, notes: 'Water nosel, bowl etc' },
  // Chai 80
  { date: '2026-09-03', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },

  // --- 4 Sept Friday (Total: 3,260) ---
  // Chai + Chips (130) -> 80 Chai + 50 Chips
  { date: '2026-09-04', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 130)' },
  { date: '2026-09-04', origDesc: 'Chips', category: 'Food', subcategory: 'Chips', amount: 50, notes: 'Chips (from combo 130)' },
  // Chicken Parhata + C... (350) -> 270 Parhata + 80 Chai
  { date: '2026-09-04', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-04', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // Bag carry 250
  { date: '2026-09-04', origDesc: 'Bag carry', category: 'Services', subcategory: 'Bag carry', amount: 250, notes: 'Bag carry / porter' },
  // Gas 720
  { date: '2026-09-04', origDesc: 'Gas', category: 'Utilities', subcategory: 'Gas', amount: 720, notes: 'Gas cylinder / refilling' },
  // Shawarma 250
  { date: '2026-09-04', origDesc: 'Shawarma', category: 'Dinner', subcategory: 'Shawarma', amount: 250, notes: 'Shawarma' },
  // boxes 580
  { date: '2026-09-04', origDesc: 'boxes', category: 'Household', subcategory: 'Boxes', amount: 580, notes: 'Packing boxes' },
  // grocery 980
  { date: '2026-09-04', origDesc: 'grocery', category: 'Groceries', subcategory: 'Grocery', amount: 980, notes: 'grocery' },

  // --- 5 Sept Saturday (Total: 1,320) ---
  // Data offer 350
  { date: '2026-09-05', origDesc: 'Data offer', category: 'Utilities', subcategory: 'Mobile Data', amount: 350, notes: 'Data offer package' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-05', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-05', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // Broom 200
  { date: '2026-09-05', origDesc: 'Broom', category: 'Household', subcategory: 'Cleaning', amount: 200, notes: 'Broom' },
  // long 50
  { date: '2026-09-05', origDesc: 'long', category: 'Groceries', subcategory: 'Spices', amount: 50, notes: 'Laung (cloves)' },
  // Air tight jar 290
  { date: '2026-09-05', origDesc: 'Air tight jar', category: 'Household', subcategory: 'Kitchenware', amount: 290, notes: 'Air tight jar' },
  // Chai 80
  { date: '2026-09-05', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },

  // --- 6 Sept Sunday (Total: 785) ---
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-06', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-06', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // Mop + bucket 435
  { date: '2026-09-06', origDesc: 'Mop + bucket', category: 'Household', subcategory: 'Cleaning', amount: 435, notes: 'Mop + bucket' },

  // --- 7 Sept Monday (Total: 1,600) ---
  // Shawarma 600
  { date: '2026-09-07', origDesc: 'Shawarma', category: 'Dinner', subcategory: 'Shawarma', amount: 600, notes: 'Shawarma' },
  // Chai 80
  { date: '2026-09-07', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },
  // water - 50 fees 20
  { date: '2026-09-07', origDesc: 'water - 50 fees', category: 'Food', subcategory: 'Water', amount: 20, notes: 'water - 50 fees' },
  // haircut 900
  { date: '2026-09-07', origDesc: 'haircut', category: 'Personal Care', subcategory: 'Haircut', amount: 900, notes: 'haircut' },

  // --- 8 Sept Tuesday (Total: 350) ---
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-08', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-08', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },

  // --- 9 Sept Wednesday (Total: 1,505) ---
  // Office 325
  { date: '2026-09-09', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 325, notes: 'Office commute' },
  // Chai 80
  { date: '2026-09-09', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-09', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-09', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // office food 750
  { date: '2026-09-09', origDesc: 'office food', category: 'Dinner', subcategory: 'Office Food', amount: 750, notes: 'office food' },

  // --- 10 Sept Thursday (Total: 2,620) ---
  // Office 320
  { date: '2026-09-10', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 320, notes: 'Office commute' },
  // shawarma and Chai (680) -> 600 + 80
  { date: '2026-09-10', origDesc: 'Shawarma', category: 'Dinner', subcategory: 'Shawarma', amount: 600, notes: 'Shawarma (from combo 680)' },
  { date: '2026-09-10', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 680)' },
  // laundry 750
  { date: '2026-09-10', origDesc: 'laundry', category: 'Services', subcategory: 'Laundry', amount: 750, notes: 'laundry' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-10', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-10', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // office food 520
  { date: '2026-09-10', origDesc: 'office food', category: 'Dinner', subcategory: 'Office Food', amount: 520, notes: 'office food' },

  // --- 11 Sept Friday (Total: 7,115) ---
  // Office 325
  { date: '2026-09-11', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 325, notes: 'Office commute' },
  // shawarma and Chai (380) -> 300 + 80
  { date: '2026-09-11', origDesc: 'Shawarma', category: 'Dinner', subcategory: 'Shawarma', amount: 300, notes: 'Shawarma (from combo 380)' },
  { date: '2026-09-11', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 380)' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-11', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-11', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // office food 1460
  { date: '2026-09-11', origDesc: 'office food', category: 'Dinner', subcategory: 'Office Food', amount: 1460, notes: 'office food' },
  // Glasses 4600
  { date: '2026-09-11', origDesc: 'Glasses', category: 'Personal Care', subcategory: 'Glasses', amount: 4600, notes: 'Prescription / reading glasses' },

  // --- 12 Sept Saturday (Total: 760) ---
  // Office 330
  { date: '2026-09-12', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 330, notes: 'Office commute' },
  // Chai 80
  { date: '2026-09-12', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-12', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-12', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },

  // --- 13 Sept Sunday (Total: 12,300) ---
  // dinner 970
  { date: '2026-09-13', origDesc: 'dinner', category: 'Dinner', subcategory: 'Dinner', amount: 970, notes: 'dinner' },
  // Chai 80
  { date: '2026-09-13', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-13', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-13', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // weekly food 10900
  { date: '2026-09-13', origDesc: 'weekly food', category: 'Dinner', subcategory: 'Weekly Food', amount: 10900, notes: 'weekly food mess / meal prep' },

  // --- 14 Sept Monday (Total: 1,160) ---
  // dinner 1080
  { date: '2026-09-14', origDesc: 'dinner', category: 'Dinner', subcategory: 'Dinner', amount: 1080, notes: 'dinner' },
  // Chai 80
  { date: '2026-09-14', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },

  // --- 15 Sept Tuesday (Total: 6,049) ---
  // Office 355
  { date: '2026-09-15', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 355, notes: 'Office commute' },
  // Chai 80
  { date: '2026-09-15', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },
  // Chai 80
  { date: '2026-09-15', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },
  // data package 350
  { date: '2026-09-15', origDesc: 'data package', category: 'Utilities', subcategory: 'Mobile Data', amount: 350, notes: 'data package' },
  // gym fees 3500
  { date: '2026-09-15', origDesc: 'gym fees', category: 'Health & Fitness', subcategory: 'Gym', amount: 3500, notes: 'gym fees' },
  // body raiser+ chocolate 160
  { date: '2026-09-15', origDesc: 'body raiser+ chocolate', category: 'Food', subcategory: 'Body Raiser / Chocolate', amount: 160, notes: 'body raiser+ chocolate' },
  // gemini pro 1524
  { date: '2026-09-15', origDesc: 'gemini pro', category: 'Subscriptions', subcategory: 'Gemini Pro', amount: 1524, notes: 'Google Gemini Pro subscription' },

  // --- 16 Sept Wednesday (Total: 700) ---
  // chicken Parhata + c... (350) -> 270 + 80
  { date: '2026-09-16', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'chicken Parhata (from combo 350)' },
  { date: '2026-09-16', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // Office 350
  { date: '2026-09-16', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 350, notes: 'Office commute' },

  // --- 17 Sept Thursday (Total: 8,840) ---
  // office food 850
  { date: '2026-09-17', origDesc: 'office food', category: 'Dinner', subcategory: 'Office Food', amount: 850, notes: 'office food' },
  // Office 290
  { date: '2026-09-17', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 290, notes: 'Office commute' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-17', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-17', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // laundry 1350
  { date: '2026-09-17', origDesc: 'laundry', category: 'Services', subcategory: 'Laundry', amount: 1350, notes: 'laundry' },
  // Donations 6000
  { date: '2026-09-17', origDesc: 'Donations', category: 'Charity', subcategory: 'Donations', amount: 6000, notes: 'Donations' },

  // --- 18 Sept Friday (Total: 1,995) ---
  // Office 325
  { date: '2026-09-18', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 325, notes: 'Office commute' },
  // office food 900
  { date: '2026-09-18', origDesc: 'office food', category: 'Dinner', subcategory: 'Office Food', amount: 900, notes: 'office food' },
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-18', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-18', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // frisky 60
  { date: '2026-09-18', origDesc: 'frisky', category: 'Food', subcategory: 'Frisky', amount: 60, notes: 'frisky' },
  // office food 360
  { date: '2026-09-18', origDesc: 'office food', category: 'Dinner', subcategory: 'Office Food', amount: 360, notes: 'office food' },

  // --- 19 Sept Saturday (Total: 8,675) ---
  // Chicken Parhata + C... (350) -> 270 + 80
  { date: '2026-09-19', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 270, notes: 'Chicken Parhata (from combo 350)' },
  { date: '2026-09-19', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 350)' },
  // Earphones 5900
  { date: '2026-09-19', origDesc: 'Earphones', category: 'Electronics', subcategory: 'Earphones', amount: 5900, notes: 'Earphones' },
  // Office 365
  { date: '2026-09-19', origDesc: 'Office', category: 'Transport', subcategory: 'Office Commute', amount: 365, notes: 'Office commute' },
  // Mandi 1000
  { date: '2026-09-19', origDesc: 'Mandi', category: 'Dinner', subcategory: 'Mandi', amount: 1000, notes: 'Mandi dinner' },
  // ashfaq Bhai cleaning 1000
  { date: '2026-09-19', origDesc: 'ashfaq Bhai cleaning', category: 'Services', subcategory: 'House Cleaning', amount: 1000, notes: 'ashfaq Bhai cleaning' },
  // frisky 60
  { date: '2026-09-19', origDesc: 'frisky', category: 'Food', subcategory: 'Frisky', amount: 60, notes: 'frisky' },

  // --- 20 Sept Sunday (Total: 1,395) ---
  // Chai 80
  { date: '2026-09-20', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai' },
  // Chicken Parhata + C... (485) -> 80 Chai + 405 Chicken Parhata
  { date: '2026-09-20', origDesc: 'Chicken Parhata', category: 'Breakfast', subcategory: 'Chicken Parhata', amount: 405, notes: 'Chicken Parhata (from combo 485)' },
  { date: '2026-09-20', origDesc: 'Chai', category: 'Food', subcategory: 'Chai', amount: 80, notes: 'Chai (from combo 485)' },
  // Frisky + noodles 790
  { date: '2026-09-20', origDesc: 'Frisky + noodles', category: 'Dinner', subcategory: 'Frisky + Noodles', amount: 790, notes: 'Frisky + noodles' },
  // sugar 40
  { date: '2026-09-20', origDesc: 'sugar', category: 'Groceries', subcategory: 'Sugar', amount: 40, notes: 'sugar' },
];

console.log('--- Verifying Daily Totals ---');
let allExpensesSum = 0;
for (const [d, expected] of Object.entries(dailyExpenseTotalsExpected)) {
  const dayExpenses = expenses.filter((e) => e.date === d);
  const actual = dayExpenses.reduce((s, e) => s + e.amount, 0);
  allExpensesSum += actual;
  if (actual !== expected) {
    console.error(`Mismatch for ${d}: actual=${actual}, expected=${expected}`);
    process.exit(1);
  } else {
    console.log(`✓ ${d}: ${actual} PKR matches expected.`);
  }
}
console.log(`Total Expenses Sum: ${allExpensesSum} (Expected: 95,754)`);

let allIncomesSum = 0;
for (const [d, expected] of Object.entries(dailyIncomeTotalsExpected)) {
  const dayIncomes = incomes.filter((i) => i.date === d);
  const actual = dayIncomes.reduce((s, i) => s + i.amount, 0);
  allIncomesSum += actual;
  if (actual !== expected) {
    console.error(`Mismatch for income ${d}: actual=${actual}, expected=${expected}`);
    process.exit(1);
  } else {
    console.log(`✓ Income ${d}: ${actual} PKR matches expected.`);
  }
}
console.log(`Total Income Sum: ${allIncomesSum} (Expected: 214,550)`);

if (allExpensesSum !== 95754 || allIncomesSum !== 214550) {
  console.error('Fatal: Grand totals do not match!');
  process.exit(1);
}

// Build Excel Sheets matching BackupRepo import structure
const expenseSheetRows = expenses.map((e, idx) => ({
  Date: e.date,
  Type: e.category,
  Subtype: e.subcategory,
  Amount: e.amount,
  Notes: e.notes || '',
}));

const incomeSheetRows = incomes.map((i, idx) => ({
  Date: i.date,
  Type: i.type,
  Amount: i.amount,
  Notes: i.notes || '',
}));

// Unique types and subtypes
const uniqueExpTypes = Array.from(new Set(expenses.map((e) => e.category))).sort();
const uniqueIncTypes = Array.from(new Set(incomes.map((i) => i.type))).sort();

const expenseTypesRows = uniqueExpTypes.map((t, idx) => ({ ID: `exp_t_${idx + 1}`, Name: t }));
const incomeTypesRows = uniqueIncTypes.map((t, idx) => ({ ID: `inc_t_${idx + 1}`, Name: t }));

const uniqueSubtypes = Array.from(new Set(expenses.map((e) => `${e.category}:::${e.subcategory}`)));
const subtypeRows = uniqueSubtypes.map((st, idx) => {
  const [cat, name] = st.split(':::');
  const count = expenses.filter((e) => e.category === cat && e.subcategory === name).length;
  return {
    ID: `sub_${idx + 1}`,
    Expense_Type: cat,
    Name: name,
    Usage_Count: count,
  };
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseSheetRows), 'Expenses');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeSheetRows), 'Income');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseTypesRows), 'Expense_Types');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeTypesRows), 'Income_Types');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subtypeRows), 'Subtypes');

const outputPath = path.join(process.cwd(), 'imported_previous_expenses.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`\nSuccessfully created: ${outputPath}`);
console.log(`Total expense rows: ${expenseSheetRows.length}`);
console.log(`Total income rows: ${incomeSheetRows.length}`);
