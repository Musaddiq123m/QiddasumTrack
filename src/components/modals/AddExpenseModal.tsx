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
import { X, Calendar, Check, Plus, Trash2 } from 'lucide-react-native';
import { ExpenseRecord, ExpenseSubtype, ExpenseType } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';
import { ExpenseRepo } from '../../db/repositories/expenseRepo';
import { THEME } from '../../theme/colors';
import { AnimatedPressable } from '../AnimatedComponents';
import { DatePickerField } from '../DatePickerField';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (typeId: string, subtypeName: string | null, amount: number, date: string, id?: string) => void;
  onDelete?: (id: string) => void;
  expenseTypes: ExpenseType[];
  onAddNewType: (name: string) => ExpenseType;
  initialRecord?: ExpenseRecord | null;
  defaultDate?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  expenseTypes,
  onAddNewType,
  initialRecord,
  defaultDate,
}) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [subtypes, setSubtypes] = useState<ExpenseSubtype[]>([]);
  const [selectedSubtype, setSelectedSubtype] = useState<string>('');
  const [customSubtype, setCustomSubtype] = useState<string>('');
  const [isAddingNewSubtype, setIsAddingNewSubtype] = useState(false);

  const [date, setDate] = useState<string>(defaultDate || getTodayString());
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // New Category Type creation
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => {
    if (selectedTypeId) {
      const list = ExpenseRepo.getSubtypesForType(selectedTypeId);
      setSubtypes(list);
    } else {
      setSubtypes([]);
    }
  }, [selectedTypeId]);

  useEffect(() => {
    if (initialRecord) {
      setSelectedTypeId(initialRecord.expense_type_id);
      setSelectedSubtype(initialRecord.subtype_name || '');
      setCustomSubtype('');
      setIsAddingNewSubtype(false);
      setDate(initialRecord.date);
      setAmount(Math.round(initialRecord.amount).toString());
    } else {
      const defaultId = expenseTypes.length > 0 ? expenseTypes[0].id : '';
      setSelectedTypeId(defaultId);
      setSelectedSubtype('');
      setCustomSubtype('');
      setIsAddingNewSubtype(false);
      setDate(defaultDate || getTodayString());
      setAmount('');
    }
    setIsCreatingType(false);
    setNewTypeName('');
    setError(null);
  }, [initialRecord, defaultDate, visible, expenseTypes]);

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
      setError('Please select or create an expense category.');
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

    const finalSubtype = isAddingNewSubtype
      ? customSubtype.trim() || null
      : selectedSubtype.trim() || null;

    onSave(selectedTypeId, finalSubtype, cleanAmount, date, initialRecord?.id);
    onClose();
  };

  const handleDelete = () => {
    if (initialRecord && onDelete) {
      onDelete(initialRecord.id);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{initialRecord ? 'Edit Expense' : 'Add Expense'}</Text>
            <AnimatedPressable onPress={onClose} style={styles.closeBtn} scaleTo={0.9}>
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

            {/* Date Input */}
            <DatePickerField
              label="Date"
              value={date}
              onChange={setDate}
            />

            {/* Category Selector */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Category</Text>
                <AnimatedPressable
                  style={styles.addTypeToggle}
                  onPress={() => setIsCreatingType(!isCreatingType)}
                  scaleTo={0.94}
                >
                  <Plus size={13} color={THEME.text.secondary} style={{ marginRight: 3 }} />
                  <Text style={styles.addTypeToggleText}>
                    {isCreatingType ? 'Cancel' : 'New'}
                  </Text>
                </AnimatedPressable>
              </View>

              {isCreatingType ? (
                <View style={styles.newTypeRow}>
                  <TextInput
                    style={styles.newTypeInput}
                    placeholder="e.g. Health, Education"
                    placeholderTextColor="#475569"
                    value={newTypeName}
                    onChangeText={setNewTypeName}
                    autoFocus
                  />
                  <AnimatedPressable
                    style={styles.newTypeAddBtn}
                    onPress={handleCreateType}
                    scaleTo={0.92}
                  >
                    <Text style={styles.newTypeAddBtnText}>Add</Text>
                  </AnimatedPressable>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {expenseTypes.map((t) => {
                    const isSelected = selectedTypeId === t.id;
                    return (
                      <AnimatedPressable
                        key={t.id}
                        style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                        onPress={() => setSelectedTypeId(t.id)}
                        scaleTo={0.94}
                      >
                        <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                          {t.name}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Subtypes: Ordered by frequency */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Subtype (Optional)</Text>
                <AnimatedPressable
                  style={styles.addTypeToggle}
                  onPress={() => {
                    setIsAddingNewSubtype(!isAddingNewSubtype);
                    if (!isAddingNewSubtype) {
                      setSelectedSubtype('');
                    }
                  }}
                  scaleTo={0.94}
                >
                  <Plus size={13} color={THEME.text.secondary} style={{ marginRight: 3 }} />
                  <Text style={styles.addTypeToggleText}>
                    {isAddingNewSubtype ? 'Pick Existing' : 'New Subtype'}
                  </Text>
                </AnimatedPressable>
              </View>

              {isAddingNewSubtype ? (
                <TextInput
                  style={styles.customSubtypeInput}
                  placeholder="Type new subtype (e.g. Shawarma, Pizza)"
                  placeholderTextColor="#475569"
                  value={customSubtype}
                  onChangeText={setCustomSubtype}
                  autoFocus
                />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {/* None option */}
                  <AnimatedPressable
                    style={[styles.subtypeChip, !selectedSubtype && styles.subtypeChipSelected]}
                    onPress={() => setSelectedSubtype('')}
                    scaleTo={0.94}
                  >
                    <Text style={[styles.subtypeChipText, !selectedSubtype && styles.subtypeChipTextSelected]}>
                      None
                    </Text>
                  </AnimatedPressable>

                  {subtypes.map((st) => {
                    const isSelected = selectedSubtype === st.name;
                    return (
                      <AnimatedPressable
                        key={st.id}
                        style={[styles.subtypeChip, isSelected && styles.subtypeChipSelected]}
                        onPress={() => setSelectedSubtype(st.name)}
                        scaleTo={0.94}
                      >
                        <Text style={[styles.subtypeChipText, isSelected && styles.subtypeChipTextSelected]}>
                          {st.name}
                          {st.usage_count > 1 && (
                            <Text style={styles.usageCountText}> ({st.usage_count})</Text>
                          )}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Amount with Dialpad */}
            <DialpadInput
              label="Amount"
              value={amount}
              onChangeValue={setAmount}
              prefix="Rs."
              placeholder="450"
              isCurrency
            />

            {/* Actions */}
            <View style={styles.actions}>
              <AnimatedPressable style={styles.saveBtn} onPress={handleSave} scaleTo={0.97}>
                <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {initialRecord ? 'Update Expense' : 'Save Expense'}
                </Text>
              </AnimatedPressable>

              {initialRecord && onDelete && (
                <AnimatedPressable style={styles.deleteBtn} onPress={handleDelete} scaleTo={0.97}>
                  <Trash2 size={16} color={THEME.accent.expense} style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>Delete Record</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.bg.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    padding: 4,
  },
  body: {
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: THEME.accent.expense,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 13,
  },
  fieldContainer: {
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: THEME.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  addTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTypeToggleText: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  typeChip: {
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  typeChipSelected: {
    backgroundColor: THEME.bg.chipActive,
    borderColor: THEME.text.secondary,
  },
  typeChipText: {
    color: THEME.text.tertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  typeChipTextSelected: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
  subtypeChip: {
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  subtypeChipSelected: {
    backgroundColor: THEME.bg.chipActive,
    borderColor: THEME.accent.blue,
  },
  subtypeChipText: {
    color: THEME.text.tertiary,
    fontSize: 12.5,
    fontWeight: '500',
  },
  subtypeChipTextSelected: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
  usageCountText: {
    color: THEME.text.tertiary,
    fontSize: 11,
  },
  customSubtypeInput: {
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: THEME.text.primary,
    fontSize: 13.5,
  },
  newTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newTypeInput: {
    flex: 1,
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.borderLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    color: THEME.text.primary,
    fontSize: 13.5,
  },
  newTypeAddBtn: {
    backgroundColor: THEME.text.primary,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTypeAddBtnText: {
    color: '#090D16',
    fontWeight: '600',
    fontSize: 13,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dateInput: {
    flex: 1,
    color: THEME.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent.expense,
    paddingVertical: 13,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  deleteBtnText: {
    color: THEME.accent.expense,
    fontSize: 14,
    fontWeight: '600',
  },
});
