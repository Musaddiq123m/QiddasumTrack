import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform as RNPlatform,
} from 'react-native';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  Smartphone,
  Calendar,
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
    showStatus('Income type added successfully!');
  };

  const handleDeleteIncomeType = (id: string, name: string) => {
    IncomeRepo.deleteType(id);
    loadData();
    showStatus(`Deleted income type: ${name}`);
  };

  // Expense Category handlers
  const handleAddExpenseType = () => {
    if (!newExpenseType.trim()) return;
    ExpenseRepo.addType(newExpenseType.trim());
    setNewExpenseType('');
    loadData();
    showStatus('Expense category added successfully!');
  };

  const handleDeleteExpenseType = (id: string, name: string) => {
    ExpenseRepo.deleteType(id);
    loadData();
    showStatus(`Deleted expense category: ${name}`);
  };

  // Recurring handlers
  const handleSaveRecurring = (name: string, amount: number, startDate: string, endDate: string, id?: string) => {
    if (id) {
      RecurringRepo.update(id, name, amount, startDate, endDate);
      showStatus('Recurring expense updated!');
    } else {
      RecurringRepo.add(name, amount, startDate, endDate);
      showStatus('Recurring expense added!');
    }
    loadData();
  };

  const handleDeleteRecurring = (id: string) => {
    RecurringRepo.delete(id);
    loadData();
    showStatus('Recurring expense deleted!');
  };

  // Excel Export
  const handleExportExcel = async () => {
    try {
      const result = await BackupRepo.exportToExcel();
      if (result.success) {
        showStatus('Data successfully exported to Excel (.xlsx)!');
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
        // Create invisible HTML file input for web preview
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async (evt: any) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const result = await BackupRepo.importFromWorkbook(wb);
            if (result.success) {
              loadData();
              showStatus(`Imported ${result.count} records successfully!`);
            } else {
              showStatus(result.error || 'Failed to import backup', 'error');
            }
          };
          reader.readAsBinaryString(file);
        };
        input.click();
      } else {
        // Native (Android / iOS)
        const DocumentPicker = require('expo-document-picker');
        const FileSystem = require('expo-file-system');

        const docRes = await DocumentPicker.getDocumentAsync({
          type: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
          ],
          copyToCacheDirectory: true,
        });

        if (docRes.canceled || !docRes.assets || docRes.assets.length === 0) return;

        const asset = docRes.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const wb = XLSX.read(base64, { type: 'base64' });
        const result = await BackupRepo.importFromWorkbook(wb);

        if (result.success) {
          loadData();
          showStatus(`Imported ${result.count} records successfully!`);
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
            <FileSpreadsheet size={20} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Data Backup & Restore</Text>
          </View>
          <Text style={styles.cardSub}>
            Export your entire walking and financial history to an Excel file (.xlsx) or restore from an existing backup.
          </Text>

          <View style={styles.backupActions}>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportExcel} activeOpacity={0.8}>
              <Download size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Export to Excel (.xlsx)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.importBtn} onPress={handleImportExcel} activeOpacity={0.8}>
              <Upload size={18} color="#38BDF8" style={{ marginRight: 8 }} />
              <Text style={[styles.btnText, { color: '#38BDF8' }]}>Import / Restore Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Recurring Expenses Management */}
        <View style={styles.card}>
          <View style={styles.headerWithAction}>
            <View style={styles.titleRow}>
              <Repeat size={20} color="#6366F1" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Recurring Expenses</Text>
            </View>
            <TouchableOpacity
              style={styles.addSmallBtn}
              onPress={() => {
                setEditingRecurring(null);
                setIsRecurringModalOpen(true);
              }}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#6366F1" style={{ marginRight: 4 }} />
              <Text style={styles.addSmallBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSub}>
            Costs like rent and electricity distributed across their active period.
          </Text>

          {recurringExpenses.length === 0 ? (
            <Text style={styles.emptyText}>No recurring expenses configured.</Text>
          ) : (
            recurringExpenses.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={styles.recurringItem}
                onPress={() => {
                  setEditingRecurring(rec);
                  setIsRecurringModalOpen(true);
                }}
                activeOpacity={0.7}
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
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Section: Income Types */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Layers size={20} color="#10B981" style={{ marginRight: 8 }} />
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
            <TouchableOpacity style={styles.addBtn} onPress={handleAddIncomeType} activeOpacity={0.8}>
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.chipGrid}>
            {incomeTypes.map((t) => (
              <View key={t.id} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{t.name}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteIncomeType(t.id, t.name)}
                  style={styles.deleteBadgeBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Expense Categories */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Layers size={20} color="#EF4444" style={{ marginRight: 8 }} />
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
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: '#EF4444' }]}
              onPress={handleAddExpenseType}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.chipGrid}>
            {expenseTypes.map((t) => (
              <View key={t.id} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{t.name}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteExpenseType(t.id, t.name)}
                  style={styles.deleteBadgeBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={12} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Device & Privacy Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ShieldCheck size={18} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>100% Local-First & Offline Privacy</Text>
          </View>
          <View style={styles.infoRow}>
            <Smartphone size={18} color="#38BDF8" style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>Optimized for Redmi Note 12 (MIUI / 120Hz)</Text>
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
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  statusText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
  backupActions: {
    gap: 10,
    marginTop: 6,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  addSmallBtnText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  recurringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recurringLeft: {
    flex: 1,
  },
  recurringName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  recurringDates: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  recurringRight: {
    alignItems: 'flex-end',
  },
  recurringAmount: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  recurringRate: {
    color: '#818CF8',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    marginVertical: 4,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryBadgeText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
  },
  deleteBadgeBtn: {
    padding: 4,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
