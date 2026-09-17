import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { X, Calendar, Check, Trash2 } from 'lucide-react-native';
import { WalkingRecord } from '../../types';
import { getTodayString } from '../../utils/dateUtils';
import { DialpadInput } from '../DialpadInput';

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {initialRecord ? 'Edit Walking Record' : 'Add Walking Record'}
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
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Check size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>
                  {initialRecord ? 'Update Record' : 'Save Record'}
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
