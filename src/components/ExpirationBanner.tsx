import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, ChevronRight } from 'lucide-react-native';
import { RecurringExpense } from '../types';
import { THEME } from '../theme/colors';
import { AnimatedPressable } from './AnimatedComponents';

interface ExpirationBannerProps {
  expiringItems: { expense: RecurringExpense; daysRemaining: number }[];
  onRenewPress: (item: RecurringExpense) => void;
}

export const ExpirationBanner: React.FC<ExpirationBannerProps> = ({
  expiringItems,
  onRenewPress,
}) => {
  if (!expiringItems || expiringItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {expiringItems.map(({ expense, daysRemaining }) => {
        const timeText =
          daysRemaining === 0
            ? 'expires today'
            : daysRemaining === 1
            ? 'expires tomorrow'
            : `expires in ${daysRemaining} days`;

        return (
          <AnimatedPressable
            key={expense.id}
            style={styles.banner}
            onPress={() => onRenewPress(expense)}
            scaleTo={0.98}
          >
            <View style={styles.iconContainer}>
              <Clock size={16} color="#F59E0B" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                <Text style={styles.bold}>{expense.name}</Text>
                <Text style={styles.timeText}> • {timeText}</Text>
              </Text>
              <Text style={styles.subtext}>Action required • Tap to extend period</Text>
            </View>

            <View style={styles.renewBadge}>
              <Text style={styles.renewBadgeText}>Renew</Text>
              <ChevronRight size={13} color="#090D16" style={{ marginLeft: 2 }} />
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderLeftColor: '#F59E0B',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
  },
  bold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeText: {
    color: '#FBBF24',
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtext: {
    color: 'rgba(253, 230, 138, 0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  renewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  renewBadgeText: {
    color: '#090D16',
    fontSize: 12,
    fontWeight: '700',
  },
});
