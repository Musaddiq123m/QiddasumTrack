import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform as RNPlatform,
  Image,
} from 'react-native';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  ShieldCheck,
  Smartphone,
  Layers,
  Repeat,
} from 'lucide-react-native';
import * as XLSX from 'xlsx';
import { ExpenseType, IncomeType, RecurringExpense } from '../types';
import { IncomeRepo } from '../db/repositories/incomeRepo';
import { ExpenseRepo } from '../db/repositories/expenseRepo';
import { RecurringRepo } from '../db/repositories/recurringRepo';
import { BackupRepo } from '../db/repositories/backupRepo';
import { AddRecurringModal } from '../components/modals/AddRecurringModal';
import { formatCurrency } from '../utils/dateUtils';
import { THEME } from '../theme/colors';
import { AnimatedPressable } from '../components/AnimatedComponents';

export const SettingsScreen: React.FC = () => {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  // Add category state
  const [newIncomeType, setNewIncomeType] = useState('');
  const [newExpenseType, setNewExpenseType] = useState('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Recurring modal
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);

  const loadData = useCallback(() => {
    setIncomeTypes(IncomeRepo.getTypes());
    setExpenseTypes(ExpenseRepo.getTypes());
    setRecurringExpenses(RecurringRepo.getAll());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Income Category handlers
  const handleAddIncomeType = () => {
    if (!newIncomeType.trim()) return;
    IncomeRepo.addType(newIncomeType.trim());
    setNewIncomeType('');
    loadData();
    showStatus('Income type added.');
  };

  const handleDeleteIncomeType = (id: string, name: string) => {
    IncomeRepo.deleteType(id);
    loadData();
    showStatus(`Removed income type: ${name}`);
  };

  // Expense Category handlers
  const handleAddExpenseType = () => {
    if (!newExpenseType.trim()) return;
    ExpenseRepo.addType(newExpenseType.trim());
    setNewExpenseType('');
    loadData();
    showStatus('Expense category added.');
  };

  const handleDeleteExpenseType = (id: string, name: string) => {
    ExpenseRepo.deleteType(id);
    loadData();
    showStatus(`Removed category: ${name}`);
  };

  // Recurring handlers
  const handleSaveRecurring = (name: string, amount: number, startDate: string, endDate: string, id?: string) => {
    if (id) {
      RecurringRepo.update(id, name, amount, startDate, endDate);
      showStatus('Recurring expense updated.');
    } else {
      RecurringRepo.add(name, amount, startDate, endDate);
      showStatus('Recurring expense added.');
    }
    loadData();
  };

  const handleDeleteRecurring = (id: string) => {
    RecurringRepo.delete(id);
    loadData();
    showStatus('Recurring expense removed.');
  };

  // Excel Export
  const handleExportExcel = async () => {
    try {
      const result = await BackupRepo.exportToExcel();
      if (result.success) {
        showStatus('Data exported to Excel (.xlsx).');
      } else {
        showStatus(result.error || 'Failed to export data', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error exporting to Excel', 'error');
    }
  };

  // Excel Import
  const handleImportExcel = async () => {
    try {
      if (RNPlatform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async (evt: any) => {
            try {
              const data = new Uint8Array(evt.target.result);
              const wb = XLSX.read(data, { type: 'array' });
              const result = await BackupRepo.importFromWorkbook(wb);
              if (result.success) {
                loadData();
                showStatus(`Imported ${result.count} records successfully.`);
              } else {
                showStatus(result.error || 'Failed to import backup', 'error');
              }
            } catch (readErr: any) {
              showStatus(readErr.message || 'Error reading Excel file', 'error');
            }
          };
          reader.readAsArrayBuffer(file);
        };
        input.click();
      } else {
        const DocumentPicker = require('expo-document-picker');

        const docRes = await DocumentPicker.getDocumentAsync({
          type: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'text/comma-separated-values',
            '*/*',
          ],
          copyToCacheDirectory: true,
        });

        if (docRes.canceled || !docRes.assets || docRes.assets.length === 0) return;

        const asset = docRes.assets[0];

        // Safe reading for Expo SDK 52+ on Android / iOS
        let base64 = '';
        try {
          const FileSystemLegacy = require('expo-file-system/legacy');
          if (FileSystemLegacy && FileSystemLegacy.readAsStringAsync) {
            base64 = await FileSystemLegacy.readAsStringAsync(asset.uri, {
              encoding: FileSystemLegacy.EncodingType?.Base64 || 'base64',
            });
          }
        } catch (e1) {
          // fallback
        }

        if (!base64) {
          try {
            const { File } = require('expo-file-system');
            if (File) {
              const fileObj = new File(asset.uri);
              base64 = await fileObj.base64();
            }
          } catch (e2) {
            // fallback
          }
        }

        if (!base64) {
          const FileSystem = require('expo-file-system');
          base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
          });
        }

        const wb = XLSX.read(base64, { type: 'base64' });
        const result = await BackupRepo.importFromWorkbook(wb);

        if (result.success) {
          loadData();
          showStatus(`Imported ${result.count} records successfully.`);
        } else {
          showStatus(result.error || 'Failed to import backup', 'error');
        }
      }
    } catch (err: any) {
      showStatus(err.message || 'Error importing file', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Notification Banner */}
        {statusMessage && (
          <View
            style={[
              styles.statusBanner,
              statusMessage.type === 'error' ? styles.statusError : styles.statusSuccess,
            ]}
          >
            <Text style={styles.statusText}>{statusMessage.text}</Text>
          </View>
        )}

        {/* Section: Data Management (Excel Export / Import) */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <FileSpreadsheet size={18} color={THEME.text.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Data Backup & Restore</Text>
          </View>
          <Text style={styles.cardSub}>
            Export your entire walking and financial history to an Excel file (.xlsx) or restore from an existing backup.
          </Text>

          <View style={styles.backupActions}>
            <AnimatedPressable style={styles.exportBtn} onPress={handleExportExcel} scaleTo={0.97}>
              <Download size={16} color="#090D16" style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Export to Excel (.xlsx)</Text>
            </AnimatedPressable>

            <AnimatedPressable style={styles.importBtn} onPress={handleImportExcel} scaleTo={0.97}>
              <Upload size={16} color={THEME.text.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: THEME.text.primary }]}>Import / Restore Data</Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Section: Recurring Expenses Management */}
        <View style={styles.card}>
          <View style={styles.headerWithAction}>
            <View style={styles.titleRow}>
              <Repeat size={18} color={THEME.text.secondary} style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Recurring Expenses</Text>
            </View>
            <AnimatedPressable
              style={styles.addSmallBtn}
              onPress={() => {
                setEditingRecurring(null);
                setIsRecurringModalOpen(true);
              }}
              scaleTo={0.92}
            >
              <Plus size={12} color={THEME.text.primary} style={{ marginRight: 4 }} />
              <Text style={styles.addSmallBtnText}>Add</Text>
            </AnimatedPressable>
          </View>
          <Text style={styles.cardSub}>
            Costs like rent and electricity distributed across their active period.
          </Text>

          {recurringExpenses.length === 0 ? (
            <Text style={styles.emptyText}>No recurring expenses configured.</Text>
          ) : (
            recurringExpenses.map((rec) => (
              <AnimatedPressable
                key={rec.id}
                style={styles.recurringItem}
                onPress={() => {
                  setEditingRecurring(rec);
                  setIsRecurringModalOpen(true);
                }}
                scaleTo={0.98}
              >
                <View style={styles.recurringLeft}>
                  <Text style={styles.recurringName}>{rec.name}</Text>
                  <Text style={styles.recurringDates}>
                    {rec.start_date} → {rec.end_date}
                  </Text>
                </View>
                <View style={styles.recurringRight}>
                  <Text style={styles.recurringAmount}>{formatCurrency(rec.amount)}</Text>
                  <Text style={styles.recurringRate}>~{formatCurrency(rec.daily_cost || 0)}/day</Text>
                </View>
              </AnimatedPressable>
            ))
          )}
        </View>

        {/* Section: Income Types */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Layers size={18} color={THEME.text.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Income Types</Text>
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.textInput}
              placeholder="New income type (e.g. Freelance)"
              placeholderTextColor="#475569"
              value={newIncomeType}
              onChangeText={setNewIncomeType}
            />
            <AnimatedPressable style={styles.addBtn} onPress={handleAddIncomeType} scaleTo={0.9}>
              <Plus size={16} color="#090D16" />
            </AnimatedPressable>
          </View>

          <View style={styles.chipGrid}>
            {incomeTypes.map((t) => (
              <View key={t.id} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{t.name}</Text>
                <AnimatedPressable
                  onPress={() => handleDeleteIncomeType(t.id, t.name)}
                  style={styles.deleteBadgeBtn}
                  scaleTo={0.88}
                >
                  <Trash2 size={11} color={THEME.text.tertiary} />
                </AnimatedPressable>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Expense Categories */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Layers size={18} color={THEME.text.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Expense Categories</Text>
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.textInput}
              placeholder="New expense category"
              placeholderTextColor="#475569"
              value={newExpenseType}
              onChangeText={setNewExpenseType}
            />
            <AnimatedPressable style={styles.addBtn} onPress={handleAddExpenseType} scaleTo={0.9}>
              <Plus size={16} color="#090D16" />
            </AnimatedPressable>
          </View>

          <View style={styles.chipGrid}>
            {expenseTypes.map((t) => (
              <View key={t.id} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{t.name}</Text>
                <AnimatedPressable
                  onPress={() => handleDeleteExpenseType(t.id, t.name)}
                  style={styles.deleteBadgeBtn}
                  scaleTo={0.88}
                >
                  <Trash2 size={11} color={THEME.text.tertiary} />
                </AnimatedPressable>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Device & Privacy Info */}
        <View style={styles.infoCard}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.settingsLogo}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingsBrandTitle}>QiddasumTrack</Text>
              <Text style={styles.settingsBrandSub}>Budget & Activity Tracker • v1.0.0</Text>
            </View>
          </View>
          <View style={[styles.infoRow, styles.infoDivider]}>
            <ShieldCheck size={16} color={THEME.text.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>100% Local-First & Private (No Cloud)</Text>
          </View>
          <View style={styles.infoRow}>
            <Smartphone size={16} color={THEME.text.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>Optimized for Android & Web</Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add/Edit Recurring Modal */}
      <AddRecurringModal
        visible={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditingRecurring(null);
        }}
        onSave={handleSaveRecurring}
        onDelete={handleDeleteRecurring}
        initialRecord={editingRecurring}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg.main,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  statusBanner: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  statusError: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  statusText: {
    color: THEME.text.primary,
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    backgroundColor: THEME.bg.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    color: THEME.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  cardSub: {
    color: THEME.text.tertiary,
    fontSize: 12,
    marginBottom: 10,
  },
  backupActions: {
    gap: 8,
    marginTop: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.text.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg.input,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  btnText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '600',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  addSmallBtnText: {
    color: THEME.text.primary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  recurringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    padding: 11,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: THEME.bg.border,
  },
  recurringLeft: {
    flex: 1,
  },
  recurringName: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  recurringDates: {
    color: THEME.text.tertiary,
    fontSize: 11.5,
    marginTop: 2,
  },
  recurringRight: {
    alignItems: 'flex-end',
  },
  recurringAmount: {
    color: THEME.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  recurringRate: {
    color: THEME.accent.recurring,
    fontSize: 11.5,
    marginTop: 2,
  },
  emptyText: {
    color: THEME.text.tertiary,
    fontSize: 12.5,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: THEME.text.primary,
    fontSize: 13.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: 14,
  },
  categoryBadgeText: {
    color: THEME.text.primary,
    fontSize: 12.5,
    fontWeight: '500',
    marginRight: 6,
  },
  deleteBadgeBtn: {
    padding: 3,
  },
  infoCard: {
    backgroundColor: THEME.bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    marginBottom: 16,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsLogo: {
    width: 38,
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: THEME.bg.borderLight,
    marginRight: 12,
  },
  settingsBrandTitle: {
    color: THEME.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  settingsBrandSub: {
    color: THEME.text.secondary,
    fontSize: 11.5,
    marginTop: 1,
  },
  infoDivider: {
    borderTopWidth: 1,
    borderTopColor: THEME.bg.border,
    paddingTop: 8,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: THEME.text.tertiary,
    fontSize: 12,
  },
});
