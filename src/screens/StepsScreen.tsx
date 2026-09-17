import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
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

  // History list
  const [history, setHistory] = useState<WalkingRecord[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WalkingRecord | null>(null);

  const loadData = useCallback(() => {
    // 1. Streak
    const st = WalkingRepo.calculateStreak();
    setStreak(st);

    // 2. Calendar Walked Dates for selected month
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const dates = WalkingRepo.getWalkedDatesForMonth(y, m);
    setWalkedDates(dates);

    // 3. Selected day records
    if (selectedCalendarDate) {
      const dayRecs = WalkingRepo.getForDate(selectedCalendarDate);
      setSelectedDateRecords(dayRecs);
    }

    // 4. Chart data
    const pts = WalkingRepo.getChartData(timeframe, metric);
    setChartData(pts);

    // 5. History (newest first)
    const all = WalkingRepo.getAll(50, 0);
    setHistory(all);
  }, [currentDate, selectedCalendarDate, timeframe, metric]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calendar month navigation
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prominent Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <View style={styles.fireCircle}>
              <Flame size={28} color="#F97316" />
            </View>
            <View>
              <Text style={styles.streakCount}>
                {streak} {streak === 1 ? 'Day' : 'Days'} Streak
              </Text>
              <Text style={styles.streakSub}>
                {streak > 0 ? 'Keep up the momentum!' : 'Take a walk today to start your streak!'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Walking Charts */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <View style={styles.titleRow}>
              <Activity size={18} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Walking Trends</Text>
            </View>

            {/* Metric Switch: Steps vs Distance */}
            <View style={styles.metricToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, metric === 'steps' && styles.toggleBtnActive]}
                onPress={() => setMetric('steps')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, metric === 'steps' && styles.toggleTextActive]}>
                  Steps
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, metric === 'distance' && styles.toggleBtnActive]}
                onPress={() => setMetric('distance')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, metric === 'distance' && styles.toggleTextActive]}>
                  KM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timeframe Switch: 7d | 12w | 12m */}
          <View style={styles.timeframeRow}>
            {(['7d', '12w', '12m'] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[styles.timeframeChip, timeframe === tf && styles.timeframeChipActive]}
                onPress={() => setTimeframe(tf)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
                  {tf === '7d' ? 'Last 7 Days' : tf === '12w' ? 'Last 12 Weeks' : 'Last 12 Months'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <LineChart
            data={chartData}
            lineColor={metric === 'steps' ? '#10B981' : '#38BDF8'}
            fillColor={metric === 'steps' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)'}
            valueSuffix={metric === 'distance' ? ' km' : ''}
          />
        </View>

        {/* Section: Walking Calendar */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <CalendarIcon size={18} color="#38BDF8" style={{ marginRight: 6 }} />
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
                <Text style={styles.noWalkText}>No walks recorded for this day.</Text>
              ) : (
                selectedDateRecords.map((rec) => (
                  <TouchableOpacity
                    key={rec.id}
                    style={styles.dayRecordCard}
                    onPress={() => {
                      setEditingRecord(rec);
                      setIsModalOpen(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statItem}>
                      <Footprints size={16} color="#10B981" />
                      <Text style={styles.statVal}>{rec.steps.toLocaleString()} steps</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Navigation size={15} color="#38BDF8" />
                      <Text style={styles.statVal}>{rec.distance_km} km</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Gauge size={15} color="#F59E0B" />
                      <Text style={styles.statVal}>{rec.speed_kmh} km/h</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Section: Walking History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Walking History</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No walking entries recorded yet.</Text>
          ) : (
            history.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={styles.historyItem}
                onPress={() => {
                  setEditingRecord(rec);
                  setIsModalOpen(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.historyTop}>
                  <Text style={styles.historyDate}>{formatDisplayDate(rec.date)}</Text>
                  <Edit2 size={14} color="#64748B" />
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
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add (+) Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingRecord(null);
          setIsModalOpen(true);
        }}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add / Edit Walking Modal */}
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
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  streakCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  streakCount: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  streakSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  metricToggle: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#334155',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  timeframeChip: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeChipActive: {
    backgroundColor: '#334155',
  },
  timeframeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: '#38BDF8',
  },
  selectedDateBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  selectedDateTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  noWalkText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  dayRecordCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statVal: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  historyItem: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
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
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyStatLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  historyDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
