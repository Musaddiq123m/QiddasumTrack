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
              <Clock size={15} color={THEME.text.secondary} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                <Text style={styles.bold}>{expense.name}</Text>
                <Text style={styles.timeText}> • {timeText}</Text>
              </Text>
              <Text style={styles.subtext}>Tap to renew period</Text>
            </View>

            <View style={styles.renewBadge}>
              <Text style={styles.renewBadgeText}>Renew</Text>
              <ChevronRight size={13} color={THEME.text.secondary} style={{ marginLeft: 2 }} />
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
    backgroundColor: THEME.bg.card,
    borderColor: THEME.bg.borderLight,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  iconContainer: {
    marginRight: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.bg.chip,
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
    fontWeight: '600',
    color: THEME.text.primary,
  },
  timeText: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '400',
  },
  subtext: {
    color: THEME.text.tertiary,
    fontSize: 11,
    marginTop: 1,
  },
  renewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.chip,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  renewBadgeText: {
    color: THEME.text.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
