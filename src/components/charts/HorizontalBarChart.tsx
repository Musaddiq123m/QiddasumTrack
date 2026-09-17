import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { HorizontalBarItem } from '../../types';
import { formatCurrency } from '../../utils/dateUtils';

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
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      )}

      {items.map((item) => {
        const barWidthPercent = Math.max(4, Math.round((item.amount / maxAmount) * 100));
        const isClickable = !item.isRecurring && !!onItemPress;

        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, isClickable && styles.rowClickable]}
            disabled={!isClickable}
            onPress={() => isClickable && onItemPress?.(item)}
            activeOpacity={0.7}
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
                {isClickable && <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 4 }} />}
              </View>
            </View>

            {/* Horizontal progress bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${barWidthPercent}%`,
                    backgroundColor: item.color || '#EF4444',
                  },
                ]}
              />
            </View>

            <View style={styles.bottomLine}>
              <Text style={styles.percentText}>{item.percentage}% of total</Text>
              {isClickable && <Text style={styles.drilldownHint}>Tap for subtypes</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  totalValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  row: {
    marginBottom: 14,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowClickable: {
    borderColor: '#475569',
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
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  recurringBadge: {
    backgroundColor: '#312E81',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  recurringBadgeText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  percentText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  drilldownHint: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '500',
  },
});
