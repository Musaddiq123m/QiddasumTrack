import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X, Check } from 'lucide-react-native';
import { THEME } from '../theme/colors';
import { AnimatedPressable } from './AnimatedComponents';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getTodayString,
  getYesterdayString,
  padZero,
  formatDisplayDate,
} from '../utils/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface DatePickerModalProps {
  visible: boolean;
  value: string; // 'YYYY-MM-DD'
  onSelect: (date: string) => void;
  onClose: () => void;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  value,
  onSelect,
  onClose,
  title = 'Select Date',
  minDate,
  maxDate,
}) => {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  const [selectedDate, setSelectedDate] = useState<string>(value || today);
  const [viewYear, setViewYear] = useState<number>(() => {
    const initial = value || today;
    const [y] = initial.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const initial = value || today;
    const [, m] = initial.split('-').map(Number);
    return m || new Date().getMonth() + 1;
  });

  // Keep local selection in sync whenever modal opens or value changes
  useEffect(() => {
    if (visible) {
      const activeDate = value || today;
      setSelectedDate(activeDate);
      const [y, m] = activeDate.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [visible, value]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleQuickPick = (dateStr: string) => {
    setSelectedDate(dateStr);
    const [y, m] = dateStr.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  // Calculate calendar days
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  // Convert Sun=0..Sat=6 to Mon=0..Sun=6
  const firstDayIndex = (getFirstDayOfMonth(viewYear, viewMonth) + 6) % 7;

  const slots: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    slots.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    slots.push(d);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          {/* Top Bar: Title & Close */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Calendar size={18} color={THEME.accent.blue} style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <AnimatedPressable onPress={onClose} style={styles.closeBtn} scaleTo={0.9}>
              <X size={18} color={THEME.text.secondary} />
            </AnimatedPressable>
          </View>

          {/* Quick Shortcuts */}
          <View style={styles.quickBar}>
            <AnimatedPressable
              style={[
                styles.quickChip,
                selectedDate === today && styles.quickChipActive,
              ]}
              onPress={() => handleQuickPick(today)}
              scaleTo={0.95}
            >
              <Text
                style={[
                  styles.quickChipText,
                  selectedDate === today && styles.quickChipTextActive,
                ]}
              >
                Today
              </Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[
                styles.quickChip,
                selectedDate === yesterday && styles.quickChipActive,
              ]}
              onPress={() => handleQuickPick(yesterday)}
              scaleTo={0.95}
            >
              <Text
                style={[
                  styles.quickChipText,
                  selectedDate === yesterday && styles.quickChipTextActive,
                ]}
              >
                Yesterday
              </Text>
            </AnimatedPressable>
          </View>

          {/* Month / Year Navigation */}
          <View style={styles.monthNav}>
            <AnimatedPressable
              style={styles.navArrow}
              onPress={handlePrevMonth}
              scaleTo={0.9}
            >
              <ChevronLeft size={18} color={THEME.text.primary} />
            </AnimatedPressable>

            <Text style={styles.monthYearText}>
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </Text>

            <AnimatedPressable
              style={styles.navArrow}
              onPress={handleNextMonth}
              scaleTo={0.9}
            >
              <ChevronRight size={18} color={THEME.text.primary} />
            </AnimatedPressable>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekHeader}>
            {DAY_HEADERS.map((dayName) => (
              <View key={dayName} style={styles.weekCol}>
                <Text style={styles.weekText}>{dayName}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {slots.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.daySlot} />;
              }

              const dateStr = `${viewYear}-${padZero(viewMonth)}-${padZero(day)}`;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === today;
              const isBeforeMin = minDate ? dateStr < minDate : false;
              const isAfterMax = maxDate ? dateStr > maxDate : false;
              const isDisabled = isBeforeMin || isAfterMax;

              return (
                <AnimatedPressable
                  key={`day-${day}`}
                  style={styles.daySlot}
                  disabled={isDisabled}
                  onPress={() => setSelectedDate(dateStr)}
                  scaleTo={0.92}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isToday && !isSelected && styles.dayToday,
                      isSelected && styles.daySelected,
                      isDisabled && styles.dayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday && !isSelected && styles.dayNumberToday,
                        isSelected && styles.dayNumberSelected,
                        isDisabled && styles.dayNumberDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Footer with Selected Preview & Confirm */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerInfoLabel}>Selected</Text>
              <Text style={styles.footerInfoValue}>
                {selectedDate} ({formatDisplayDate(selectedDate)})
              </Text>
            </View>

            <View style={styles.footerActions}>
              <AnimatedPressable
                style={styles.cancelBtn}
                onPress={onClose}
                scaleTo={0.96}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.confirmBtn}
                onPress={handleConfirm}
                scaleTo={0.96}
              >
                <Check size={16} color="#090D16" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export interface DatePickerFieldProps {
  label?: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  minDate,
  maxDate,
  error,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const displayString = value
    ? `${value} (${formatDisplayDate(value)})`
    : placeholder;

  return (
    <View style={styles.fieldContainer}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}

      <AnimatedPressable
        style={[styles.inputWrapper, !!error && styles.inputWrapperError]}
        onPress={() => setModalOpen(true)}
        scaleTo={0.98}
      >
        <Calendar size={16} color={THEME.text.tertiary} style={{ marginRight: 8 }} />
        <Text
          style={[styles.inputText, !value && styles.placeholderText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayString}
        </Text>
        <ChevronDown size={14} color={THEME.text.tertiary} style={{ marginLeft: 'auto' }} />
      </AnimatedPressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <DatePickerModal
        visible={modalOpen}
        value={value}
        onSelect={onChange}
        onClose={() => setModalOpen(false)}
        title={label ? `Select ${label}` : 'Select Date'}
        minDate={minDate}
        maxDate={maxDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginVertical: 6,
  },
  fieldLabel: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 12,
    height: 46,
  },
  inputWrapperError: {
    borderColor: THEME.accent.expense,
  },
  inputText: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: THEME.text.tertiary,
  },
  errorText: {
    color: THEME.accent.expense,
    fontSize: 11,
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: THEME.bg.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  quickBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  quickChipActive: {
    backgroundColor: THEME.bg.chipActive,
    borderColor: THEME.accent.blue,
  },
  quickChipText: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: THEME.text.primary,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  navArrow: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  monthYearText: {
    color: THEME.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
  },
  weekCol: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekText: {
    color: THEME.text.tertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 6,
  },
  daySlot: {
    width: '14.2857%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1,
    borderColor: THEME.text.secondary,
  },
  daySelected: {
    backgroundColor: THEME.bg.chipActive,
    borderWidth: 1,
    borderColor: THEME.accent.blue,
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayNumber: {
    color: THEME.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  dayNumberToday: {
    color: THEME.text.primary,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: THEME.text.primary,
    fontWeight: '700',
  },
  dayNumberDisabled: {
    color: THEME.text.tertiary,
  },
  footer: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.bg.border,
  },
  footerInfo: {
    marginBottom: 10,
  },
  footerInfoLabel: {
    color: THEME.text.tertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerInfoValue: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: THEME.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: THEME.accent.primary,
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#090D16',
    fontSize: 13,
    fontWeight: '700',
  },
});
