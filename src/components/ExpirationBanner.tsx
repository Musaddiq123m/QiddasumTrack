import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { RecurringExpense } from '../types';

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
            : `is expiring in ${daysRemaining} days`;

        return (
          <TouchableOpacity
            key={expense.id}
            style={styles.banner}
            onPress={() => onRenewPress(expense)}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <AlertTriangle size={18} color="#F59E0B" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>
                ⚠ <Text style={styles.bold}>{expense.name}</Text> {timeText}
              </Text>
              <Text style={styles.subtext}>Tap to renew or extend period</Text>
            </View>

            <ChevronRight size={18} color="#F59E0B" />
          </TouchableOpacity>
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
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FEF3C7',
    fontSize: 13,
    fontWeight: '600',
  },
  bold: {
    fontWeight: 'bold',
    color: '#FDE68A',
  },
  subtext: {
    color: '#FCD34D',
    fontSize: 11,
    marginTop: 2,
  },
});
