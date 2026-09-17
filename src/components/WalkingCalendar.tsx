import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getTodayString,
  padZero,
} from '../utils/dateUtils';

interface WalkingCalendarProps {
  year: number;
  month: number; // 1 - 12
  walkedDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export const WalkingCalendar: React.FC<WalkingCalendarProps> = ({
  year,
  month,
  walkedDates,
  selectedDate,
  onSelectDate,
}) => {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = getTodayString();

  const daysInMonth = getDaysInMonth(year, month);
  // getFirstDayOfMonth returns 0 for Sunday. We want Monday = 0
  const firstDay = (getFirstDayOfMonth(year, month) + 6) % 7;

  // Build grid slots
  const slots: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    slots.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    slots.push(d);
  }

  return (
    <View style={styles.container}>
      {/* Day of week headers */}
      <View style={styles.weekHeader}>
        {dayNames.map((name) => (
          <Text key={name} style={styles.dayHeaderText}>
            {name}
          </Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.grid}>
        {slots.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.daySlot} />;
          }

          const dateStr = `${year}-${padZero(month)}-${padZero(day)}`;
          const hasWalked = walkedDates.has(dateStr);
          const isToday = dateStr === today;
          const isSelected = selectedDate === dateStr;

          return (
            <TouchableOpacity
              key={`day-${day}`}
              style={[
                styles.daySlot,
                isToday && styles.todaySlot,
                isSelected && styles.selectedSlot,
              ]}
              onPress={() => onSelectDate(dateStr)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isToday && styles.todayNumber,
                  isSelected && styles.selectedNumber,
                ]}
              >
                {day}
              </Text>

              {/* Walking dot indicator */}
              <View style={styles.dotContainer}>
                {hasWalked && (
                  <View style={[styles.walkDot, isSelected && styles.walkDotSelected]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.walkDot} />
          <Text style={styles.legendText}>Walked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.todayBox]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  dayHeaderText: {
    width: 38,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySlot: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  todaySlot: {
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  selectedSlot: {
    backgroundColor: '#10B981',
  },
  dayNumber: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
  },
  todayNumber: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  selectedNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dotContainer: {
    height: 6,
    justifyContent: 'center',
    marginTop: 2,
  },
  walkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  walkDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 6,
  },
  todayBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
});
