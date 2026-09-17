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
import { X, Calendar, Check, Plus, Trash2 } from 'lucide-react-native';
import { IncomeRecord, IncomeType } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (typeId: string, amount: number, date: string, id?: string) => void;
  onDelete?: (id: string) => void;
  incomeTypes: IncomeType[];
  onAddNewType: (name: string) => IncomeType;
  initialRecord?: IncomeRecord | null;
  defaultDate?: string;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  incomeTypes,
  onAddNewType,
  initialRecord,
  defaultDate,
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate || getTodayString());
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // New category creation inline
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => {
    if (initialRecord) {
      setSelectedTypeId(initialRecord.type_id);
      setDate(initialRecord.date);
      setAmount(Math.round(initialRecord.amount).toString());
    } else {
      setSelectedTypeId(incomeTypes.length > 0 ? incomeTypes[0].id : '');
      setDate(defaultDate || getTodayString());
      setAmount('');
    }
    setIsCreatingType(false);
    setNewTypeName('');
    setError(null);
  }, [initialRecord, defaultDate, visible, incomeTypes]);

  const handleCreateType = () => {
    if (!newTypeName.trim()) return;
    const created = onAddNewType(newTypeName.trim());
    setSelectedTypeId(created.id);
    setNewTypeName('');
    setIsCreatingType(false);
  };

  const handleSave = () => {
    const cleanAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!selectedTypeId) {
      setError('Please select or create an income type.');
      return;
    }
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    onSave(selectedTypeId, cleanAmount, date, initialRecord?.id);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{initialRecord ? 'Edit Income' : 'Add Income'}</Text>
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

            {/* Income Type Selector + Inline Creation */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Income Type</Text>
                <TouchableOpacity
                  style={styles.addTypeToggle}
                  onPress={() => setIsCreatingType(!isCreatingType)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#38BDF8" style={{ marginRight: 4 }} />
                  <Text style={styles.addTypeToggleText}>
                    {isCreatingType ? 'Cancel' : 'New Type'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isCreatingType ? (
                <View style={styles.newTypeRow}>
                  <TextInput
                    style={styles.newTypeInput}
                    placeholder="e.g. Freelance, Bonus"
                    placeholderTextColor="#475569"
                    value={newTypeName}
                    onChangeText={setNewTypeName}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.newTypeAddBtn}
                    onPress={handleCreateType}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.newTypeAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {incomeTypes.map((t) => {
                    const isSelected = selectedTypeId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                        onPress={() => setSelectedTypeId(t.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Amount Input with Dialpad */}
            <DialpadInput
              label="Amount"
              value={amount}
              onChangeValue={setAmount}
              prefix="Rs."
              placeholder="200,000"
              isCurrency
            />

            {/* Date Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.dateInputWrapper}>
                <Calendar size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.dateInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#475569"
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Check size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {initialRecord ? 'Update Income' : 'Save Income'}
                </Text>
              </TouchableOpacity>

              {initialRecord && onDelete && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                  <Trash2 size={18} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Delete Record</Text>
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
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  addTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTypeToggleText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  typeChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  typeChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  typeChipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  typeChipTextSelected: {
    color: '#FFFFFF',
  },
  newTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newTypeInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14,
  },
  newTypeAddBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTypeAddBtnText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  dateInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    marginTop: 20,
    gap: 10,
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
