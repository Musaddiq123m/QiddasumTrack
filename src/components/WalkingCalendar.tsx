import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getTodayString,
  padZero,
} from '../utils/dateUtils';
import { THEME } from '../theme/colors';
import { AnimatedPressable } from './AnimatedComponents';

interface WalkingCalendarProps {
  year: number;
  month: number;
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
  const firstDay = (getFirstDayOfMonth(year, month) + 6) % 7;

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
          <View key={name} style={styles.dayHeaderCol}>
            <Text style={styles.dayHeaderText}>{name}</Text>
          </View>
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
            <AnimatedPressable
              key={`day-${day}`}
              style={styles.daySlot}
              onPress={() => onSelectDate(dateStr)}
              scaleTo={0.92}
            >
              <View
                style={[
                  styles.slotInner,
                  isToday && styles.todaySlot,
                  isSelected && styles.selectedSlot,
                ]}
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
              </View>
            </AnimatedPressable>
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
          <View style={styles.todayBox} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bg.card,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    marginVertical: 6,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
    paddingBottom: 6,
  },
  dayHeaderCol: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: {
    textAlign: 'center',
    color: THEME.text.tertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySlot: {
    width: '14.2857%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  slotInner: {
    width: '100%',
    height: '100%',
    maxWidth: 36,
    maxHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  todaySlot: {
    borderWidth: 1,
    borderColor: THEME.text.secondary,
  },
  selectedSlot: {
    backgroundColor: THEME.bg.chipActive,
    borderWidth: 1,
    borderColor: THEME.accent.blue,
  },
  dayNumber: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  todayNumber: {
    color: THEME.text.primary,
    fontWeight: '700',
  },
  selectedNumber: {
    color: THEME.text.primary,
    fontWeight: '700',
  },
  dotContainer: {
    height: 4,
    justifyContent: 'center',
    marginTop: 1,
  },
  walkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.accent.blue,
  },
  walkDotSelected: {
    backgroundColor: THEME.text.primary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.bg.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendText: {
    color: THEME.text.tertiary,
    fontSize: 11,
    marginLeft: 5,
  },
  todayBox: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: THEME.text.secondary,
  },
});
