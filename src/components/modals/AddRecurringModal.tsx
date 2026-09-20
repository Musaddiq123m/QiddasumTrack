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
import { X, Calendar, Check, Trash2, Clock } from 'lucide-react-native';
import { RecurringExpense } from '../../types';
import { addDays, formatCurrency, getDaysDifference, getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';
import { THEME } from '../../theme/colors';
import { AnimatedPressable } from '../AnimatedComponents';
import { DatePickerField } from '../DatePickerField';

interface AddRecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, amount: number, startDate: string, endDate: string, id?: string) => void;
  onDelete?: (id: string) => void;
  initialRecord?: RecurringExpense | null;
}

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  initialRecord,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRecord) {
      setName(initialRecord.name);
      setAmount(Math.round(initialRecord.amount).toString());
      setStartDate(initialRecord.start_date);
      setEndDate(initialRecord.end_date);
    } else {
      const today = getTodayString();
      setName('');
      setAmount('');
      setStartDate(today);
      setEndDate(addDays(today, 29)); // default 30 days
    }
    setError(null);
  }, [initialRecord, visible]);

  // Compute live daily cost
  const cleanAmount = Number(amount.replace(/[^0-9]/g, ''));
  const daysDiff =
    startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
      ? getDaysDifference(startDate, endDate)
      : 0;

  const dailyCost = daysDiff > 0 && cleanAmount > 0 ? (cleanAmount / daysDiff).toFixed(2) : '0';

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter an expense name (e.g. Rent, Gym).');
      return;
    }
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!startDate || !endDate || daysDiff <= 0) {
      setError('End date must be on or after the start date.');
      return;
    }

    onSave(name.trim(), cleanAmount, startDate, endDate, initialRecord?.id);
    onClose();
  };

  const handleDelete = () => {
    if (initialRecord && onDelete) {
      onDelete(initialRecord.id);
      onClose();
    }
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
            <Text style={styles.title}>
              {initialRecord ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
            </Text>
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

            {/* Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rent, Gym, Electricity, Internet"
                placeholderTextColor={THEME.text.tertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Total Amount */}
            <DialpadInput
              label="Total Amount"
              value={amount}
              onChangeValue={setAmount}
              prefix="Rs."
              placeholder="30,000"
              isCurrency
            />

            {/* Dates */}
            <View style={styles.datesRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <DatePickerField
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <DatePickerField
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate}
                />
              </View>
            </View>

            {/* Daily Allocation Preview Card */}
            {daysDiff > 0 && cleanAmount > 0 && (
              <View style={styles.allocationCard}>
                <View style={styles.cardHeader}>
                  <Clock size={15} color={THEME.text.secondary} style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Daily Allocation</Text>
                </View>
                <Text style={styles.allocationValue}>
                  Rs. {dailyCost} / day
                </Text>
                <Text style={styles.allocationSub}>
                  {formatCurrency(cleanAmount)} allocated across {daysDiff} days ({startDate} to {endDate})
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <AnimatedPressable style={styles.saveBtn} onPress={handleSave}>
                <Check size={18} color="#090D16" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {initialRecord ? 'Update Recurring' : 'Save Recurring'}
                </Text>
              </AnimatedPressable>

              {initialRecord && onDelete && (
                <AnimatedPressable style={styles.deleteBtn} onPress={handleDelete}>
                  <Trash2 size={16} color={THEME.accent.expense} style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </AnimatedPressable>
              )}
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
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
  fieldContainer: {
    marginVertical: 6,
  },
  label: {
    color: THEME.text.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: THEME.text.primary,
    fontSize: 15,
  },
  datesRow: {
    flexDirection: 'row',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 48,
  },
  dateInput: {
    flex: 1,
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  allocationCard: {
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: THEME.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  allocationValue: {
    color: THEME.text.primary,
    fontSize: 19,
    fontWeight: '700',
  },
  allocationSub: {
    color: THEME.text.tertiary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    marginTop: 16,
    gap: 10,
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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  deleteBtnText: {
    color: THEME.accent.expense,
    fontSize: 14,
    fontWeight: '600',
  },
});
