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
import { X, Calendar, Check, Trash2 } from 'lucide-react-native';
import { WalkingRecord } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';
import { THEME } from '../../theme/colors';
import { AnimatedPressable } from '../AnimatedComponents';
import { DatePickerField } from '../DatePickerField';

interface AddWalkingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (steps: number, distanceKm: number, speedKmh: number, date: string, id?: string) => void;
  onDelete?: (id: string) => void;
  initialRecord?: WalkingRecord | null;
  defaultDate?: string;
}

export const AddWalkingModal: React.FC<AddWalkingModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  initialRecord,
  defaultDate,
}) => {
  const [date, setDate] = useState<string>(defaultDate || getTodayString());
  const [steps, setSteps] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [speedKmh, setSpeedKmh] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRecord) {
      setDate(initialRecord.date);
      setSteps(initialRecord.steps.toString());
      setDistanceKm(initialRecord.distance_km.toString());
      setSpeedKmh(initialRecord.speed_kmh.toString());
    } else {
      setDate(defaultDate || getTodayString());
      setSteps('');
      setDistanceKm('');
      setSpeedKmh('');
    }
    setError(null);
  }, [initialRecord, defaultDate, visible]);

  const handleSave = () => {
    const stepsNum = Number(steps.replace(/[^0-9]/g, ''));
    const distNum = parseFloat(distanceKm);
    const speedNum = parseFloat(speedKmh);

    if (isNaN(stepsNum) || stepsNum < 0) {
      setError('Steps must be a positive number or zero.');
      return;
    }
    if (isNaN(distNum) || distNum < 0) {
      setError('Distance must be a positive number or zero.');
      return;
    }
    if (isNaN(speedNum) || speedNum < 0) {
      setError('Speed must be a positive number or zero.');
      return;
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Please provide a valid date in YYYY-MM-DD format.');
      return;
    }

    onSave(stepsNum, distNum, speedNum, date, initialRecord?.id);
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
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialRecord ? 'Edit Walking Record' : 'Add Walking Record'}
            </Text>
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

            {/* Steps Input */}
            <DialpadInput
              label="Steps"
              value={steps}
              onChangeValue={setSteps}
              placeholder="e.g. 8421"
              suffix="steps"
            />

            {/* Distance Input */}
            <DialpadInput
              label="Distance"
              value={distanceKm}
              onChangeValue={setDistanceKm}
              placeholder="e.g. 5.8"
              suffix="km"
            />

            {/* Speed Input */}
            <DialpadInput
              label="Speed"
              value={speedKmh}
              onChangeValue={setSpeedKmh}
              placeholder="e.g. 5.2"
              suffix="km/h"
            />

            {/* Actions */}
            <View style={styles.actions}>
              <AnimatedPressable style={styles.saveBtn} onPress={handleSave} scaleTo={0.97}>
                <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {initialRecord ? 'Update Record' : 'Save Record'}
                </Text>
              </AnimatedPressable>

              {initialRecord && onDelete && (
                <AnimatedPressable style={styles.deleteBtn} onPress={handleDelete} scaleTo={0.97}>
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
    backgroundColor: THEME.accent.blue,
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
