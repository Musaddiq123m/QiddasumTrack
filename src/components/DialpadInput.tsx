import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Delete } from 'lucide-react-native';

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
  // Format display text with comma separators if currency/integer
  const getFormattedValue = (text: string) => {
    if (!text) return '';
    if (isCurrency) {
      // Clean non-digits
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
      // allow numbers and one decimal point for km or km/h
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
          selectTextOnFocus
          autoFocus={false}
        />

        {suffix && <Text style={styles.suffix}>{suffix}</Text>}

        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
            <Delete size={18} color="#94A3B8" />
          </TouchableOpacity>
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
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
  },
  prefix: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    padding: 0,
  },
  suffix: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  clearBtn: {
    padding: 6,
  },
});
