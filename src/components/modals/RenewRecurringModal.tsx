import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Calendar, Check, Clock } from 'lucide-react-native';
import { RecurringExpense } from '../../types';
import { addDays, formatCurrency, getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';
import { THEME } from '../../theme/colors';
import { AnimatedPressable } from '../AnimatedComponents';
import { DatePickerField } from '../DatePickerField';

interface RenewRecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onRenew: (id: string, name: string, amount: number, startDate: string, endDate: string) => void;
  item: RecurringExpense | null;
}

export const RenewRecurringModal: React.FC<RenewRecurringModalProps> = ({
  visible,
  onClose,
  onRenew,
  item,
}) => {
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setAmount(Math.round(item.amount).toString());
      // Renew start date defaults to either today or the day after previous end_date
      const nextStart = addDays(item.end_date, 1);
      setStartDate(nextStart);
      setEndDate(addDays(nextStart, 29)); // +30 days
    }
    setError(null);
  }, [item, visible]);

  if (!item) return null;

  const handleQuickExtend = (days: number) => {
    if (startDate) {
      setEndDate(addDays(startDate, days - 1));
    }
  };

  const handleSave = () => {
    const cleanAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      setError('End date must be on or after the start date.');
      return;
    }

    onRenew(item.id, item.name, cleanAmount, startDate, endDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Clock size={16} color={THEME.text.secondary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Renew / Extend {item.name}</Text>
            </View>
            <AnimatedPressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={THEME.text.secondary} />
            </AnimatedPressable>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.subInfo}>
              Previous period ended on <Text style={styles.bold}>{item.end_date}</Text>. Extend period to clear expiration warning.
            </Text>

            {/* Quick Extension chips */}
            <View style={styles.quickRow}>
              <AnimatedPressable
                style={styles.quickChip}
                onPress={() => handleQuickExtend(30)}
              >
                <Text style={styles.quickChipText}>+ 1 Month (30d)</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.quickChip}
                onPress={() => handleQuickExtend(90)}
              >
                <Text style={styles.quickChipText}>+ 3 Months</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.quickChip}
                onPress={() => handleQuickExtend(365)}
              >
                <Text style={styles.quickChipText}>+ 1 Year</Text>
              </AnimatedPressable>
            </View>

            {/* Amount */}
            <DialpadInput
              label="Renewal Amount"
              value={amount}
              onChangeValue={setAmount}
              prefix="Rs."
              isCurrency
            />

            {/* Start Date */}
            <DatePickerField
              label="New Start Date"
              value={startDate}
              onChange={setStartDate}
            />

            {/* End Date */}
            <DatePickerField
              label="New End Date"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate}
            />

            {/* Actions */}
            <View style={styles.actions}>
              <AnimatedPressable style={styles.saveBtn} onPress={handleSave}>
                <Check size={18} color="#090D16" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Confirm Renewal</Text>
              </AnimatedPressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.bg.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: THEME.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    marginBottom: 16,
  },
  subInfo: {
    color: THEME.text.secondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: THEME.text.primary,
  },
  errorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: THEME.accent.expense,
    fontSize: 13,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickChip: {
    backgroundColor: THEME.bg.chip,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  quickChipText: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldContainer: {
    marginVertical: 6,
  },
  label: {
    color: THEME.text.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  dateInput: {
    flex: 1,
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    marginTop: 18,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.text.primary,
    paddingVertical: 13,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#090D16',
    fontSize: 15,
    fontWeight: '700',
  },
});
