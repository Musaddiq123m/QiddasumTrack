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
import { X, Calendar, Check, AlertTriangle } from 'lucide-react-native';
import { RecurringExpense } from '../../types';
import { addDays, formatCurrency, getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <AlertTriangle size={20} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Renew / Extend {item.name}</Text>
            </View>
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

            <Text style={styles.subInfo}>
              Previous period ended on <Text style={styles.bold}>{item.end_date}</Text>. Extend period to clear expiration warning.
            </Text>

            {/* Quick Extension chips */}
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => handleQuickExtend(30)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>+ 1 Month (30d)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => handleQuickExtend(90)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>+ 3 Months</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => handleQuickExtend(365)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>+ 1 Year</Text>
              </TouchableOpacity>
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
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>New Start Date</Text>
              <View style={styles.dateInputWrapper}>
                <Calendar size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#475569"
                />
              </View>
            </View>

            {/* End Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>New End Date</Text>
              <View style={styles.dateInputWrapper}>
                <Calendar size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#475569"
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Check size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Confirm Renewal</Text>
              </TouchableOpacity>
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
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginBottom: 16,
  },
  subInfo: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
    color: '#F8FAFC',
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
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  quickChipText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
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
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  dateInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    marginTop: 18,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
