import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Plus,
  Flame,
  Footprints,
  Navigation,
  Gauge,
  Calendar as CalendarIcon,
  Activity,
  Edit2,
} from 'lucide-react-native';
import { ChartDataPoint, WalkingRecord } from '../types';
import { WalkingRepo } from '../db/repositories/walkingRepo';
import { WalkingCalendar } from '../components/WalkingCalendar';
import { LineChart } from '../components/charts/LineChart';
import { AddWalkingModal } from '../components/modals/AddWalkingModal';
import { DateNavigator } from '../components/DateNavigator';
import { formatDisplayDate, getTodayString } from '../utils/dateUtils';
import { THEME } from '../theme/colors';
import { AnimatedPressable, FadeInView } from '../components/AnimatedComponents';

export const StepsScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [streak, setStreak] = useState<number>(0);
  const [walkedDates, setWalkedDates] = useState<Set<string>>(new Set());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(getTodayString());
  const [selectedDateRecords, setSelectedDateRecords] = useState<WalkingRecord[]>([]);

  // Chart controls
  const [timeframe, setTimeframe] = useState<'7d' | '12w' | '12m'>('7d');
  const [metric, setMetric] = useState<'steps' | 'distance'>('steps');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // History pagination
  const [historyLimit, setHistoryLimit] = useState<number>(50);
  const [totalHistoryCount, setTotalHistoryCount] = useState<number>(0);

  // History list
  const [history, setHistory] = useState<WalkingRecord[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WalkingRecord | null>(null);

  const loadData = useCallback(() => {
    const st = WalkingRepo.calculateStreak();
    setStreak(st);

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const dates = WalkingRepo.getWalkedDatesForMonth(y, m);
    setWalkedDates(dates);

    if (selectedCalendarDate) {
      const dayRecs = WalkingRepo.getForDate(selectedCalendarDate);
      setSelectedDateRecords(dayRecs);
    }

    const pts = WalkingRepo.getChartData(timeframe, metric);
    setChartData(pts);

    const totalCount = WalkingRepo.getTotalCount();
    setTotalHistoryCount(totalCount);

    const all = WalkingRepo.getAll(historyLimit, 0);
    setHistory(all);
  }, [currentDate, selectedCalendarDate, timeframe, metric, historyLimit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(next);
  };

  const handleSelectCalendarDate = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    const recs = WalkingRepo.getForDate(dateStr);
    setSelectedDateRecords(recs);
  };

  const handleSaveWalking = (steps: number, distanceKm: number, speedKmh: number, date: string, id?: string) => {
    if (id) {
      WalkingRepo.update(id, steps, distanceKm, speedKmh, date);
    } else {
      WalkingRepo.add(steps, distanceKm, speedKmh, date);
    }
    loadData();
  };

  const handleDeleteWalking = (id: string) => {
    WalkingRepo.delete(id);
    loadData();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 250) {
      if (history.length < totalHistoryCount) {
        setHistoryLimit((prev) => prev + 50);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {/* Refined Minimalist Streak Card (No emojis) */}
        <FadeInView style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <View style={styles.streakIconWrapper}>
              <Flame size={20} color={THEME.text.primary} />
            </View>
            <View>
              <Text style={styles.streakCount}>
                {streak} {streak === 1 ? 'Day' : 'Days'} Streak
              </Text>
              <Text style={styles.streakSub}>
                {streak > 0 ? 'Consistent daily walking' : 'Log today’s walk to start your streak'}
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Section: Walking Trends with Line Chart & Individual Values */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <View style={styles.titleRow}>
              <Activity size={16} color={THEME.text.secondary} style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Walking Trends</Text>
            </View>

            {/* Metric Switch: Steps vs Distance */}
            <View style={styles.metricToggle}>
              <AnimatedPressable
                style={[styles.toggleBtn, metric === 'steps' && styles.toggleBtnActive]}
                onPress={() => setMetric('steps')}
                scaleTo={0.92}
              >
                <Text style={[styles.toggleText, metric === 'steps' && styles.toggleTextActive]}>
                  Steps
                </Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.toggleBtn, metric === 'distance' && styles.toggleBtnActive]}
                onPress={() => setMetric('distance')}
                scaleTo={0.92}
              >
                <Text style={[styles.toggleText, metric === 'distance' && styles.toggleTextActive]}>
                  KM
                </Text>
              </AnimatedPressable>
            </View>
          </View>

          {/* Timeframe Switch: 7d | 12w | 12m */}
          <View style={styles.timeframeRow}>
            {(['7d', '12w', '12m'] as const).map((tf) => (
              <AnimatedPressable
                key={tf}
                style={[styles.timeframeChip, timeframe === tf && styles.timeframeChipActive]}
                onPress={() => setTimeframe(tf)}
                scaleTo={0.94}
              >
                <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
                  {tf === '7d' ? '7 Days' : tf === '12w' ? '12 Weeks' : '12 Months'}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          {/* Line Chart showing Strava-style stats and interactive vertical cursor */}
          <LineChart
            data={chartData}
            lineColor="#F97316"
            fillColor="rgba(249, 115, 22, 0.18)"
            valueSuffix={metric === 'distance' ? ' km' : ''}
            showFitnessHeader={true}
            timeframe={timeframe}
            timeframeLabel={timeframe === '7d' ? 'Past 7 days' : timeframe === '12w' ? 'Past 12 weeks' : 'Past 12 months'}
          />
        </View>

        {/* Section: Walking Calendar */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <CalendarIcon size={16} color={THEME.text.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Walking Calendar</Text>
          </View>

          <DateNavigator
            currentDate={currentDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onResetToday={() => setCurrentDate(new Date())}
          />

          <WalkingCalendar
            year={currentDate.getFullYear()}
            month={currentDate.getMonth() + 1}
            walkedDates={walkedDates}
            selectedDate={selectedCalendarDate}
            onSelectDate={handleSelectCalendarDate}
          />

          {/* Selected Date Records Info */}
          {selectedCalendarDate && (
            <View style={styles.selectedDateBox}>
              <Text style={styles.selectedDateTitle}>
                {formatDisplayDate(selectedCalendarDate)}
              </Text>
              {selectedDateRecords.length === 0 ? (
                <Text style={styles.noWalkText}>No walks recorded for this date.</Text>
              ) : (
                selectedDateRecords.map((rec) => (
                  <AnimatedPressable
                    key={rec.id}
                    style={styles.dayRecordCard}
                    onPress={() => {
                      setEditingRecord(rec);
                      setIsModalOpen(true);
                    }}
                    scaleTo={0.98}
                  >
                    <View style={styles.statItem}>
                      <Footprints size={14} color={THEME.text.secondary} />
                      <Text style={styles.statVal}>{rec.steps.toLocaleString()} steps</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Navigation size={14} color={THEME.accent.blue} />
                      <Text style={styles.statVal}>{rec.distance_km} km</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Gauge size={14} color={THEME.text.secondary} />
                      <Text style={styles.statVal}>{rec.speed_kmh} km/h</Text>
                    </View>
                  </AnimatedPressable>
                ))
              )}
            </View>
          )}
        </View>

        {/* Section: Walking History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No walking entries recorded yet.</Text>
          ) : (
            history.map((rec) => (
              <AnimatedPressable
                key={rec.id}
                style={styles.historyItem}
                onPress={() => {
                  setEditingRecord(rec);
                  setIsModalOpen(true);
                }}
                scaleTo={0.98}
              >
                <View style={styles.historyTop}>
                  <Text style={styles.historyDate}>{formatDisplayDate(rec.date)}</Text>
                  <Edit2 size={13} color={THEME.text.tertiary} />
                </View>

                <View style={styles.historyStatsRow}>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatNum}>{rec.steps.toLocaleString()}</Text>
                    <Text style={styles.historyStatLabel}>Steps</Text>
                  </View>
                  <View style={styles.historyDivider} />
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatNum}>{rec.distance_km} km</Text>
                    <Text style={styles.historyStatLabel}>Distance</Text>
                  </View>
                  <View style={styles.historyDivider} />
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatNum}>{rec.speed_kmh} km/h</Text>
                    <Text style={styles.historyStatLabel}>Speed</Text>
                  </View>
                </View>
              </AnimatedPressable>
            ))
          )}

          {history.length < totalHistoryCount && (
            <AnimatedPressable
              style={styles.loadMoreBtn}
              onPress={() => setHistoryLimit((prev) => prev + 50)}
              scaleTo={0.97}
            >
              <Text style={styles.loadMoreText}>
                Load More Activities ({history.length} of {totalHistoryCount})
              </Text>
            </AnimatedPressable>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add (+) Button with Spring Bounce */}
      <AnimatedPressable
        style={styles.fab}
        onPress={() => {
          setEditingRecord(null);
          setIsModalOpen(true);
        }}
        scaleTo={0.9}
      >
        <Plus size={24} color="#090D16" />
      </AnimatedPressable>

      <AddWalkingModal
        visible={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveWalking}
        onDelete={handleDeleteWalking}
        initialRecord={editingRecord}
        defaultDate={selectedCalendarDate || getTodayString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg.main,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  streakCard: {
    backgroundColor: THEME.bg.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streakIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.bg.chipActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakCount: {
    color: THEME.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  streakSub: {
    color: THEME.text.secondary,
    fontSize: 12,
    marginTop: 1,
  },
  card: {
    backgroundColor: THEME.bg.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: THEME.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  metricToggle: {
    flexDirection: 'row',
    backgroundColor: THEME.bg.input,
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: THEME.bg.chipActive,
  },
  toggleText: {
    color: THEME.text.tertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  timeframeChip: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 6,
    backgroundColor: THEME.bg.input,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  timeframeChipActive: {
    backgroundColor: THEME.bg.chipActive,
    borderColor: THEME.accent.blue,
  },
  timeframeText: {
    color: THEME.text.tertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
  selectedDateBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.bg.border,
  },
  selectedDateTitle: {
    color: THEME.text.primary,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  noWalkText: {
    color: THEME.text.tertiary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  dayRecordCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: THEME.bg.input,
    padding: 9,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statVal: {
    color: THEME.text.primary,
    fontSize: 12.5,
    fontWeight: '500',
  },
  emptyText: {
    color: THEME.text.tertiary,
    fontSize: 12.5,
    marginTop: 6,
  },
  historyItem: {
    backgroundColor: THEME.bg.input,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {
    color: THEME.text.primary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  historyStat: {
    alignItems: 'center',
  },
  historyStatNum: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  historyStatLabel: {
    color: THEME.text.tertiary,
    fontSize: 10,
    marginTop: 1,
  },
  historyDivider: {
    width: 1,
    height: 20,
    backgroundColor: THEME.bg.border,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
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
  loadMoreBtn: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: THEME.bg.chip,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
