import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GOALS, MANTRAS, useJap, type Mantra } from '@/context/JapContext';

const formatNumber = (value: number) => value.toLocaleString('en-IN');

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

function Mala({ count }: { count: number }) {
  const { colors } = useJap();
  const progress = count % 108 || (count > 0 ? 108 : 0);
  const beads = useMemo(
    () =>
      Array.from({ length: 108 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / 108;
        return {
          index,
          x: 150 + 112 * Math.cos(angle),
          y: 100 + 76 * Math.sin(angle),
        };
      }),
    [],
  );

  return (
    <View style={styles.malaWrap} accessibilityLabel={`${progress} of 108 beads`}>
      <Svg width="100%" height="176" viewBox="0 0 300 200">
        <Circle
          cx="150"
          cy="100"
          r="2"
          fill="transparent"
          stroke={colors.border}
          strokeWidth="1"
        />
        {beads.map(({ index, x, y }) => (
          <Circle
            key={index}
            cx={x}
            cy={y}
            r={index % 9 === 0 ? 5.2 : 4}
            fill={index < progress ? colors.primary : colors.bead}
            stroke={index < progress ? colors.gold : colors.border}
            strokeWidth="1.2"
          />
        ))}
        <Circle cx="150" cy="17" r="6.5" fill={colors.gold} />
      </Svg>
      <View pointerEvents="none" style={styles.malaCenter}>
        <Text style={[styles.malaOm, { color: colors.primary }]}>ॐ</Text>
        <Text style={[styles.malaRound, { color: colors.mutedForeground }]}>
          {progress} / 108
        </Text>
      </View>
    </View>
  );
}

function LoadingView({ message }: { message: string }) {
  const { colors } = useJap();
  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.muted, { color: colors.mutedForeground }]}>
        {message}
      </Text>
    </View>
  );
}

export default function JapScreen() {
  const insets = useSafeAreaInsets();
  const {
    state,
    colors,
    isLoaded,
    storageError,
    tap,
    undo,
    resetSession,
    setGoal,
    setMantra,
    retryLoad,
    addMantra,
    removeMantra,
  } = useJap();
  const { customMantras } = state;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addingPersonalMantra, setAddingPersonalMantra] = useState(false);
  const [newMantraName, setNewMantraName] = useState('');
  const [newMantraText, setNewMantraText] = useState('');
  const [mantraError, setMantraError] = useState('');
  const [notice, setNotice] = useState('');
  const todayRecord = state.days[state.date];
  const todayCount = todayRecord?.count ?? 0;
  const heroTopPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top + 12, 40)
      : insets.top + 8;
  const activeMantra =
    [...MANTRAS, ...customMantras].find(
      (mantra) => mantra.id === state.mantraId,
    ) ?? MANTRAS[0];
  const goalProgress = Math.min(100, (todayCount / state.goal) * 100);
  const currentRound = (state.count % 108) || (state.count > 0 ? 108 : 0);
  const rounds = state.sessions.filter((session) => session.kind === 'mala').length;

  const savePersonalMantra = () => {
    const name = newMantraName.trim();
    if (!name) {
      setMantraError('Enter a mantra name to continue.');
      return;
    }
    if (
      [...MANTRAS, ...customMantras].some(
        (mantra) =>
          mantra.transliteration.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      setMantraError('A mantra with this name is already in your list.');
      return;
    }
    if (customMantras.length >= 100) {
      setMantraError('You can save up to 100 personal mantras.');
      return;
    }

    const id = addMantra(name, newMantraText);
    if (!id) {
      setMantraError('This mantra could not be saved. Please try again.');
      return;
    }
    setNewMantraName('');
    setNewMantraText('');
    setMantraError('');
    setAddingPersonalMantra(false);
    setPickerOpen(false);
  };

  const confirmRemoveMantra = (mantra: Mantra) => {
    Alert.alert(
      'Remove personal mantra?',
      `"${mantra.transliteration}" will be removed from your list. Saved session history will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMantra(mantra.id),
        },
      ],
    );
  };

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 2300);
    return () => clearTimeout(timeout);
  }, [notice]);

  const streak = useMemo(() => {
    const cursor = new Date();
    if (!(state.days[state.date]?.count > 0)) cursor.setDate(cursor.getDate() - 1);
    let days = 0;
    for (let i = 0; i < 370; i += 1) {
      if (!(state.days[
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      ]?.count > 0)) {
        break;
      }
      days += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return days;
  }, [state.date, state.days]);

  if (!isLoaded) return <LoadingView message="Opening your practice…" />;

  const onTap = () => {
    const result = tap();
    if (state.vibration) {
      if (result.goalCompleted || result.roundCompleted) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    if (result.goalCompleted) setNotice('Your daily intention is complete.');
    else if (result.roundCompleted) setNotice('108 repetitions completed.');
  };

  const onUndo = () => {
    if (!undo()) setNotice('There is nothing to undo yet.');
    else setNotice('Last repetition removed.');
  };

  const onReset = () => {
    if (!resetSession()) setNotice('This session is already at zero.');
    else setNotice('Session reset. Today’s progress is saved.');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.homeScroll}
      >
        <LinearGradient
          colors={[colors.heroStart, colors.heroMiddle, colors.heroEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.hero, { paddingTop: heroTopPadding }]}>
            <View style={styles.heroTop}>
              <View style={styles.omMark}>
                <Text style={styles.omText}>ॐ</Text>
              </View>
              <Text style={styles.eyebrowLight}>YOUR DAILY SACRED PRACTICE</Text>
            </View>
            <Text style={styles.heroTitle}>Hindu Mantra Jap</Text>
            <Text style={styles.heroDate}>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.homeContent}>
          {storageError ? (
            <Card>
              <Text style={[styles.cardTitle, { color: colors.destructive }]}>
                Saved data needs attention
              </Text>
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                {storageError}
              </Text>
              <Pressable
                onPress={() => void retryLoad()}
                style={[styles.retryButton, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.retryText, { color: colors.primary }]}>
                  Try again
                </Text>
              </Pressable>
            </Card>
          ) : null}

          <Card style={styles.mantraCard}>
            <View style={styles.mantraTopRow}>
              <View>
                <Text style={[styles.microLabel, { color: colors.mutedForeground }]}>
                  SELECTED MANTRA
                </Text>
                {activeMantra.devanagari ? (
                  <Text
                    style={[styles.mantraDevanagari, { color: colors.primary }]}
                    numberOfLines={2}
                  >
                    {activeMantra.devanagari}
                  </Text>
                ) : null}
                <Text style={[styles.mantraRoman, { color: colors.mutedForeground }]}>
                  {activeMantra.transliteration}
                </Text>
              </View>
              <Pressable
                testID="change-mantra"
                accessibilityRole="button"
                accessibilityLabel="Choose a mantra"
                onPress={() => setPickerOpen(true)}
                style={({ pressed }) => [
                  styles.changeButton,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.changeText, { color: colors.primary }]}>
                  Change
                </Text>
                <Ionicons name="chevron-forward" size={15} color={colors.primary} />
              </Pressable>
            </View>
          </Card>

          <Card style={styles.counterCard}>
            <View style={styles.counterTop}>
              <Text style={[styles.microLabel, { color: colors.mutedForeground }]}>
                THIS SESSION
              </Text>
              <View style={[styles.roundPill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.roundPillText, { color: colors.primary }]}>
                  Round {Math.floor(state.count / 108) + 1}
                </Text>
              </View>
            </View>
            <Text
              testID="jap-count"
              accessibilityLiveRegion="polite"
              style={[styles.counterNumber, { color: colors.primary }]}
            >
              {formatNumber(state.count)}
            </Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>
              repetitions in this session
            </Text>

            <Mala count={state.count} />

            <Pressable
              testID="tap-to-chant"
              accessibilityRole="button"
              accessibilityLabel="Count one mantra repetition"
              accessibilityHint="Adds one repetition to your jap count"
              onPress={onTap}
              style={({ pressed }) => [
                styles.tapButton,
                {
                  borderColor: colors.gold,
                  shadowColor: colors.heroStart,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.gold, colors.heroEnd, colors.primary]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.tapGradient}
              >
                <Text style={styles.tapOm}>ॐ</Text>
                <Text style={styles.tapLabel}>TAP TO CHANT</Text>
              </LinearGradient>
            </Pressable>
            <Text style={[styles.tapCaption, { color: colors.mutedForeground }]}>
              One tap · One prayer · Inner peace
            </Text>

            <View style={styles.counterActions}>
              <Pressable
                testID="reset-session"
                accessibilityRole="button"
                onPress={onReset}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Ionicons name="refresh-outline" size={17} color={colors.primary} />
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  Reset session
                </Text>
              </Pressable>
              <Pressable
                testID="undo-jap"
                accessibilityRole="button"
                onPress={onUndo}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Ionicons name="arrow-undo-outline" size={17} color={colors.primary} />
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  Undo
                </Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <View style={styles.goalHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  Today’s intention
                </Text>
                <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                  {todayCount >= state.goal
                    ? 'Daily goal achieved'
                    : `${formatNumber(Math.max(0, state.goal - todayCount))} repetitions to go`}
                </Text>
              </View>
              <Text style={[styles.goalCount, { color: colors.primary }]}>
                {formatNumber(todayCount)} / {formatNumber(state.goal)}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${goalProgress}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.microLabel, styles.presetLabel, { color: colors.mutedForeground }]}>
              DAILY GOAL
            </Text>
            <View style={styles.goalChoices}>
              {GOALS.map((goal) => {
                const selected = goal === state.goal;
                return (
                  <Pressable
                    key={goal}
                    testID={`home-goal-${goal}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setGoal(goal)}
                    style={[
                      styles.goalChoice,
                      {
                        backgroundColor: selected ? colors.primary : colors.secondary,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.goalChoiceText,
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

          <View style={styles.statsRow}>
            <StatTile label="Completed malas" value={rounds} />
            <StatTile label="Day streak" value={streak} />
            <StatTile label="Lifetime jap" value={state.total} />
          </View>
        </View>
      </ScrollView>

      {notice ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.toast, { backgroundColor: colors.heroStart }]}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.gold} />
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      ) : null}

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close mantra picker"
            onPress={() => setPickerOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.modalPanel,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Sacred mantras
                </Text>
                <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                  Choose a mantra for your practice
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setPickerOpen(false)}
                hitSlop={12}
              >
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <KeyboardAwareScrollView
              bottomOffset={24}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {MANTRAS.map((mantra) => {
                const selected = state.mantraId === mantra.id;
                return (
                  <Pressable
                    key={mantra.id}
                    testID={`mantra-${mantra.id}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setMantra(mantra.id);
                      setPickerOpen(false);
                    }}
                    style={[
                      styles.mantraOption,
                      {
                        backgroundColor: selected ? colors.secondary : colors.card,
                        borderColor: selected ? colors.gold : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.mantraOptionCopy}>
                      <Text
                        style={[styles.optionDevanagari, { color: colors.primary }]}
                        numberOfLines={2}
                      >
                        {mantra.devanagari}
                      </Text>
                      <Text style={[styles.optionRoman, { color: colors.mutedForeground }]}>
                        {mantra.transliteration}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={21} color={colors.primary} />
                    ) : (
                      <View style={[styles.radioOutline, { borderColor: colors.border }]} />
                    )}
                  </Pressable>
                );
              })}
              {customMantras.length ? (
                <>
                  <Text style={[styles.personalSectionLabel, { color: colors.mutedForeground }]}>
                    PERSONAL MANTRAS
                  </Text>
                  {customMantras.map((mantra) => {
                    const selected = state.mantraId === mantra.id;
                    return (
                      <View key={mantra.id} style={styles.personalRow}>
                        <Pressable
                          testID={`mantra-${mantra.id}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => {
                            setMantra(mantra.id);
                            setPickerOpen(false);
                          }}
                          style={[
                            styles.mantraOption,
                            styles.personalOption,
                            {
                              backgroundColor: selected ? colors.secondary : colors.card,
                              borderColor: selected ? colors.gold : colors.border,
                            },
                          ]}
                        >
                          <View style={styles.mantraOptionCopy}>
                            {mantra.devanagari ? (
                              <Text
                                style={[styles.optionDevanagari, { color: colors.primary }]}
                                numberOfLines={2}
                              >
                                {mantra.devanagari}
                              </Text>
                            ) : null}
                            <Text
                              style={[styles.optionRoman, { color: colors.mutedForeground }]}
                              numberOfLines={2}
                            >
                              {mantra.transliteration}
                            </Text>
                          </View>
                          {selected ? (
                            <Ionicons name="checkmark-circle" size={21} color={colors.primary} />
                          ) : (
                            <View style={[styles.radioOutline, { borderColor: colors.border }]} />
                          )}
                        </Pressable>
                        <Pressable
                          testID={`remove-mantra-${mantra.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${mantra.transliteration}`}
                          onPress={() => confirmRemoveMantra(mantra)}
                          hitSlop={6}
                          style={styles.removePersonalButton}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
                        </Pressable>
                      </View>
                    );
                  })}
                </>
              ) : null}

              {addingPersonalMantra ? (
                <View style={[styles.personalForm, { borderColor: colors.border }]}>
                  <View style={styles.personalFormHeading}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                      Add a personal mantra
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close add mantra form"
                      onPress={() => {
                        setAddingPersonalMantra(false);
                        setMantraError('');
                      }}
                      hitSlop={10}
                    >
                      <Ionicons name="close" size={21} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                    Mantra name
                  </Text>
                  <TextInput
                    testID="personal-mantra-name"
                    accessibilityLabel="Mantra name"
                    value={newMantraName}
                    onChangeText={(value) => {
                      setNewMantraName(value);
                      setMantraError('');
                    }}
                    placeholder="For example, Om Shanti"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={72}
                    autoCapitalize="sentences"
                    returnKeyType="next"
                    style={[
                      styles.mantraInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.input,
                        color: colors.foreground,
                      },
                    ]}
                  />
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                    Sacred text <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
                  </Text>
                  <TextInput
                    testID="personal-mantra-text"
                    accessibilityLabel="Sacred text, optional"
                    value={newMantraText}
                    onChangeText={setNewMantraText}
                    placeholder="Add the Sanskrit text if you wish"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={140}
                    style={[
                      styles.mantraInput,
                      styles.sacredTextInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.input,
                        color: colors.foreground,
                      },
                    ]}
                  />
                  {mantraError ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.mantraError, { color: colors.destructive }]}
                    >
                      {mantraError}
                    </Text>
                  ) : null}
                  <Pressable
                    testID="save-personal-mantra"
                    accessibilityRole="button"
                    onPress={savePersonalMantra}
                    style={({ pressed }) => [
                      styles.saveMantraButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: pressed ? 0.78 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.saveMantraText, { color: colors.primaryForeground }]}>
                      Save and select
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  testID="add-personal-mantra"
                  accessibilityRole="button"
                  onPress={() => {
                    setAddingPersonalMantra(true);
                    setMantraError('');
                  }}
                  style={[
                    styles.addMantraButton,
                    { borderColor: colors.border, backgroundColor: colors.secondary },
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={[styles.addMantraText, { color: colors.primary }]}>
                    Add personal mantra
                  </Text>
                </Pressable>
              )}
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  const { colors } = useJap();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.statValue, { color: colors.primary }]} numberOfLines={1}>
        {formatNumber(value)}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  homeScroll: { paddingBottom: 18 },
  hero: { paddingHorizontal: 22, paddingBottom: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  omMark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,220,146,0.46)',
  },
  omText: { color: '#ffdc92', fontSize: 25, fontWeight: '700' },
  eyebrowLight: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    letterSpacing: 1.35,
    fontWeight: '700',
  },
  heroTitle: { color: '#fffaf1', fontSize: 27, fontWeight: '800', marginTop: 13 },
  heroDate: { color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 3 },
  homeContent: { paddingHorizontal: 15, paddingTop: 14, gap: 12 },
  card: { borderWidth: 1, borderRadius: 19, padding: 16 },
  mantraCard: { paddingVertical: 15 },
  mantraTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  microLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  mantraDevanagari: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  mantraRoman: { fontSize: 12, marginTop: 3 },
  changeButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  changeText: { fontSize: 12, fontWeight: '700' },
  counterCard: { alignItems: 'center', paddingTop: 15, paddingBottom: 17 },
  counterTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  roundPillText: { fontSize: 11, fontWeight: '700' },
  counterNumber: {
    fontSize: 61,
    fontWeight: '800',
    lineHeight: 70,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    marginTop: 10,
  },
  muted: { fontSize: 12 },
  malaWrap: { width: '100%', height: 176, position: 'relative', marginTop: 2 },
  malaCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  malaOm: { fontSize: 24, fontWeight: '700', marginTop: 6 },
  malaRound: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  tapButton: {
    width: 132,
    height: 132,
    borderWidth: 5,
    borderRadius: 66,
    overflow: 'hidden',
    elevation: 6,
    shadowOpacity: 0.24,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
  },
  tapGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tapOm: { color: '#ffffff', fontSize: 33, fontWeight: '800', marginTop: -2 },
  tapLabel: {
    color: '#ffffff',
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '800',
    marginTop: 1,
  },
  tapCaption: { fontSize: 11, marginTop: 12 },
  counterActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 9,
    marginTop: 17,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryButtonText: { fontSize: 12, fontWeight: '700' },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  goalCount: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 6 },
  presetLabel: { marginTop: 15, marginBottom: 8 },
  goalChoices: { flexDirection: 'row', gap: 7 },
  goalChoice: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalChoiceText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statTile: { flex: 1, minWidth: 0, borderRadius: 14, padding: 11 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 3 },
  toast: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    minHeight: 48,
    borderRadius: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 6,
  },
  toastText: { color: '#fffaf1', fontSize: 13, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(35, 20, 12, 0.42)',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    maxHeight: '82%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#c9b9a5',
    marginBottom: 17,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  mantraOption: {
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mantraOptionCopy: { flex: 1 },
  optionDevanagari: { fontSize: 16, fontWeight: '700' },
  optionRoman: { fontSize: 11, marginTop: 4 },
  radioOutline: { width: 19, height: 19, borderWidth: 1.5, borderRadius: 10 },
  personalSectionLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: 7,
    marginBottom: 9,
  },
  personalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  personalOption: { flex: 1, marginBottom: 0 },
  removePersonalButton: {
    minWidth: 42,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMantraButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 5,
  },
  addMantraText: { fontSize: 13, fontWeight: '700' },
  personalForm: { borderTopWidth: 1, marginTop: 9, paddingTop: 15, gap: 8 },
  personalFormHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  inputLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  mantraInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  sacredTextInput: { minHeight: 72, textAlignVertical: 'top', paddingTop: 12 },
  mantraError: { fontSize: 12 },
  saveMantraButton: {
    minHeight: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 4,
    marginBottom: 7,
  },
  saveMantraText: { fontSize: 13, fontWeight: '700' },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginTop: 10,
    borderRadius: 10,
  },
  retryText: { fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
