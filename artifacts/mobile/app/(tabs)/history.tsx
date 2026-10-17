import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MANTRAS, localDateKey, useJap } from '@/context/JapContext';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ChartItem = { key: string; label: string; value: number };

const number = (value: number) => value.toLocaleString('en-IN');

function makeDate(year: number, month: number, day: number) {
  return new Date(year, month, day, 12);
}

function describeDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString(undefined, options);
}

function periodData(period: Period, offset: number, days: Record<string, { count: number }>) {
  const now = new Date();
  let start = makeDate(now.getFullYear(), now.getMonth(), now.getDate());
  let end = start;
  let label = '';
  let items: ChartItem[] = [];

  if (period === 'daily') {
    start.setDate(start.getDate() + offset);
    end = start;
    label = describeDate(start, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const key = localDateKey(start);
    items = [{ key, label: 'Jap', value: days[key]?.count ?? 0 }];
  } else if (period === 'weekly') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
    end = makeDate(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    label = `${describeDate(start, { month: 'short', day: 'numeric' })} – ${describeDate(end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    items = Array.from({ length: 7 }, (_, index) => {
      const date = makeDate(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const key = localDateKey(date);
      return {
        key,
        label: describeDate(date, { weekday: 'short' }),
        value: days[key]?.count ?? 0,
      };
    });
  } else if (period === 'monthly') {
    start = makeDate(now.getFullYear(), now.getMonth() + offset, 1);
    end = makeDate(start.getFullYear(), start.getMonth() + 1, 0);
    label = describeDate(start, { month: 'long', year: 'numeric' });
    items = Array.from({ length: end.getDate() }, (_, index) => {
      const date = makeDate(start.getFullYear(), start.getMonth(), index + 1);
      const key = localDateKey(date);
      return { key, label: String(index + 1), value: days[key]?.count ?? 0 };
    });
  } else {
    start = makeDate(now.getFullYear() + offset, 0, 1);
    end = makeDate(start.getFullYear(), 11, 31);
    label = String(start.getFullYear());
    items = Array.from({ length: 12 }, (_, month) => {
      const monthStart = makeDate(start.getFullYear(), month, 1);
      let value = 0;
      const monthDays = new Date(start.getFullYear(), month + 1, 0).getDate();
      for (let day = 1; day <= monthDays; day += 1) {
        value += days[localDateKey(makeDate(start.getFullYear(), month, day))]?.count ?? 0;
      }
      return {
        key: localDateKey(monthStart),
        label: describeDate(monthStart, { month: 'short' }),
        value,
      };
    });
  }
  return { start, end, label, items };
}

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

function Stat({ label, value }: { label: string; value: number }) {
  const { colors } = useJap();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.statValue, { color: colors.primary }]} numberOfLines={1}>
        {number(value)}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { state, colors, isLoaded } = useJap();
  const [period, setPeriod] = useState<Period>('daily');
  const [offset, setOffset] = useState(0);
  const allMantras = [...MANTRAS, ...state.customMantras];
  const range = useMemo(
    () => periodData(period, offset, state.days),
    [period, offset, state.days],
  );
  const totals = range.items.reduce((sum, item) => sum + item.value, 0);
  const activeDays = range.items.filter((item) => item.value > 0).length;
  const goalDays = range.items.filter((item) => {
    const record = state.days[item.key];
    return record && record.count > 0 && record.count >= record.goal;
  }).length;
  const malaSessions = state.sessions
    .filter(
      (session) =>
        session.kind === 'mala' &&
        session.date >= localDateKey(range.start) &&
        session.date <= localDateKey(range.end),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  const partialSessions = state.sessions
    .filter(
      (session) =>
        session.kind === 'partial' &&
        session.date >= localDateKey(range.start) &&
        session.date <= localDateKey(range.end),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  const peak = Math.max(0, ...range.items.map((item) => item.value));
  const average = range.items.length ? Math.round(totals / range.items.length) : 0;
  const best = range.items.reduce<ChartItem | null>(
    (current, item) => (item.value > (current?.value ?? 0) ? item : current),
    null,
  );
  const lifetimeRounds = state.sessions.filter((session) => session.kind === 'mala').length;
  const showCurrent = state.date >= localDateKey(range.start) &&
    state.date <= localDateKey(range.end) &&
    state.count > 0;

  if (!isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.mutedForeground }}>Opening your history…</Text>
      </View>
    );
  }

  const periods: { id: Period; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
  ];
  const periodTitle =
    period === 'daily' ? 'Jap for this day' : period === 'yearly' ? 'Monthly jap' : 'Daily jap';

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
        <View style={styles.pageHeading}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR PRACTICE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Jap history</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            A quiet record of every repetition.
          </Text>
        </View>

        <View style={styles.periods}>
          {periods.map((option) => {
            const selected = period === option.id;
            return (
              <Text
                key={option.id}
                onPress={() => {
                  setPeriod(option.id);
                  setOffset(0);
                }}
                accessibilityRole="button"
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    color: selected ? colors.primaryForeground : colors.mutedForeground,
                  },
                ]}
              >
                {option.label}
              </Text>
            );
          })}
        </View>

        <Card style={styles.rangeCard}>
          <Text
            accessibilityRole="button"
            onPress={() => setOffset((value) => value - 1)}
            style={[styles.rangeControl, { color: colors.primary }]}
          >
            ‹ Previous
          </Text>
          <Text style={[styles.rangeLabel, { color: colors.foreground }]} numberOfLines={2}>
            {range.label}
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => setOffset((value) => Math.min(0, value + 1))}
            style={[
              styles.rangeControl,
              { color: offset === 0 ? colors.mutedForeground : colors.primary },
            ]}
          >
            Next ›
          </Text>
        </Card>

        <View style={styles.statsRow}>
          <Stat label="Repetitions" value={totals} />
          <Stat label="Active days" value={activeDays} />
          <Stat label="Completed sessions" value={malaSessions.length} />
        </View>

        <Card style={styles.chartCard}>
          <View style={styles.cardHeadingRow}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{periodTitle}</Text>
            <Text style={[styles.peak, { color: colors.mutedForeground }]}>
              Peak {number(peak)}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScroll}
          >
            <View style={styles.chart}>
              {range.items.map((item) => {
                const height = peak > 0 ? Math.max(4, (item.value / peak) * 89) : 4;
                const isToday = item.key === state.date;
                return (
                  <View key={item.key} style={styles.chartColumn}>
                    <Text style={[styles.chartValue, { color: colors.mutedForeground }]}>
                      {item.value > 0 ? number(item.value) : ' '}
                    </Text>
                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: colors.muted },
                      ]}
                    >
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor: isToday ? colors.primary : colors.gold,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <Text style={[styles.chartNote, { color: colors.mutedForeground }]}>
            Your saved repetition count for each interval.
          </Text>
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 9 }]}>
            Period summary
          </Text>
          <SummaryRow label="Average per interval" value={number(average)} />
          <SummaryRow
            label="Best interval"
            value={best?.value ? `${best.label} · ${number(best.value)}` : '—'}
          />
          <SummaryRow label="Daily goal" value={number(state.goal)} />
          <SummaryRow label="Lifetime jap" value={number(state.total)} last />
          <SummaryRow label="All completed sessions" value={number(lifetimeRounds)} last />
        </Card>

        <Card style={styles.sessionCard}>
          <View style={styles.cardHeadingRow}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Practice sessions</Text>
            <Text style={[styles.peak, { color: colors.mutedForeground }]}>
              {goalDays} goal{goalDays === 1 ? '' : 's'} met
            </Text>
          </View>

          {showCurrent ? (
            <View style={styles.sessionItem}>
              <View style={[styles.sessionIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.sessionCopy}>
                <Text style={[styles.sessionMantra, { color: colors.foreground }]}>
                  Current jap session
                </Text>
                <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
                  {state.date}
                </Text>
              </View>
              <Text style={[styles.sessionCount, { color: colors.primary }]}>
                {number(state.count)}
              </Text>
            </View>
          ) : null}

          {malaSessions.map((session) => {
            const mantra = allMantras.find((item) => item.id === session.mantraId);
            return (
              <View key={session.id} style={styles.sessionItem}>
                <View style={[styles.sessionIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.sessionCopy}>
                  <Text style={[styles.sessionMantra, { color: colors.foreground }]} numberOfLines={1}>
                    {session.mantraName ?? mantra?.transliteration ?? 'Jap session'}
                  </Text>
                  <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
                    {session.date} · Mala completed
                  </Text>
                </View>
                <Text style={[styles.sessionCount, { color: colors.primary }]}>108</Text>
              </View>
            );
          })}

          {partialSessions.map((session) => {
            const mantra = allMantras.find((item) => item.id === session.mantraId);
            return (
              <View key={session.id} style={styles.sessionItem}>
                <View style={[styles.sessionIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="bookmark-outline" size={17} color={colors.primary} />
                </View>
                <View style={styles.sessionCopy}>
                  <Text style={[styles.sessionMantra, { color: colors.foreground }]} numberOfLines={1}>
                    {session.mantraName ?? mantra?.transliteration ?? 'Jap session'}
                  </Text>
                  <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
                    {session.date} · Partial session saved
                  </Text>
                </View>
                <Text style={[styles.sessionCount, { color: colors.primary }]}>
                  {number(session.count)}
                </Text>
              </View>
            );
          })}

          {!showCurrent && malaSessions.length === 0 && partialSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={25} color={colors.gold} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No sessions in this period
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Completed malas and saved partial sessions will appear here.
              </Text>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  const { colors } = useJap();
  return (
    <View
      style={[
        styles.summaryRow,
        { borderBottomColor: last ? 'transparent' : colors.border },
      ]}
    >
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 17, paddingBottom: 28, gap: 13 },
  pageHeading: { paddingTop: 12, paddingBottom: 2 },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: '800' },
  title: { fontSize: 27, fontWeight: '800', marginTop: 5 },
  subtitle: { fontSize: 12, marginTop: 4 },
  periods: { flexDirection: 'row', gap: 6 },
  periodButton: {
    flex: 1,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 11,
  },
  card: { borderWidth: 1, borderRadius: 18, padding: 15 },
  rangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  rangeControl: { fontSize: 11, fontWeight: '700', paddingVertical: 8 },
  rangeLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 7 },
  statTile: { flex: 1, minWidth: 0, borderRadius: 13, padding: 10 },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 9, marginTop: 3 },
  chartCard: { paddingBottom: 13 },
  cardHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  peak: { fontSize: 10, fontWeight: '600' },
  chartScroll: { paddingTop: 9 },
  chart: {
    height: 142,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    paddingHorizontal: 2,
  },
  chartColumn: { width: 23, height: 140, alignItems: 'center', justifyContent: 'flex-end' },
  chartValue: { height: 15, fontSize: 8, textAlign: 'center', width: 36 },
  barTrack: {
    height: 93,
    width: 16,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  chartLabel: { fontSize: 8, marginTop: 5 },
  chartNote: { fontSize: 10, marginTop: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 12, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  sessionCard: { paddingBottom: 8 },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eadfce',
  },
  sessionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionCopy: { flex: 1, minWidth: 0 },
  sessionMantra: { fontSize: 12, fontWeight: '700' },
  sessionDate: { fontSize: 10, marginTop: 3 },
  sessionCount: { fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 22, gap: 6 },
  emptyTitle: { fontSize: 13, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
