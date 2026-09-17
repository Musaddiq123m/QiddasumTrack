import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { HorizontalBarItem } from '../../types';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';

interface SubtypeDrilldownModalProps {
  visible: boolean;
  onClose: () => void;
  categoryName: string;
  monthName: string;
  items: HorizontalBarItem[];
  total: number;
}

export const SubtypeDrilldownModal: React.FC<SubtypeDrilldownModalProps> = ({
  visible,
  onClose,
  categoryName,
  monthName,
  items,
  total,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{categoryName} Breakdown</Text>
              <Text style={styles.subtitle}>{monthName} Subtypes</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <HorizontalBarChart
              items={items}
              total={total}
              emptyMessage={`No subtypes entered for ${categoryName} this month.`}
            />
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
    maxHeight: '80%',
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
  subtitle: {
    color: '#38BDF8',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginBottom: 10,
  },
});
