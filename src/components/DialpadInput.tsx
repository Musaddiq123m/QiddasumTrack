import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Delete } from 'lucide-react-native';
import { THEME } from '../theme/colors';

interface DialpadInputProps {
  value: string;
  onChangeValue: (rawText: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  isCurrency?: boolean;
  label?: string;
}

export const DialpadInput: React.FC<DialpadInputProps> = ({
  value,
  onChangeValue,
  prefix,
  suffix,
  placeholder = '0',
  isCurrency = false,
  label,
}) => {
  const getFormattedValue = (text: string) => {
    if (!text) return '';
    if (isCurrency) {
      const digits = text.replace(/[^0-9]/g, '');
      if (!digits) return '';
      return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return text;
  };

  const handleTextChange = (newText: string) => {
    if (isCurrency) {
      const cleanDigits = newText.replace(/[^0-9]/g, '');
      onChangeValue(cleanDigits);
    } else {
      const sanitized = newText.replace(/[^0-9.]/g, '');
      onChangeValue(sanitized);
    }
  };

  const handleClear = () => {
    onChangeValue('');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={getFormattedValue(value)}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          autoFocus={false}
        />

        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
            <Delete size={16} color={THEME.text.secondary} />
          </TouchableOpacity>
        )}

        {suffix && (
          <View style={styles.suffixBadge}>
            <Text style={styles.suffixText}>{suffix}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    color: THEME.text.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 10,
    height: 52,
  },
  prefix: {
    color: THEME.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: THEME.text.primary,
    fontSize: 18,
    fontWeight: '600',
    padding: 0,
    minWidth: 40,
  },
  clearBtn: {
    padding: 6,
    marginRight: 4,
  },
  suffixBadge: {
    backgroundColor: THEME.bg.card,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  suffixText: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
