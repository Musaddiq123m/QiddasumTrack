import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Wallet, Footprints, Settings } from 'lucide-react-native';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { StepsScreen } from './src/screens/StepsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type RootPage = 'budget' | 'steps' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<RootPage>('budget');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top App Header */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.headerTitle}>
            {currentPage === 'budget' && 'Budget & Finances'}
            {currentPage === 'steps' && 'Walking & Steps'}
            {currentPage === 'settings' && 'Settings & Backup'}
          </Text>
          <Text style={styles.headerSub}>Local-first • Redmi Note 12</Text>
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.pageContent}>
        {currentPage === 'budget' && <BudgetScreen />}
        {currentPage === 'steps' && <StepsScreen />}
        {currentPage === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, currentPage === 'budget' && styles.navItemActive]}
          onPress={() => setCurrentPage('budget')}
          activeOpacity={0.7}
        >
          <Wallet
            size={22}
            color={currentPage === 'budget' ? '#38BDF8' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navLabel,
              currentPage === 'budget' && styles.navLabelActive,
            ]}
          >
            Budget
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentPage === 'steps' && styles.navItemActive]}
          onPress={() => setCurrentPage('steps')}
          activeOpacity={0.7}
        >
          <Footprints
            size={22}
            color={currentPage === 'steps' ? '#10B981' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navLabel,
              currentPage === 'steps' && styles.navLabelActive,
            ]}
          >
            Steps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentPage === 'settings' && styles.navItemActive]}
          onPress={() => setCurrentPage('settings')}
          activeOpacity={0.7}
        >
          <Settings
            size={22}
            color={currentPage === 'settings' ? '#818CF8' : '#94A3B8'}
          />
          <Text
            style={[
              styles.navLabel,
              currentPage === 'settings' && styles.navLabelActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  appHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: '#0F172A',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pageContent: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 6,
    paddingTop: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navItemActive: {
    // Subtle active tint
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navLabelActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
});
