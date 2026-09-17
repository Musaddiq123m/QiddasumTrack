import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react-native';
import { formatMonthYear, getMonthKey } from '../utils/dateUtils';

interface DateNavigatorProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToday?: () => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onResetToday,
}) => {
  const isCurrentMonth = getMonthKey(currentDate) === getMonthKey(new Date());

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={onPrevMonth}
        activeOpacity={0.7}
        accessibilityLabel="Previous month"
      >
        <ChevronLeft size={22} color="#F8FAFC" />
      </TouchableOpacity>

      <View style={styles.centerContainer}>
        <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
        {!isCurrentMonth && onResetToday && (
          <TouchableOpacity style={styles.todayBadge} onPress={onResetToday} activeOpacity={0.7}>
            <RotateCcw size={10} color="#38BDF8" style={{ marginRight: 4 }} />
            <Text style={styles.todayBadgeText}>Current</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.navButton}
        onPress={onNextMonth}
        activeOpacity={0.7}
        accessibilityLabel="Next month"
      >
        <ChevronRight size={22} color="#F8FAFC" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  monthText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  todayBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
});
