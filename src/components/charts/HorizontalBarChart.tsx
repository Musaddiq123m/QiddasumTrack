import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { HorizontalBarItem } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';
import { THEME } from '../../theme/colors';
import { AnimatedPressable } from '../AnimatedComponents';

interface HorizontalBarChartProps {
  items: HorizontalBarItem[];
  onItemPress?: (item: HorizontalBarItem) => void;
  emptyMessage?: string;
  total?: number;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  items,
  onItemPress,
  emptyMessage = 'No expenses recorded for this period.',
  total,
}) => {
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const maxAmount = Math.max(...items.map((i) => i.amount), 1);

  return (
    <View style={styles.container}>
      {total !== undefined && (
        <View style={styles.totalHeader}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      )}

      {items.map((item) => {
        const barWidthPercent = Math.max(3, Math.round((item.amount / maxAmount) * 100));
        const isClickable = !item.isRecurring && !!onItemPress;

        return (
          <AnimatedPressable
            key={item.id}
            style={[styles.row, isClickable && styles.rowClickable]}
            disabled={!isClickable}
            onPress={() => isClickable && onItemPress?.(item)}
            scaleTo={isClickable ? 0.98 : 1}
          >
            <View style={styles.topLine}>
              <View style={styles.nameContainer}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isRecurring && (
                  <View style={styles.recurringBadge}>
                    <Text style={styles.recurringBadgeText}>Recurring</Text>
                  </View>
                )}
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
                {isClickable && <ChevronRight size={14} color={THEME.text.tertiary} style={{ marginLeft: 4 }} />}
              </View>
            </View>

            {/* Horizontal progress bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${barWidthPercent}%`,
                    backgroundColor: item.isRecurring ? THEME.accent.recurring : (item.color || THEME.accent.expense),
                  },
                ]}
              />
            </View>

            <View style={styles.bottomLine}>
              <Text style={styles.percentText}>{item.percentage}% of total</Text>
              {isClickable && <Text style={styles.drilldownHint}>Details</Text>}
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
  },
  totalLabel: {
    color: THEME.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  totalValue: {
    color: THEME.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg.card,
    borderRadius: 12,
    marginVertical: 4,
  },
  emptyText: {
    color: THEME.text.tertiary,
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    marginBottom: 8,
    backgroundColor: THEME.bg.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  rowClickable: {
    borderColor: THEME.bg.borderLight,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameText: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  recurringBadge: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  recurringBadgeText: {
    color: THEME.accent.recurring,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: THEME.bg.input,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  percentText: {
    color: THEME.text.tertiary,
    fontSize: 11,
  },
  drilldownHint: {
    color: THEME.accent.blue,
    fontSize: 11,
    fontWeight: '500',
  },
});
