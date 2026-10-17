import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GOALS,
  useJap,
} from '@/context/JapContext';
import { palettes, type ThemeName } from '@/constants/colors';

const themes: { id: ThemeName; label: string; detail: string }[] = [
  { id: 'saffron', label: 'Saffron & gold', detail: 'Warm prayer-room tones' },
  { id: 'temple', label: 'Temple warmth', detail: 'Deep, sunlit sandstone' },
  { id: 'nature', label: 'Nature & serenity', detail: 'Quiet leafy greens' },
  { id: 'light', label: 'Light & minimal', detail: 'Soft, simple neutrals' },
  { id: 'dark', label: 'Night meditation', detail: 'Low-light evening practice' },
];

function Card({ children, style }: React.PropsWithChildren<{ style?: object }>) {
  const { colors } = useJap();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const {
    state,
    colors,
    isLoaded,
    setTheme,
    setGoal,
    setVibration,
    resetSession,
    clearAllData,
  } = useJap();
  const [notice, setNotice] = useState('');

  if (!isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.mutedForeground }}>Loading settings…</Text>
      </View>
    );
  }

  const confirmResetSession = () => {
    if (state.count === 0) {
      setNotice('This session is already at zero.');
      setTimeout(() => setNotice(''), 2200);
      return;
    }
    Alert.alert(
      'Reset this session?',
      'The current counter will return to zero. Today’s repetition history and lifetime total will remain saved.',
      [
        { text: 'Keep counting', style: 'cancel' },
        {
          text: 'Reset session',
          style: 'destructive',
          onPress: () => {
            resetSession();
            setNotice('Session reset. Today’s progress is saved.');
            setTimeout(() => setNotice(''), 2200);
          },
        },
      ],
    );
  };

  const confirmClearAll = () => {
    Alert.alert(
      'Delete all jap data?',
      'This permanently removes saved counts, history, goals, and preferences from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all data',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            setNotice('All app data has been reset.');
            setTimeout(() => setNotice(''), 2200);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar style={state.theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR SPACE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Shape your practice to feel right for you.
          </Text>
        </View>

        <Card>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Appearance</Text>
              <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                Choose a peaceful color theme
              </Text>
            </View>
          </View>
          <View style={styles.themeList}>
            {themes.map((theme) => {
              const selected = state.theme === theme.id;
              const swatch = palettes[theme.id];
              return (
                <Pressable
                  key={theme.id}
                  testID={`theme-${theme.id}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTheme(theme.id)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: selected ? colors.secondary : colors.card,
                      borderColor: selected ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.themeSwatch, { backgroundColor: swatch.primary }]}>
                    <View style={[styles.themeSwatchDot, { backgroundColor: swatch.gold }]} />
                  </View>
                  <View style={styles.themeCopy}>
                    <Text style={[styles.themeName, { color: colors.foreground }]}>
                      {theme.label}
                    </Text>
                    <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                      {theme.detail}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={21} color={colors.primary} />
                  ) : (
                    <View style={[styles.radio, { borderColor: colors.border }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Daily jap goal</Text>
              <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                Your intention is {state.goal} repetitions per day
              </Text>
            </View>
          </View>
          <View style={styles.goalList}>
            {GOALS.map((goal) => {
              const selected = goal === state.goal;
              return (
                <Pressable
                  key={goal}
                  testID={`settings-goal-${goal}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setGoal(goal)}
                  style={[
                    styles.goalOption,
                    {
                      backgroundColor: selected ? colors.primary : colors.secondary,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.goalOptionText,
                      { color: selected ? colors.primaryForeground : colors.primary },
                    ]}
                  >
                    {goal}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <View style={styles.preferenceRow}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="phone-portrait-outline" size={17} color={colors.primary} />
            </View>
            <View style={styles.preferenceCopy}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Vibration feedback
              </Text>
              <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                A gentle haptic response for each count
              </Text>
            </View>
            <Switch
              testID="vibration-toggle"
              accessibilityLabel="Vibration feedback"
              value={state.vibration}
              onValueChange={setVibration}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </Card>

        <Card>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="archive-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Manage practice</Text>
              <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                Counts and history are saved on this device.
              </Text>
            </View>
          </View>
          <Pressable
            testID="settings-reset-session"
            accessibilityRole="button"
            onPress={confirmResetSession}
            style={({ pressed }) => [
              styles.actionRow,
              { borderTopColor: colors.border, opacity: pressed ? 0.68 : 1 },
            ]}
          >
            <View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                Reset current session
              </Text>
              <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                Today’s history and lifetime total stay intact
              </Text>
            </View>
            <Ionicons name="refresh-outline" size={19} color={colors.primary} />
          </Pressable>
          <Pressable
            testID="delete-all-data"
            accessibilityRole="button"
            onPress={confirmClearAll}
            style={({ pressed }) => [
              styles.actionRow,
              { borderTopColor: colors.border, opacity: pressed ? 0.68 : 1 },
            ]}
          >
            <View>
              <Text style={[styles.actionTitle, { color: colors.destructive }]}>
                Delete all app data
              </Text>
              <Text style={[styles.sectionCaption, { color: colors.mutedForeground }]}>
                Permanently clear all saved practice on this device
              </Text>
            </View>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
          </Pressable>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerOm, { color: colors.gold }]}>ॐ</Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            A little practice, held with care.
          </Text>
        </View>
      </ScrollView>

      {notice ? (
        <View style={[styles.toast, { backgroundColor: colors.heroStart }]}>
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 17, paddingBottom: 28, gap: 13 },
  heading: { paddingTop: 12, paddingBottom: 2 },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: '800' },
  title: { fontSize: 27, fontWeight: '800', marginTop: 5 },
  subtitle: { fontSize: 12, marginTop: 4 },
  card: { borderWidth: 1, borderRadius: 18, padding: 15 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sectionIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  sectionCaption: { fontSize: 10, marginTop: 3 },
  themeList: { marginTop: 13, gap: 7 },
  themeOption: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  themeSwatch: { width: 35, height: 35, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  themeSwatchDot: { width: 12, height: 12, borderRadius: 6 },
  themeCopy: { flex: 1 },
  themeName: { fontSize: 12, fontWeight: '700' },
  radio: { width: 19, height: 19, borderWidth: 1.5, borderRadius: 10 },
  goalList: { flexDirection: 'row', gap: 7, marginTop: 14 },
  goalOption: {
    flex: 1,
    minHeight: 39,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalOptionText: { fontSize: 11, fontWeight: '800' },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  preferenceCopy: { flex: 1 },
  actionRow: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 11,
  },
  actionTitle: { fontSize: 12, fontWeight: '700' },
  footer: { alignItems: 'center', paddingVertical: 8 },
  footerOm: { fontSize: 25, fontWeight: '700' },
  footerText: { fontSize: 10, marginTop: 4 },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 12,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    elevation: 6,
  },
  toastText: { color: '#fffaf1', fontSize: 12, fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
});
