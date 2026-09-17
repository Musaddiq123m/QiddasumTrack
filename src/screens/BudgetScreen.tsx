import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
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
  Edit2,
  Trash2,
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
import { formatCurrency, formatMonthYear, getMonthKey, getTodayString } from '../utils/dateUtils';

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

  const loadData = useCallback(() => {
    // 1. Expiration check
    const expiring = RecurringRepo.getExpiringWithin(2);
    setExpiringRecurring(expiring);

    // 2. Types
    const expTypes = ExpenseRepo.getTypes();
    setExpenseTypes(expTypes);
    const incTypes = IncomeRepo.getTypes();
    setIncomeTypes(incTypes);

    // 3. Timeline
    const timeline = ExpenseRepo.getTimelineGrouped(100, 0);
    setGroupedTimeline(timeline);

    // 4. Monthly Views
    const expenseRanking = ExpenseRepo.getMonthlyRankingWithRecurring(selectedMonthKey);
    setMonthlyExpenseRanking(expenseRanking);

    const incomePie = IncomeRepo.getMonthlyDistribution(selectedMonthKey);
    setMonthlyIncomePie(incomePie);

    // 5. Yearly Views
    const stacked = IncomeRepo.getYearlyStackedBars(selectedMonthKey);
    setYearlyIncomeStacked(stacked);

    const expenseLine = ExpenseRepo.getYearlyLineData(selectedMonthKey);
    setYearlyExpenseLine(expenseLine);
  }, [selectedMonthKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date navigation
  const handlePrevMonth = () => {
    const prev = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    setSelectedDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    setSelectedDate(next);
  };

  const handleResetToday = () => {
    setSelectedDate(new Date());
  };

  // Month tap drill-down from Yearly chart to Monthly view!
  const handleYearlyMonthPress = (monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, 1));
    setActiveTab('monthly');
  };

  // Toggle recurring in daily timeline
  const toggleRecurringSection = (dateStr: string) => {
    setExpandedRecurringDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  // Category drill-down
  const handleCategoryPress = (item: HorizontalBarItem) => {
    if (item.isRecurring) return;
    const breakdown = ExpenseRepo.getSubtypeBreakdown(item.id, selectedMonthKey);
    setDrilldownCategory(item.name);
    setDrilldownData(breakdown);
    setIsDrilldownOpen(true);
  };

  // Save handlers
  const handleSaveExpense = (typeId: string, subtypeName: string | null, amount: number, date: string, id?: string) => {
    if (id) {
      ExpenseRepo.update(id, typeId, subtypeName, amount, date);
    } else {
      ExpenseRepo.add(typeId, subtypeName, amount, date);
    }
    loadData();
  };

  const handleDeleteExpense = (id: string) => {
    ExpenseRepo.delete(id);
    loadData();
  };

  const handleSaveIncome = (typeId: string, amount: number, date: string, id?: string) => {
    if (id) {
      IncomeRepo.update(id, typeId, amount, date);
    } else {
      IncomeRepo.add(typeId, amount, date);
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

      {/* Persistent Recurring Expiration Warning Banner */}
      <ExpirationBanner
        expiringItems={expiringRecurring}
        onRenewPress={(item) => {
          setEditingRecurring(item);
          setIsRenewModalOpen(true);
        }}
      />

      {/* Sub-view Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'daily' && styles.tabBtnActive]}
          onPress={() => setActiveTab('daily')}
          activeOpacity={0.7}
        >
          <Calendar size={15} color={activeTab === 'daily' ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>Daily Timeline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'monthly' && styles.tabBtnActive]}
          onPress={() => setActiveTab('monthly')}
          activeOpacity={0.7}
        >
          <PieIcon size={15} color={activeTab === 'monthly' ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>Monthly</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'yearly' && styles.tabBtnActive]}
          onPress={() => setActiveTab('yearly')}
          activeOpacity={0.7}
        >
          <Layers size={15} color={activeTab === 'yearly' ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'yearly' && styles.tabTextActive]}>Yearly</Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Daily Timeline */}
      {activeTab === 'daily' && (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {groupedTimeline.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Expenses Yet</Text>
              <Text style={styles.emptySub}>Tap "+" button below to add your first expense</Text>
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
                    <TouchableOpacity
                      key={expense.id}
                      style={styles.expenseCard}
                      onPress={() => {
                        setEditingExpense(expense);
                        setIsExpenseModalOpen(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseType}>{expense.type_name}</Text>
                        {expense.subtype_name && (
                          <Text style={styles.expenseSubtype}>{expense.subtype_name}</Text>
                        )}
                      </View>
                      <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Expandable Recurring Expenses Section */}
                  {hasRecurring && (
                    <View style={styles.recurringSectionContainer}>
                      <TouchableOpacity
                        style={styles.recurringToggle}
                        onPress={() => toggleRecurringSection(group.date)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.recurringToggleText}>
                          Recurring Expenses ({group.recurringAllocations.length})
                        </Text>
                        {isRecurringExpanded ? (
                          <ChevronUp size={16} color="#818CF8" />
                        ) : (
                          <ChevronDown size={16} color="#818CF8" />
                        )}
                      </TouchableOpacity>

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
          {/* Section: Income Distribution (Pie Chart) */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingUp size={18} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Income Distribution</Text>
            </View>
            <PieChart slices={monthlyIncomePie.slices} total={monthlyIncomePie.total} />
          </View>

          {/* Section: Expense Ranking (Horizontal Bar Chart) */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingDown size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Monthly Expenses</Text>
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

      {/* Tab 3: Yearly View */}
      {activeTab === 'yearly' && (
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Income Stacked Bar Chart */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingUp size={18} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Yearly Income (Last 12 Months)</Text>
            </View>
            <StackedBarChart
              groups={yearlyIncomeStacked.groups}
              typeColors={yearlyIncomeStacked.typeColors}
              selectedMonthKey={selectedMonthKey}
              onMonthPress={handleYearlyMonthPress}
            />
          </View>

          {/* Expense Line Chart */}
          <View style={styles.chartCard}>
            <View style={styles.cardTitleRow}>
              <TrendingDown size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>Yearly Total Expenses</Text>
            </View>
            <LineChart
              data={yearlyExpenseLine}
              lineColor="#EF4444"
              fillColor="rgba(239, 68, 68, 0.12)"
              valuePrefix="Rs. "
              onPointPress={(pt) => pt.rawKey && handleYearlyMonthPress(pt.rawKey)}
            />
            <Text style={styles.drillHint}>Tap a month to view that month's details</Text>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Floating Speed Dial (+) */}
      <View style={styles.fabContainer}>
        {isSpeedDialOpen && (
          <View style={styles.speedDialOptions}>
            <TouchableOpacity
              style={[styles.speedDialBtn, { backgroundColor: '#6366F1' }]}
              onPress={() => {
                setIsSpeedDialOpen(false);
                setEditingRecurring(null);
                setIsRecurringModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.speedDialText}>+ Recurring</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.speedDialBtn, { backgroundColor: '#10B981' }]}
              onPress={() => {
                setIsSpeedDialOpen(false);
                setEditingIncome(null);
                setIsIncomeModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.speedDialText}>+ Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.speedDialBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => {
                setIsSpeedDialOpen(false);
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.speedDialText}>+ Expense</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainFab, isSpeedDialOpen && styles.mainFabActive]}
          onPress={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
          activeOpacity={0.85}
        >
          <Plus size={26} color="#FFFFFF" style={isSpeedDialOpen ? { transform: [{ rotate: '45deg' }] } : undefined} />
        </TouchableOpacity>
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
    backgroundColor: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#334155',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 8,
  },
  dateTitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateTotal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseType: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  expenseSubtype: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  expenseAmount: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  recurringSectionContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    overflow: 'hidden',
  },
  recurringToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recurringToggleText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
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
    borderTopColor: 'rgba(99, 102, 241, 0.12)',
  },
  recurringName: {
    color: '#C7D2FE',
    fontSize: 13,
  },
  recurringCost: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  drillHint: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
  },
  speedDialOptions: {
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  speedDialBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
  },
  speedDialText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mainFabActive: {
    backgroundColor: '#475569',
  },
});
