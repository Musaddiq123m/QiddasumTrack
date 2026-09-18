import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, Footprints, Settings } from 'lucide-react-native';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { StepsScreen } from './src/screens/StepsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { THEME } from './src/theme/colors';
import { AnimatedPressable } from './src/components/AnimatedComponents';

type RootPage = 'budget' | 'steps' | 'settings';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<RootPage>('budget');
  const insets = useSafeAreaInsets();

  // On Android with 3-button navigation, insets.bottom is typically ~48dp.
  // Fallback to at least 16dp on Android, 0 on web if no system bar.
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0);
  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24)
    : insets.top;

  return (
    <View style={[styles.rootContainer, { paddingTop: topInset }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.bg.main}
        translucent={Platform.OS === 'android'}
      />

      {/* Top App Header with Logo */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require('./assets/logo.jpg')}
            style={styles.headerLogo}
            resizeMode="cover"
          />
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>
              {currentPage === 'budget' && 'Finances'}
              {currentPage === 'steps' && 'Activity'}
              {currentPage === 'settings' && 'Settings'}
            </Text>
            <Text style={styles.headerSub}>QiddasumTrack • Local</Text>
          </View>
        </View>
      </View>

      {/* Main Screen Content */}
      <View style={styles.pageContent}>
        {currentPage === 'budget' && <BudgetScreen />}
        {currentPage === 'steps' && <StepsScreen />}
        {currentPage === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: bottomInset,
            height: 54 + bottomInset,
          },
        ]}
      >
        <AnimatedPressable
          style={[styles.navItem, currentPage === 'budget' && styles.navItemActive]}
          onPress={() => setCurrentPage('budget')}
          scaleTo={0.92}
        >
          <Wallet
            size={20}
            color={currentPage === 'budget' ? THEME.text.primary : THEME.text.tertiary}
          />
          <Text
            style={[
              styles.navLabel,
              currentPage === 'budget' && styles.navLabelActive,
            ]}
          >
            Budget
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.navItem, currentPage === 'steps' && styles.navItemActive]}
          onPress={() => setCurrentPage('steps')}
          scaleTo={0.92}
        >
          <Footprints
            size={20}
            color={currentPage === 'steps' ? THEME.text.primary : THEME.text.tertiary}
          />
          <Text
            style={[
              styles.navLabel,
              currentPage === 'steps' && styles.navLabelActive,
            ]}
          >
            Steps
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.navItem, currentPage === 'settings' && styles.navItemActive]}
          onPress={() => setCurrentPage('settings')}
          scaleTo={0.92}
        >
          <Settings
            size={20}
            color={currentPage === 'settings' ? THEME.text.primary : THEME.text.tertiary}
          />
          <Text
            style={[
              styles.navLabel,
              currentPage === 'settings' && styles.navLabelActive,
            ]}
          >
            Settings
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: THEME.bg.main,
    height: '100%',
  },
  appHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: THEME.bg.main,
    borderBottomWidth: 1,
    borderBottomColor: THEME.bg.border,
    flexShrink: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.bg.borderLight,
    marginRight: 12,
  },
  headerTextCol: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: THEME.text.primary,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSub: {
    color: THEME.text.tertiary,
    fontSize: 10.5,
    marginTop: 1,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pageContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: THEME.bg.card,
    borderTopWidth: 1,
    borderTopColor: THEME.bg.border,
    paddingTop: 4,
    flexShrink: 0,
    width: '100%',
  },
  navItem: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navItemActive: {
    // Active state
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.text.tertiary,
  },
  navLabelActive: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
});
