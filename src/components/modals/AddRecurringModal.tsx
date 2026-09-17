import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { X, Calendar, Check, Trash2, Clock } from 'lucide-react-native';
import { RecurringExpense } from '../../types';
import { addDays, formatCurrency, getDaysDifference, getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialRecord ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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
                placeholderTextColor="#475569"
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
              <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Start Date</Text>
                <View style={styles.dateInputWrapper}>
                  <Calendar size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.dateInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#475569"
                  />
                </View>
              </View>

              <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>End Date</Text>
                <View style={styles.dateInputWrapper}>
                  <Calendar size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.dateInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#475569"
                  />
                </View>
              </View>
            </View>

            {/* Daily Allocation Preview Card */}
            {daysDiff > 0 && cleanAmount > 0 && (
              <View style={styles.allocationCard}>
                <View style={styles.cardHeader}>
                  <Clock size={16} color="#38BDF8" style={{ marginRight: 6 }} />
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
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Check size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {initialRecord ? 'Update Recurring' : 'Save Recurring'}
                </Text>
              </TouchableOpacity>

              {initialRecord && onDelete && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                  <Trash2 size={18} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
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
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  fieldContainer: {
    marginVertical: 6,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    color: '#F8FAFC',
    fontSize: 16,
  },
  datesRow: {
    flexDirection: 'row',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 50,
  },
  dateInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  allocationCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
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
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  allocationValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  allocationSub: {
    color: '#94A3B8',
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
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
