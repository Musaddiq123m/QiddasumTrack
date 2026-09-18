import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react-native';
import { formatMonthYear, getMonthKey } from '../utils/dateUtils';
import { THEME } from '../theme/colors';
import { AnimatedPressable } from './AnimatedComponents';

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
      <AnimatedPressable
        style={styles.navButton}
        onPress={onPrevMonth}
        scaleTo={0.92}
        accessibilityLabel="Previous month"
      >
        <ChevronLeft size={18} color={THEME.text.secondary} />
      </AnimatedPressable>

      <View style={styles.centerContainer}>
        <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
        {!isCurrentMonth && onResetToday && (
          <AnimatedPressable style={styles.todayBadge} onPress={onResetToday} scaleTo={0.94}>
            <RotateCcw size={10} color={THEME.text.secondary} style={{ marginRight: 4 }} />
            <Text style={styles.todayBadgeText}>Current</Text>
          </AnimatedPressable>
        )}
      </View>

      <AnimatedPressable
        style={styles.navButton}
        onPress={onNextMonth}
        scaleTo={0.92}
        accessibilityLabel="Next month"
      >
        <ChevronRight size={18} color={THEME.text.secondary} />
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.bg.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  monthText: {
    color: THEME.text.primary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  todayBadgeText: {
    color: THEME.text.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
});
