import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColors } from '@/hooks/useColors';
import type { ThemeName } from '@/constants/colors';

export const GOALS = [27, 54, 108, 216, 1008] as const;
export type DailyGoal = (typeof GOALS)[number];

export type Mantra = {
  id: string;
  devanagari: string;
  transliteration: string;
};

export const MANTRAS: readonly Mantra[] = [
  {
    id: 'shiva',
    devanagari: 'ॐ नमः शिवाय',
    transliteration: 'Om Namah Shivaya',
  },
  {
    id: 'krishna',
    devanagari: 'हरे कृष्ण हरे कृष्ण',
    transliteration: 'Hare Krishna Hare Krishna',
  },
  {
    id: 'vasudevaya',
    devanagari: 'ॐ नमो भगवते वासुदेवाय',
    transliteration: 'Om Namo Bhagavate Vasudevaya',
  },
  {
    id: 'ram',
    devanagari: 'श्री राम जय राम जय जय राम',
    transliteration: 'Shri Ram Jai Ram',
  },
  {
    id: 'gayatri',
    devanagari: 'ॐ भूर्भुवः स्वः',
    transliteration: 'Gayatri Mantra',
  },
];

export type JapSession = {
  id: string;
  date: string;
  at: string;
  count: number;
  mantraId: string;
  mantraName?: string;
  kind: 'mala' | 'partial';
};

export type DailyRecord = {
  count: number;
  goal: number;
};

export type JapState = {
  date: string;
  count: number;
  total: number;
  goal: DailyGoal;
  mantraId: string;
  customMantras: Mantra[];
  theme: ThemeName;
  vibration: boolean;
  days: Record<string, DailyRecord>;
  sessions: JapSession[];
};

type TapResult = { roundCompleted: boolean; goalCompleted: boolean };

type JapContextValue = {
  state: JapState;
  colors: ReturnType<typeof useColors>;
  isLoaded: boolean;
  storageError: string | null;
  tap: () => TapResult;
  undo: () => boolean;
  resetSession: () => boolean;
  setGoal: (goal: DailyGoal) => void;
  setMantra: (id: string) => void;
  addMantra: (name: string, sacredText: string) => string | null;
  removeMantra: (id: string) => void;
  setTheme: (theme: ThemeName) => void;
  setVibration: (enabled: boolean) => void;
  clearAllData: () => void;
  retryLoad: () => Promise<void>;
};

const STORAGE_KEY = 'hindu-mantra-jap-v1';
const JapContext = createContext<JapContextValue | null>(null);

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function eventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialState(): JapState {
  const today = localDateKey(new Date());
  return {
    date: today,
    count: 0,
    total: 0,
    goal: 108,
    mantraId: MANTRAS[0].id,
    customMantras: [],
    theme: 'saffron',
    vibration: true,
    days: { [today]: { count: 0, goal: 108 } },
    sessions: [],
  };
}

function normalizeState(saved: Partial<JapState>): JapState {
  const initial = createInitialState();
  const days =
    saved.days && typeof saved.days === 'object' ? saved.days : initial.days;
  const customMantras = Array.isArray(saved.customMantras)
    ? saved.customMantras
        .filter(
          (mantra): mantra is Mantra =>
            Boolean(mantra) &&
            typeof mantra === 'object' &&
            typeof mantra.id === 'string' &&
            typeof mantra.devanagari === 'string' &&
            typeof mantra.transliteration === 'string',
        )
        .slice(0, 100)
    : [];
  const goal = GOALS.includes(saved.goal as DailyGoal)
    ? (saved.goal as DailyGoal)
    : initial.goal;
  const mantraId = [...MANTRAS, ...customMantras].some(
    (mantra) => mantra.id === saved.mantraId,
  )
    ? saved.mantraId!
    : initial.mantraId;
  const theme: ThemeName =
    saved.theme === 'saffron' ||
    saved.theme === 'temple' ||
    saved.theme === 'nature' ||
    saved.theme === 'light' ||
    saved.theme === 'dark'
      ? saved.theme
      : initial.theme;
  const state: JapState = {
    ...initial,
    ...saved,
    date: typeof saved.date === 'string' ? saved.date : initial.date,
    count: Math.max(0, Number(saved.count) || 0),
    total: Math.max(0, Number(saved.total) || 0),
    goal,
    mantraId,
    customMantras,
    theme,
    vibration: saved.vibration !== false,
    days,
    sessions: Array.isArray(saved.sessions) ? saved.sessions : [],
  };
  return rollToToday(state);
}

function rollToToday(state: JapState): JapState {
  const today = localDateKey(new Date());
  if (state.date === today) {
    if (state.days[today]) return state;
    return {
      ...state,
      days: { ...state.days, [today]: { count: 0, goal: state.goal } },
    };
  }

  const remainder = state.count % 108;
  const sessions =
    remainder > 0
      ? [
          ...state.sessions,
          {
            id: eventId(),
            date: state.date,
            at: new Date().toISOString(),
            count: remainder,
            mantraId: state.mantraId,
            mantraName:
              [...MANTRAS, ...state.customMantras].find(
                (mantra) => mantra.id === state.mantraId,
              )?.transliteration ?? 'Jap session',
            kind: 'partial' as const,
          },
        ].slice(-700)
      : state.sessions;
  return {
    ...state,
    date: today,
    count: 0,
    sessions,
    days: {
      ...state.days,
      [today]: state.days[today] ?? { count: 0, goal: state.goal },
    },
  };
}

export function JapProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<JapState>(createInitialState);
  const stateRef = useRef(state);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const retryLoad = useCallback(async () => {
    setStorageError(null);
    setIsLoaded(false);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const restored = stored
        ? normalizeState(JSON.parse(stored) as Partial<JapState>)
        : createInitialState();
      stateRef.current = restored;
      setState(restored);
    } catch {
      setStorageError(
        'Saved practice data could not be opened. Your existing data has not been changed.',
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void retryLoad();
  }, [retryLoad]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      setStorageError('Changes could not be saved on this device.');
    });
  }, [isLoaded, state]);

  const commit = useCallback(
    (update: (current: JapState) => JapState) => {
      const next = update(stateRef.current);
      stateRef.current = next;
      setState(next);
      return next;
    },
    [],
  );

  const tap = useCallback((): TapResult => {
    let result: TapResult = { roundCompleted: false, goalCompleted: false };
    commit((currentState) => {
      const current = rollToToday(currentState);
      const previousDay =
        current.days[current.date] ?? { count: 0, goal: current.goal };
      const nextCount = current.count + 1;
      const nextDayCount = previousDay.count + 1;
      const roundCompleted = nextCount % 108 === 0;
      const goalCompleted =
        previousDay.count < previousDay.goal &&
        nextDayCount >= previousDay.goal;
      result = { roundCompleted, goalCompleted };
      const sessions = roundCompleted
        ? [
            ...current.sessions,
            {
              id: eventId(),
              date: current.date,
              at: new Date().toISOString(),
              count: 108,
              mantraId: current.mantraId,
              mantraName:
                [...MANTRAS, ...current.customMantras].find(
                  (mantra) => mantra.id === current.mantraId,
                )?.transliteration ?? 'Jap session',
              kind: 'mala' as const,
            },
          ].slice(-700)
        : current.sessions;
      return {
        ...current,
        count: nextCount,
        total: current.total + 1,
        sessions,
        days: {
          ...current.days,
          [current.date]: { ...previousDay, count: nextDayCount },
        },
      };
    });
    return result;
  }, [commit]);

  const undo = useCallback((): boolean => {
    let changed = false;
    commit((currentState) => {
      const current = rollToToday(currentState);
      if (current.count <= 0) return current;
      changed = true;
      const previousDay =
        current.days[current.date] ?? { count: 0, goal: current.goal };
      const nextCount = current.count - 1;
      let sessions = current.sessions;
      if (current.count % 108 === 0) {
        const latestRound = sessions.findLastIndex(
          (session) =>
            session.kind === 'mala' && session.date === current.date,
        );
        if (latestRound >= 0) {
          sessions = sessions.filter((_, index) => index !== latestRound);
        }
      }
      return {
        ...current,
        count: nextCount,
        total: Math.max(0, current.total - 1),
        sessions,
        days: {
          ...current.days,
          [current.date]: {
            ...previousDay,
            count: Math.max(0, previousDay.count - 1),
          },
        },
      };
    });
    return changed;
  }, [commit]);

  const resetSession = useCallback((): boolean => {
    let changed = false;
    commit((currentState) => {
      const current = rollToToday(currentState);
      if (current.count <= 0) return current;
      changed = true;
      const remainder = current.count % 108;
      const sessions =
        remainder > 0
          ? [
              ...current.sessions,
              {
                id: eventId(),
                date: current.date,
                at: new Date().toISOString(),
                count: remainder,
                mantraId: current.mantraId,
                mantraName:
                  [...MANTRAS, ...current.customMantras].find(
                    (mantra) => mantra.id === current.mantraId,
                  )?.transliteration ?? 'Jap session',
                kind: 'partial' as const,
              },
            ].slice(-700)
          : current.sessions;
      return { ...current, count: 0, sessions };
    });
    return changed;
  }, [commit]);

  const setGoal = useCallback(
    (goal: DailyGoal) => {
      commit((currentState) => {
        const current = rollToToday(currentState);
        const today = current.days[current.date] ?? { count: 0, goal };
        return {
          ...current,
          goal,
          days: { ...current.days, [current.date]: { ...today, goal } },
        };
      });
    },
    [commit],
  );

  const setMantra = useCallback(
    (mantraId: string) => {
      commit((current) => {
        if (
          ![...MANTRAS, ...current.customMantras].some(
            (mantra) => mantra.id === mantraId,
          )
        ) {
          return current;
        }
        return { ...rollToToday(current), mantraId };
      });
    },
    [commit],
  );

  const addMantra = useCallback(
    (name: string, sacredText: string): string | null => {
      const trimmedName = name.trim();
      const trimmedText = sacredText.trim();
      if (!trimmedName || trimmedName.length > 72 || trimmedText.length > 140) {
        return null;
      }

      let createdId: string | null = null;
      commit((current) => {
        const nameKey = trimmedName.toLocaleLowerCase();
        const alreadyExists = [...MANTRAS, ...current.customMantras].some(
          (mantra) => mantra.transliteration.toLocaleLowerCase() === nameKey,
        );
        if (alreadyExists || current.customMantras.length >= 100) return current;

        const mantra: Mantra = {
          id: `personal-${eventId()}`,
          devanagari: trimmedText,
          transliteration: trimmedName,
        };
        createdId = mantra.id;
        return {
          ...current,
          mantraId: mantra.id,
          customMantras: [...current.customMantras, mantra],
        };
      });
      return createdId;
    },
    [commit],
  );

  const removeMantra = useCallback(
    (mantraId: string) => {
      commit((current) => {
        if (!current.customMantras.some((mantra) => mantra.id === mantraId)) {
          return current;
        }
        return {
          ...current,
          mantraId:
            current.mantraId === mantraId ? MANTRAS[0].id : current.mantraId,
          customMantras: current.customMantras.filter(
            (mantra) => mantra.id !== mantraId,
          ),
        };
      });
    },
    [commit],
  );

  const setTheme = useCallback(
    (theme: ThemeName) => {
      commit((current) => ({ ...current, theme }));
    },
    [commit],
  );

  const setVibration = useCallback(
    (vibration: boolean) => {
      commit((current) => ({ ...current, vibration }));
    },
    [commit],
  );

  const clearAllData = useCallback(() => {
    const fresh = createInitialState();
    stateRef.current = fresh;
    setState(fresh);
    setStorageError(null);
  }, []);

  const colors = useColors(state.theme);
  const value = useMemo<JapContextValue>(
    () => ({
      state,
      colors,
      isLoaded,
      storageError,
      tap,
      undo,
      resetSession,
      setGoal,
      setMantra,
      addMantra,
      removeMantra,
      setTheme,
      setVibration,
      clearAllData,
      retryLoad,
    }),
    [
      state,
      colors,
      isLoaded,
      storageError,
      tap,
      undo,
      resetSession,
      setGoal,
      setMantra,
      addMantra,
      removeMantra,
      setTheme,
      setVibration,
      clearAllData,
      retryLoad,
    ],
  );

  return <JapContext.Provider value={value}>{children}</JapContext.Provider>;
}

export function useJap(): JapContextValue {
  const context = useContext(JapContext);
  if (!context) throw new Error('useJap must be used inside JapProvider');
  return context;
}
