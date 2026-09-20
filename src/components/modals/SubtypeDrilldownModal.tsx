import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { HorizontalBarItem } from '../../types';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { THEME } from '../../theme/colors';
import { AnimatedPressable } from '../AnimatedComponents';

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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{categoryName} Breakdown</Text>
              <Text style={styles.subtitle}>{monthName} Subtypes</Text>
            </View>
            <AnimatedPressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={THEME.text.secondary} />
            </AnimatedPressable>
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
    backgroundColor: THEME.bg.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
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
  subtitle: {
    color: THEME.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    marginBottom: 10,
  },
});
