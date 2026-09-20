import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Layers,
  Repeat,
  RotateCcw,
  Scale,
} from 'lucide-react-native';
import {
  DateGroupedExpenses,
  ExpenseRecord,
  ExpenseType,
  HorizontalBarItem,
  IncomeRecord,
  IncomeType,
  PieSlice,
  RecurringExpense,
  StackedBarGroup,
} from '../types';
import { ExpenseRepo } from '../db/repositories/expenseRepo';
import { IncomeRepo } from '../db/repositories/incomeRepo';
import { RecurringRepo } from '../db/repositories/recurringRepo';
import { DateNavigator } from '../components/DateNavigator';
import { ExpirationBanner } from '../components/ExpirationBanner';
import { HorizontalBarChart } from '../components/charts/HorizontalBarChart';
import { PieChart } from '../components/charts/PieChart';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { LineChart } from '../components/charts/LineChart';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { AddIncomeModal } from '../components/modals/AddIncomeModal';
import { AddRecurringModal } from '../components/modals/AddRecurringModal';
import { SubtypeDrilldownModal } from '../components/modals/SubtypeDrilldownModal';
import { RenewRecurringModal } from '../components/modals/RenewRecurringModal';
import { formatCurrency, formatBalance, formatMonthYear, getMonthKey, getTodayString } from '../utils/dateUtils';
import { THEME } from '../theme/colors';
import { AnimatedPressable, FadeInView } from '../components/AnimatedComponents';

type BudgetSubView = 'daily' | 'monthly' | 'yearly';

export const BudgetScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BudgetSubView>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedMonthKey = getMonthKey(selectedDate);

  // Data states
  const [groupedTimeline, setGroupedTimeline] = useState<DateGroupedExpenses[]>([]);
  const [monthlyExpenseRanking, setMonthlyExpenseRanking] = useState<{ items: HorizontalBarItem[]; total: number }>({
    items: [],
    total: 0,
  });
  const [monthlyIncomePie, setMonthlyIncomePie] = useState<{ slices: PieSlice[]; total: number }>({
    slices: [],
    total: 0,
  });
  const [yearlyIncomeStacked, setYearlyIncomeStacked] = useState<{
    groups: StackedBarGroup[];
    typeColors: { [type: string]: string };
  }>({ groups: [], typeColors: {} });
  const [yearlyExpenseLine, setYearlyExpenseLine] = useState<any[]>([]);
  const [expiringRecurring, setExpiringRecurring] = useState<{ expense: RecurringExpense; daysRemaining: number }[]>([]);
  const [expandedRecurringDates, setExpandedRecurringDates] = useState<{ [date: string]: boolean }>({});

  // Types
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  // Editing items
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);

  // Drill-down data
  const [drilldownCategory, setDrilldownCategory] = useState<string>('');
  const [drilldownData, setDrilldownData] = useState<{ items: HorizontalBarItem[]; total: number }>({
    items: [],
    total: 0,
  });

  // Computed monthly figures
  const monthlyIncome = monthlyIncomePie.total;
  const monthlyExpense = monthlyExpenseRanking.total;
  const monthlyBalance = monthlyIncome - monthlyExpense;

  // Computed yearly figures (12 Months)
  const yearlyIncomeTotal = yearlyIncomeStacked.groups.reduce((sum, g) => sum + g.total, 0);
  const yearlyExpenseTotal = yearlyExpenseLine.reduce((sum, pt) => sum + (pt.value || 0), 0);
  const yearlyBalance = yearlyIncomeTotal - yearlyExpenseTotal;

  // Monthly breakdown for Yearly tab (reverse chronological order: current month first)
  const yearlyMonthBreakdown = [...yearlyIncomeStacked.groups]
    .reverse()
    .map((g) => {
      const income = g.total;
      const expensePt = yearlyExpenseLine.find((pt) => pt.rawKey === g.key);
      const expense = expensePt ? expensePt.value : 0;
      const balance = income - expense;
      const [y] = g.key.split('-');
      return {
        key: g.key,
        label: `${g.label} '${y.slice(2)}`,
        income,
        expense,
        balance,
      };
    });

  // Truncate all trailing months below that are 0 0 0
  const lastActiveIdx = yearlyMonthBreakdown.reduce(
    (lastIdx, row, idx) => (row.income !== 0 || row.expense !== 0 ? idx : lastIdx),
    0
  );
  const visibleYearlyBreakdown = yearlyMonthBreakdown.slice(0, lastActiveIdx + 1);

  const loadData = useCallback(() => {
    const expiring = RecurringRepo.getExpiringWithin(2);
    setExpiringRecurring(expiring);

    const expTypes = ExpenseRepo.getTypes();
    setExpenseTypes(expTypes);
    const incTypes = IncomeRepo.getTypes();
    setIncomeTypes(incTypes);

    const timeline = ExpenseRepo.getTimelineGrouped(100, 0);
    setGroupedTimeline(timeline);

    const expenseRanking = ExpenseRepo.getMonthlyRankingWithRecurring(selectedMonthKey);
    setMonthlyExpenseRanking(expenseRanking);

    const incomePie = IncomeRepo.getMonthlyDistribution(selectedMonthKey);
    setMonthlyIncomePie(incomePie);

    const stacked = IncomeRepo.getYearlyStackedBars(selectedMonthKey);
    setYearlyIncomeStacked(stacked);

    const expenseLine = ExpenseRepo.getYearlyLineData(selectedMonthKey);
    setYearlyExpenseLine(expenseLine);
  }, [selectedMonthKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    const prev = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    setSelectedDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    setSelectedDate(next);
  };

  const [isDrilledFromYearly, setIsDrilledFromYearly] = useState(false);

  const handleResetToday = () => {
    setSelectedDate(new Date());
    setIsDrilledFromYearly(false);
  };

  const handleYearlyMonthPress = (monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, 1));
    setIsDrilledFromYearly(true);
    setActiveTab('monthly');
  };

  const handleTabPress = (tab: BudgetSubView) => {
    // If user was drilled into a previous month, or switching between tabs (e.g. to yearly or timeline),
    // reset to current month so the view isn't stuck on the past month
    if (tab !== 'monthly' || isDrilledFromYearly) {
      setSelectedDate(new Date());
      setIsDrilledFromYearly(false);
    }
    setActiveTab(tab);
  };

  const toggleRecurringSection = (dateStr: string) => {
    setExpandedRecurringDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const handleCategoryPress = (item: HorizontalBarItem) => {
    if (item.isRecurring) return;
    const breakdown = ExpenseRepo.getSubtypeBreakdown(item.id, selectedMonthKey);
    setDrilldownCategory(item.name);
    setDrilldownData(breakdown);
    setIsDrilldownOpen(true);
  };

  const handleSaveExpense = (typeId: string, subtypeName: string | null, amount: number, date: string, id?: string, notes?: string | null) => {
    if (id) {
      ExpenseRepo.update(id, typeId, subtypeName, amount, date, notes);
    } else {
      ExpenseRepo.add(typeId, subtypeName, amount, date, notes);
    }
    loadData();
  };

  const handleDeleteExpense = (id: string) => {
    ExpenseRepo.delete(id);
    loadData();
  };

  const handleSaveIncome = (typeId: string, amount: number, date: string, id?: string, notes?: string | null) => {
    if (id) {
      IncomeRepo.update(id, typeId, amount, date, notes);
    } else {
      IncomeRepo.add(typeId, amount, date, notes);
    }
    loadData();
  };

  const handleDeleteIncome = (id: string) => {
    IncomeRepo.delete(id);
    loadData();
  };

  const handleSaveRecurring = (name: string, amount: number, startDate: string, endDate: string, id?: string) => {
    if (id) {
      RecurringRepo.update(id, name, amount, startDate, endDate);
    } else {
      RecurringRepo.add(name, amount, startDate, endDate);
    }
    loadData();
  };

  const handleRenewRecurring = (id: string, name: string, amount: number, startDate: string, endDate: string) => {
    RecurringRepo.update(id, name, amount, startDate, endDate);
    loadData();
  };

  const handleAddNewExpenseType = (name: string) => {
    const created = ExpenseRepo.addType(name);
    setExpenseTypes(ExpenseRepo.getTypes());
    return created;
  };

  const handleAddNewIncomeType = (name: string) => {
    const created = IncomeRepo.addType(name);
    setIncomeTypes(IncomeRepo.getTypes());
    return created;
  };

  return (
    <View style={styles.container}>
      {/* Universal Date Navigator */}
      <DateNavigator
        currentDate={selectedDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onResetToday={handleResetToday}
      />

      {/* Persistent Recurring Expiration Warning Banner (No emojis) */}
      <ExpirationBanner
        expiringItems={expiringRecurring}
        onRenewPress={(item) => {
          setEditingRecurring(item);
          setIsRenewModalOpen(true);
        }}
      />

      {/* Sub-view Navigation Tabs */}
      <View style={styles.tabBar}>
        <AnimatedPressable
          style={[styles.tabBtn, activeTab === 'daily' && styles.tabBtnActive]}
          onPress={() => handleTabPress('daily')}
          scaleTo={0.95}
        >
          <Calendar size={14} color={activeTab === 'daily' ? THEME.text.primary : THEME.text.tertiary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>Timeline</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.tabBtn, activeTab === 'monthly' && styles.tabBtnActive]}
          onPress={() => handleTabPress('monthly')}
          scaleTo={0.95}
        >
          <PieIcon size={14} color={activeTab === 'monthly' ? THEME.text.primary : THEME.text.tertiary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>Monthly</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.tabBtn, activeTab === 'yearly' && styles.tabBtnActive]}
          onPress={() => handleTabPress('yearly')}
          scaleTo={0.95}
        >
          <Layers size={14} color={activeTab === 'yearly' ? THEME.text.primary : THEME.text.tertiary} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'yearly' && styles.tabTextActive]}>Yearly</Text>
        </AnimatedPressable>
      </View>

      {/* Historical Drilled Month Banner */}
      {isDrilledFromYearly && activeTab === 'monthly' && (
        <AnimatedPressable
          style={styles.drillBanner}
          onPress={() => {
            setSelectedDate(new Date());
            setIsDrilledFromYearly(false);
          }}
          scaleTo={0.98}
        >
          <RotateCcw size={13} color={THEME.accent.blue} style={{ marginRight: 6 }} />
          <Text style={styles.drillBannerText}>
            Viewing {selectedMonthKey} • Tap to reset to current month
          </Text>
        </AnimatedPressable>
      )}

      {/* Tab 1: Daily Timeline */}
      {activeTab === 'daily' && (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {groupedTimeline.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Expenses Recorded</Text>
              <Text style={styles.emptySub}>Tap the button below to add your first entry</Text>
            </View>
          ) : (
            groupedTimeline.map((group) => {
              const isRecurringExpanded = !!expandedRecurringDates[group.date];
              const hasRecurring = group.recurringAllocations.length > 0;

              return (
                <View key={group.date} style={styles.dateGroup}>
                  {/* Date Header */}
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateTitle}>{group.displayDate}</Text>
                    <Text style={styles.dateTotal}>{formatCurrency(group.totalExpense)}</Text>
                  </View>

                  {/* Regular Daily Expenses */}
                  {group.expenses.map((expense) => (
                    <AnimatedPressable
                      key={expense.id}
                      style={styles.expenseCard}
                      onPress={() => {
                        setEditingExpense(expense);
                        setIsExpenseModalOpen(true);
                      }}
                      scaleTo={0.98}
                    >
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseType}>{expense.type_name}</Text>
                        {expense.subtype_name && (
                          <Text style={styles.expenseSubtype}>{expense.subtype_name}</Text>
                        )}
                      </View>
                      <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                    </AnimatedPressable>
                  ))}

                  {/* Expandable Recurring Expenses Section */}
                  {hasRecurring && (
                    <View style={styles.recurringSectionContainer}>
                      <AnimatedPressable
                        style={styles.recurringToggle}
                        onPress={() => toggleRecurringSection(group.date)}
                        scaleTo={0.98}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Repeat size={13} color={THEME.accent.recurring} style={{ marginRight: 6 }} />
                          <Text style={styles.recurringToggleText}>
                            Recurring Allocations ({group.recurringAllocations.length})
                          </Text>
                        </View>
                        {isRecurringExpanded ? (
                          <ChevronUp size={15} color={THEME.text.secondary} />
                        ) : (
                          <ChevronDown size={15} color={THEME.text.secondary} />
                        )}
                      </AnimatedPressable>

                      {isRecurringExpanded && (
                        <View style={styles.recurringList}>
                          {group.recurringAllocations.map((alloc) => (
                            <View key={alloc.id} style={styles.recurringRow}>
                              <Text style={styles.recurringName}>{alloc.name}</Text>
                              <Text style={styles.recurringCost}>
                                {formatCurrency(alloc.daily_cost)}/day
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Tab 2: Monthly Overview */}
      {activeTab === 'monthly' && (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Monthly KPI Summary Card */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Income</Text>
              <Text
                style={[styles.kpiValue, { color: THEME.accent.income }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(monthlyIncome)}
              </Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Expenses</Text>
              <Text
                style={[styles.kpiValue, { color: THEME.accent.expense }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(monthlyExpense)}
              </Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>Balance</Text>
              <Text
                style={[
                  styles.kpiValue,
                  { color: monthlyBalance >= 0 ? THEME.accent.income : THEME.accent.expense },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatBalance(monthlyBalance)}
              </Text>
            </View>
          </View>

          {/* Income Distribution (Pie Chart) */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingUp size={16} color={THEME.accent.income} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Income Distribution</Text>
            </View>
            <PieChart slices={monthlyIncomePie.slices} total={monthlyIncomePie.total} />
          </View>

          {/* Expense Ranking (Horizontal Bar Chart) */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingDown size={16} color={THEME.accent.expense} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Expenses by Category</Text>
            </View>
            <HorizontalBarChart
              items={monthlyExpenseRanking.items}
              total={monthlyExpenseRanking.total}
              onItemPress={handleCategoryPress}
            />
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Tab 3: Yearly View with Individual Values & Breakdown */}
      {activeTab === 'yearly' && (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Yearly 12M KPI Summary Card */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>12M Income</Text>
              <Text
                style={[styles.kpiValue, { color: THEME.accent.income }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(yearlyIncomeTotal)}
              </Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>12M Expenses</Text>
              <Text
                style={[styles.kpiValue, { color: THEME.accent.expense }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(yearlyExpenseTotal)}
              </Text>
            </View>

            <View style={styles.kpiDivider} />

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>12M Balance</Text>
              <Text
                style={[
                  styles.kpiValue,
                  { color: yearlyBalance >= 0 ? THEME.accent.income : THEME.accent.expense },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatBalance(yearlyBalance)}
              </Text>
            </View>
          </View>

          {/* Income Stacked Bar Chart */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingUp size={16} color={THEME.accent.income} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Income (Last 12 Months)</Text>
            </View>
            <StackedBarChart
              groups={yearlyIncomeStacked.groups}
              typeColors={yearlyIncomeStacked.typeColors}
              selectedMonthKey={selectedMonthKey}
              onMonthPress={handleYearlyMonthPress}
            />
          </View>

          {/* Expense Line Chart with individual values & tooltips */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingDown size={16} color={THEME.accent.expense} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Expenses (Last 12 Months)</Text>
            </View>
            <LineChart
              data={yearlyExpenseLine}
              lineColor={THEME.accent.expense}
              fillColor="rgba(244, 63, 94, 0.08)"
              valuePrefix="Rs. "
              onPointPress={(pt) => pt.rawKey && handleYearlyMonthPress(pt.rawKey)}
            />
          </View>

          {/* 12-Month Balance Breakdown Table */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <Scale size={16} color={THEME.text.secondary} style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Monthly Balance Breakdown</Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Month</Text>
              <Text style={[styles.tableColHeader, { flex: 1.3, textAlign: 'right' }]}>Income</Text>
              <Text style={[styles.tableColHeader, { flex: 1.3, textAlign: 'right' }]}>Expenses</Text>
              <Text style={[styles.tableColHeader, { flex: 1.4, textAlign: 'right' }]}>Balance</Text>
            </View>
            {visibleYearlyBreakdown.map((row) => (
              <AnimatedPressable
                key={row.key}
                style={[
                  styles.tableRow,
                  row.key === selectedMonthKey && styles.tableRowSelected,
                ]}
                onPress={() => handleYearlyMonthPress(row.key)}
                scaleTo={0.98}
              >
                <Text style={[styles.tableMonthText, { flex: 1.1 }]}>{row.label}</Text>
                <Text style={[styles.tableIncomeText, { flex: 1.3 }]}>
                  {formatCurrency(row.income)}
                </Text>
                <Text style={[styles.tableExpenseText, { flex: 1.3 }]}>
                  {formatCurrency(row.expense)}
                </Text>
                <Text
                  style={[
                    styles.tableBalanceText,
                    {
                      flex: 1.4,
                      color: row.balance >= 0 ? THEME.accent.income : THEME.accent.expense,
                    },
                  ]}
                >
                  {formatBalance(row.balance)}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Floating Speed Dial (+) with Spring Animation */}
      <View style={styles.fabContainer}>
        {isSpeedDialOpen && (
          <FadeInView style={styles.speedDialOptions}>
            <AnimatedPressable
              style={[styles.speedDialBtn, { backgroundColor: THEME.bg.cardHover }]}
              onPress={() => {
                setIsSpeedDialOpen(false);
                setEditingRecurring(null);
                setIsRecurringModalOpen(true);
              }}
              scaleTo={0.92}
            >
              <Text style={styles.speedDialText}>+ Recurring</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.speedDialBtn, { backgroundColor: THEME.bg.cardHover }]}
              onPress={() => {
                setIsSpeedDialOpen(false);
                setEditingIncome(null);
                setIsIncomeModalOpen(true);
              }}
              scaleTo={0.92}
            >
              <Text style={styles.speedDialText}>+ Income</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.speedDialBtn, { backgroundColor: THEME.text.primary }]}
              onPress={() => {
                setIsSpeedDialOpen(false);
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              scaleTo={0.92}
            >
              <Text style={[styles.speedDialText, { color: '#090D16' }]}>+ Expense</Text>
            </AnimatedPressable>
          </FadeInView>
        )}

        <AnimatedPressable
          style={[styles.mainFab, isSpeedDialOpen && styles.mainFabActive]}
          onPress={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
          scaleTo={0.9}
        >
          <Plus size={22} color={isSpeedDialOpen ? THEME.text.primary : '#090D16'} style={isSpeedDialOpen ? { transform: [{ rotate: '45deg' }] } : undefined} />
        </AnimatedPressable>
      </View>

      {/* Modals */}
      <AddExpenseModal
        visible={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        expenseTypes={expenseTypes}
        onAddNewType={handleAddNewExpenseType}
        initialRecord={editingExpense}
      />

      <AddIncomeModal
        visible={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        onDelete={handleDeleteIncome}
        incomeTypes={incomeTypes}
        onAddNewType={handleAddNewIncomeType}
        initialRecord={editingIncome}
      />

      <AddRecurringModal
        visible={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditingRecurring(null);
        }}
        onSave={handleSaveRecurring}
        initialRecord={editingRecurring}
      />

      <RenewRecurringModal
        visible={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setEditingRecurring(null);
        }}
        onRenew={handleRenewRecurring}
        item={editingRecurring}
      />

      <SubtypeDrilldownModal
        visible={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        categoryName={drilldownCategory}
        monthName={formatMonthYear(selectedDate)}
        items={drilldownData.items}
        total={drilldownData.total}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg.main,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: THEME.bg.card,
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  tabBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: THEME.bg.chipActive,
  },
  tabText: {
    color: THEME.text.tertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 14,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
    marginBottom: 6,
  },
  dateTitle: {
    color: THEME.text.secondary,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dateTotal: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.bg.card,
    padding: 11,
    borderRadius: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseType: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  expenseSubtype: {
    color: THEME.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  recurringSectionContainer: {
    marginTop: 4,
    backgroundColor: THEME.bg.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    overflow: 'hidden',
  },
  recurringToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  recurringToggleText: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  recurringList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: THEME.bg.border,
  },
  recurringName: {
    color: THEME.text.secondary,
    fontSize: 12.5,
  },
  recurringCost: {
    color: THEME.accent.recurring,
    fontSize: 12.5,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: THEME.bg.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderTitle: {
    color: THEME.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: THEME.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySub: {
    color: THEME.text.tertiary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
  },
  speedDialOptions: {
    marginBottom: 10,
    alignItems: 'flex-end',
    gap: 6,
  },
  speedDialBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    elevation: 3,
  },
  speedDialText: {
    color: THEME.text.primary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  mainFab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mainFabActive: {
    backgroundColor: THEME.bg.cardHover,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  drillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  drillBannerText: {
    color: THEME.accent.blue,
    fontSize: 12,
    fontWeight: '600',
  },
  kpiCard: {
    backgroundColor: THEME.bg.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  kpiDivider: {
    width: 1,
    height: 30,
    backgroundColor: THEME.bg.border,
  },
  kpiLabel: {
    color: THEME.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  tableColHeader: {
    color: THEME.text.tertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  tableRowSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  tableMonthText: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  tableIncomeText: {
    color: THEME.accent.income,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  tableExpenseText: {
    color: THEME.accent.expense,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  tableBalanceText: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'right',
  },
});
