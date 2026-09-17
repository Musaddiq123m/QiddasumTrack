# Budget and Walking Tracker (Android / Redmi Note 12)

This is a small Android app for tracking personal spending, income, and walking. It is tuned for use on a Redmi Note 12 running MIUI or HyperOS.

Everything stays on the device in SQLite. There are no accounts, cloud services, or backend servers, so the app works offline and data entry stays quick.

## Features

### 1. Budget & Finances
* **Income Tracking**:
  * Default types: `Salary`, `Parents`, with inline creation for new types (`Freelance`, `Bonus`, etc.).
  * Dialpad numeric entry with automatic thousand separators (`Rs. 200,000`).
  * **Monthly Pie Chart**: Breaks down income sources by percentage and amount.
  * **Yearly Stacked Bar Chart**: 12-month overview where each month is a bar and income types form the color-coded stacks. Tapping any month drills down to that month.
* **Expense Tracking**:
  * Categories: `Food`, `Transportation`, `Clothing`, `Grocery`, `Electronics`, `Others`, plus custom categories.
  * **Dynamic Subtypes**: Optional subtypes such as `Shawarma`, `Broast`, and `Pizza` are remembered as you use them and sorted by frequency.
  * **Daily Timeline**: Grouped chronologically (`TODAY`, `YESTERDAY`, specific dates), newest first.
  * **Monthly Ranking (Horizontal Bar Chart)**: Ranks expenses by category. Categories can be opened to see an interactive subtype breakdown.
  * **Yearly Line Chart**: 12-month expense trend including distributed recurring expenses. Tapping any month drills down into that month.
* **Recurring / Period-Based Expenses**:
  * Configure period costs like Rent (e.g. Rs. 30,000 from Sep 1 to Sep 30 = Rs. 1,000/day), Gym, Electricity, Internet.
  * **Exact sum preservation**: Distributes fractional cents across days so the daily amounts still add up to the original total.
  * **Daily Timeline Integration**: Recurring expenses appear in an expandable `Recurring Expenses` section with their daily allocations instead of as one lump sum.
  * **Persistent Expiration Warning**: Starting 2 days before expiration, the app shows a persistent warning with a one-tap **Renew / Extend** action.

### 2. Walking / Steps Tracker
* **Manual Entry**: Quick entry for Date, Steps, Distance (km), and Speed (km/h) with numeric dialpad and validation.
  * **Current Streak**: Shows the current number of consecutive walking days, keeps the streak active if today has not been logged yet, and resets it after a missed day.
* **Walking Calendar**: Visual month calendar highlighting days walked with distinct green dot indicators. Tapping any day shows the walking entries for that day.
* **Walking Trend Line Chart**:
  * Toggle metrics: **Steps** vs **Distance (km)**.
  * Toggle timeframe: **Last 7 Days**, **Last 12 Weeks** (aggregated by week), **Last 12 Months** (aggregated by month).
* **Walking History**: Sorted newest first with edit and delete support.

### 3. Settings & Data Management
* Manage Income Types (Add, Delete).
* Manage Expense Types (Add, Delete).
* Manage Recurring Expenses (Add, Edit, Delete, Renew).
* **Data Export to Excel (.xlsx)**: Generates a complete Excel workbook with dedicated sheets for `Walking`, `Income`, `Expenses`, `Recurring`, and `Types`. Opens native Android share sheet to save to device, Google Drive, WhatsApp, etc.
* **Data Import / Restore**: Select an Excel backup (`.xlsx`) to safely restore all tracker data.

## Running the App on Your Redmi Note 12

### Option 1: Run with Expo Go
1. Install **Expo Go** from the Google Play Store on your Redmi Note 12.
2. In this project folder, start the development server:
   ```bash
   npm start
   ```
3. Open **Expo Go** (or your phone's camera) on your Redmi Note 12 and scan the QR code displayed in your terminal.
4. The app will open on your phone and reload as you make changes.

### Option 2: Run in Web Browser
You can preview and test the full application in your browser:
```bash
npm run web
```

### Option 3: Build Standalone Android APK (.apk)
To generate an installable `.apk` file for your Redmi Note 12:
1. Install the EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Build the preview APK:
   ```bash
   eas build -p android --profile preview
   ```
3. Download the generated APK directly onto your Redmi Note 12 and install.

---

## Testing

To run the automated test suite verifying streak calculations, recurring expense distributions, subtype frequencies, and expiration warnings:
```bash
npm test
```

---

## Project Structure

```
budget_tracking/
|-- assets/                    # App icons and splash screen
|-- src/
|   |-- components/            # UI components
|   |   |-- charts/            # Responsive SVG charts
|   |   |   |-- HorizontalBarChart.tsx
|   |   |   |-- LineChart.tsx
|   |   |   |-- PieChart.tsx
|   |   |   `-- StackedBarChart.tsx
|   |   |-- modals/            # Data entry and drilldown modals
|   |   |   |-- AddExpenseModal.tsx
|   |   |   |-- AddIncomeModal.tsx
|   |   |   |-- AddWalkingModal.tsx
|   |   |   |-- AddRecurringModal.tsx
|   |   |   |-- RenewRecurringModal.tsx
|   |   |   `-- SubtypeDrilldownModal.tsx
|   |   |-- DateNavigator.tsx  # Universal < Month Year > selector
|   |   |-- DialpadInput.tsx   # Touch numeric input
|   |   |-- ExpirationBanner.tsx # Persistent 2-day expiration warning
|   |   `-- WalkingCalendar.tsx# Month grid with walking indicators
|   |-- db/                    # Local SQLite database layer
|   |   |-- database.ts        # Native SQLite + Web fallback driver
|   |   |-- schema.ts          # Relational tables and initial seeds
|   |   `-- repositories/      # Business logic & queries
|   |       |-- backupRepo.ts  # Excel (.xlsx) export & import
|   |       |-- expenseRepo.ts # Frequency subtypes, timeline, charts
|   |       |-- incomeRepo.ts  # Income categories, pie & stacked charts
|   |       |-- recurringRepo.ts# Daily allocation & 2-day alert
|   |       `-- walkingRepo.ts # Streaks, calendar, chart aggregations
|   |-- screens/               # Main application screens
|   |   |-- BudgetScreen.tsx   # Timeline, Monthly & Yearly views
|   |   |-- StepsScreen.tsx    # Streak, Calendar, Trends, History
|   |   `-- SettingsScreen.tsx # Categories, Recurring, Excel Export/Import
|   |-- types/
|   |   `-- index.ts           # Shared TypeScript interfaces
|   `-- utils/
|       |-- dateUtils.ts       # Dates, currencies, and aggregations
|       `-- platform.ts        # Cross-platform environment helper
|-- tests/
|   `-- tracker.test.ts        # Automated unit tests
|-- App.tsx                    # Root application component
|-- app.json                   # Android app configuration
|-- package.json               # Dependencies and scripts
`-- tsconfig.json              # TypeScript configuration
```
