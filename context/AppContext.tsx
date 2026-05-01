import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HealthEntry, MoodEntry, Habit, HabitLog,
  AppTask, SubTask, Goal, Achievement, UserStats,
} from '../types';
import { Colors, DarkColors, ColorScheme } from '../constants/theme';

const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const getToday = () => new Date().toISOString().split('T')[0];

export const getEffectiveTodayFor = (dayStartHour: number): string => {
  const now = new Date();
  if (now.getHours() < dayStartHour) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Health
  { id: 'first_steps',     title: 'First Steps',     description: 'Log your first health entry',       icon: '👣', requirement: 1,   progress: 0 },
  { id: 'hydration_hero',  title: 'Hydration Hero',  description: 'Drink 2L of water in a day',         icon: '💧', requirement: 1,   progress: 0 },
  { id: 'health_streak',   title: 'Health Tracker',  description: 'Log health data 7 times',            icon: '🩺', requirement: 7,   progress: 0 },
  { id: 'health_devotee',  title: 'Health Devotee',  description: 'Log health data 30 times',           icon: '❤️', requirement: 30,  progress: 0 },
  // Mood
  { id: 'mood_logger',     title: 'Mood Logger',     description: 'Log your first mood entry',          icon: '😊', requirement: 1,   progress: 0 },
  { id: 'mood_master',     title: 'Mood Master',     description: 'Log your mood 30 times',             icon: '🧠', requirement: 30,  progress: 0 },
  // Streaks
  { id: 'streak_master',   title: 'Streak Master',   description: 'Maintain a 7-day activity streak',   icon: '🔥', requirement: 7,   progress: 0 },
  { id: 'streak_warrior',  title: 'Streak Warrior',  description: 'Maintain a 14-day activity streak',  icon: '⚡', requirement: 14,  progress: 0 },
  { id: 'streak_legend',   title: 'Streak Legend',   description: 'Maintain a 30-day activity streak',  icon: '🏆', requirement: 30,  progress: 0 },
  // Goals
  { id: 'goal_getter',     title: 'Goal Getter',     description: 'Complete your first goal',            icon: '🎯', requirement: 1,   progress: 0 },
  { id: 'goal_crusher',    title: 'Goal Crusher',    description: 'Complete 3 goals',                    icon: '🚀', requirement: 3,   progress: 0 },
  // Habits
  { id: 'habit_creator',   title: 'Habit Creator',   description: 'Create 3 habits',                    icon: '🌱', requirement: 3,   progress: 0 },
  { id: 'habit_builder',   title: 'Habit Builder',   description: 'Complete 30 habit check-ins',        icon: '✅', requirement: 30,  progress: 0 },
  { id: 'habit_master',    title: 'Habit Master',    description: 'Complete 100 habit check-ins',       icon: '💪', requirement: 100, progress: 0 },
  // Tasks
  { id: 'task_master',     title: 'Task Master',     description: 'Complete 10 tasks',                  icon: '📋', requirement: 10,  progress: 0 },
  { id: 'task_finisher',   title: 'Task Finisher',   description: 'Complete 25 tasks',                  icon: '📌', requirement: 25,  progress: 0 },
  { id: 'task_legend',     title: 'Task Legend',     description: 'Complete 50 tasks',                  icon: '⭐', requirement: 50,  progress: 0 },
  // Level
  { id: 'level_up',        title: 'Level Up!',       description: 'Reach Level 5',                      icon: '🌟', requirement: 1,   progress: 0 },
];

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Morning Meditation', icon: '🧘', color: '#7C3AED', frequency: 'daily', targetDays: 7, createdAt: getToday() },
  { id: 'h2', name: 'Read 30 Minutes',   icon: '📖', color: '#3B82F6', frequency: 'daily', targetDays: 7, createdAt: getToday() },
  { id: 'h3', name: 'Exercise',          icon: '🏋️', color: '#10B981', frequency: 'daily', targetDays: 5, createdAt: getToday() },
];

const DEFAULT_STATS: UserStats = {
  xp: 0,
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: '',
  achievements: DEFAULT_ACHIEVEMENTS,
};

export interface HealthTargets {
  water:    number; // ml
  sleep:    number; // hours
  exercise: number; // minutes
}

const DEFAULT_HEALTH_TARGETS: HealthTargets = { water: 2000, sleep: 8, exercise: 30 };

export interface AccessibilitySettings {
  fontSize:      'normal' | 'large' | 'xlarge';
  highContrast:  boolean;
  boldText:      boolean;
  reduceMotion:  boolean;
  darkMode:      boolean;
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  fontSize:     'normal',
  highContrast: false,
  boldText:     false,
  reduceMotion: false,
  darkMode:     false,
};

// Returns a font size scaled by the user's preference
export function scaleFontSize(base: number, fontSize: AccessibilitySettings['fontSize']): number {
  if (fontSize === 'large')  return Math.round(base * 1.2);
  if (fontSize === 'xlarge') return Math.round(base * 1.4);
  return base;
}

interface AppContextType {
  healthEntries: HealthEntry[];
  moodEntries: MoodEntry[];
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: AppTask[];
  goals: Goal[];
  userStats: UserStats;
  userName: string;

  addHealthEntry: (data: Omit<HealthEntry, 'id'>) => void;
  updateHealthEntry: (id: string, data: Partial<HealthEntry>) => void;

  addMoodEntry: (data: Omit<MoodEntry, 'id'>) => void;
  updateMoodEntry: (id: string, data: Partial<MoodEntry>) => void;

  addHabit: (data: Omit<Habit, 'id' | 'createdAt'>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (habitId: string, date: string) => void;

  addTask: (data: Omit<AppTask, 'id' | 'createdAt' | 'subTasks'>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addSubTask: (taskId: string, title: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;

  addGoal: (data: Omit<Goal, 'id' | 'createdAt' | 'milestones' | 'progress'>) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: (id: string, progress: number) => void;
  addMilestone: (goalId: string, title: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  getTodayHealthEntry: () => HealthEntry | undefined;
  getTodayMoodEntry: () => MoodEntry | undefined;
  getTodayHabitStats: () => { completed: number; total: number };
  getHabitWeekLogs: (habitId: string) => { date: string; completed: boolean }[];
  getLevel: () => number;
  getXpToNextLevel: () => number;
  getEffectiveStreak: () => number;

  accessibility: AccessibilitySettings;
  setAccessibility: (patch: Partial<AccessibilitySettings>) => void;

  healthTargets: HealthTargets;
  setHealthTargets: (targets: HealthTargets) => void;

  dayStartHour: number;
  setDayStartHour: (hour: number) => void;
  getEffectiveToday: () => string;

  setUserName: (name: string) => void;
  clearHealthData: () => void;
  clearMoodData: () => void;
  clearHabitsData: () => void;
  clearTasksData: () => void;
  clearGoalsData: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS);
  const [userName, setUserNameState] = useState('');
  const [accessibility, setAccessibilityState] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const [healthTargets, setHealthTargetsState] = useState<HealthTargets>(DEFAULT_HEALTH_TARGETS);
  const [dayStartHour, setDayStartHourState] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const getEffectiveToday = () => getEffectiveTodayFor(dayStartHour);

  // Load saved data on startup
  useEffect(() => {
    (async () => {
      try {
        const keys = ['health', 'mood', 'habits', 'habitLogs', 'tasks', 'goals', 'stats', 'userName', 'accessibility', 'healthTargets', 'dayStartHour'];
        const results = await AsyncStorage.multiGet(keys.map(k => `@wb_${k}`));
        const data: Record<string, any> = {};
        results.forEach(([key, value]) => { if (value) data[key] = JSON.parse(value); });

        if (data['@wb_health']) setHealthEntries(data['@wb_health']);
        if (data['@wb_mood']) setMoodEntries(data['@wb_mood']);
        if (data['@wb_habits']) setHabits(data['@wb_habits']);
        if (data['@wb_habitLogs']) setHabitLogs(data['@wb_habitLogs']);
        if (data['@wb_tasks']) setTasks(data['@wb_tasks'].map((t: any) => ({ ...t, subTasks: t.subTasks ?? [] })));
        if (data['@wb_goals']) setGoals(data['@wb_goals']);
        if (data['@wb_stats']) setUserStats({
          ...DEFAULT_STATS,
          ...data['@wb_stats'],
          achievements: DEFAULT_ACHIEVEMENTS.map(def => {
            const saved = data['@wb_stats'].achievements?.find((a: any) => a.id === def.id);
            return saved ? { ...def, ...saved } : def;
          }),
        });
        if (data['@wb_userName'])       setUserNameState(data['@wb_userName']);
        if (data['@wb_accessibility'])  setAccessibilityState({ ...DEFAULT_ACCESSIBILITY, ...data['@wb_accessibility'] });
        if (data['@wb_healthTargets'])  setHealthTargetsState({ ...DEFAULT_HEALTH_TARGETS, ...data['@wb_healthTargets'] });
        if (data['@wb_dayStartHour'] != null) setDayStartHourState(data['@wb_dayStartHour']);
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist state changes to AsyncStorage
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_health', JSON.stringify(healthEntries)); }, [healthEntries, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_mood', JSON.stringify(moodEntries)); }, [moodEntries, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_habits', JSON.stringify(habits)); }, [habits, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_habitLogs', JSON.stringify(habitLogs)); }, [habitLogs, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_tasks', JSON.stringify(tasks)); }, [tasks, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_goals', JSON.stringify(goals)); }, [goals, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_stats', JSON.stringify(userStats)); }, [userStats, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_userName',       JSON.stringify(userName));       }, [userName, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_accessibility',  JSON.stringify(accessibility));  }, [accessibility, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_healthTargets',  JSON.stringify(healthTargets));  }, [healthTargets, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem('@wb_dayStartHour', JSON.stringify(dayStartHour)); }, [dayStartHour, loaded]);

  const awardXP = (amount: number) => {
    const today = getEffectiveToday();
    setUserStats(prev => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = prev.lastActivityDate === today
        ? prev.currentStreak
        : prev.lastActivityDate === yesterday
          ? prev.currentStreak + 1
          : 1;
      const longest = Math.max(newStreak, prev.longestStreak);
      return {
        ...prev,
        xp: prev.xp + amount,
        totalPoints: prev.totalPoints + amount,
        currentStreak: newStreak,
        longestStreak: longest,
        lastActivityDate: today,
      };
    });
  };

  const checkAchievement = (id: string, progress: number) => {
    setUserStats(prev => ({
      ...prev,
      achievements: prev.achievements.map(a =>
        a.id === id
          ? {
              ...a,
              progress: Math.max(a.progress, progress),
              unlockedAt: !a.unlockedAt && progress >= a.requirement ? getToday() : a.unlockedAt,
            }
          : a
      ),
    }));
  };

  const addHealthEntry = (data: Omit<HealthEntry, 'id'>) => {
    const entry: HealthEntry = { ...data, id: genId() };
    setHealthEntries(prev => [...prev, entry]);
    awardXP(50);
    const totalHealth = healthEntries.length + 1;
    checkAchievement('first_steps', 1);
    checkAchievement('health_streak', totalHealth);
    checkAchievement('health_devotee', totalHealth);
    if (data.waterIntake >= 2000) checkAchievement('hydration_hero', 1);
  };

  const updateHealthEntry = (id: string, data: Partial<HealthEntry>) => {
    setHealthEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    if (data.waterIntake && data.waterIntake >= 2000) checkAchievement('hydration_hero', 1);
  };

  const addMoodEntry = (data: Omit<MoodEntry, 'id'>) => {
    const entry: MoodEntry = { ...data, id: genId() };
    setMoodEntries(prev => [...prev, entry]);
    awardXP(30);
    const totalMood = moodEntries.length + 1;
    checkAchievement('mood_logger', 1);
    checkAchievement('mood_master', totalMood);
  };

  const updateMoodEntry = (id: string, data: Partial<MoodEntry>) => {
    setMoodEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const addHabit = (data: Omit<Habit, 'id' | 'createdAt'>) => {
    setHabits(prev => [...prev, { ...data, id: genId(), createdAt: getToday() }]);
    checkAchievement('habit_creator', habits.length + 1);
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitLogs(prev => prev.filter(l => l.habitId !== id));
  };

  const toggleHabitLog = (habitId: string, date: string) => {
    setHabitLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        if (!existing.completed) awardXP(20);
        return prev.map(l =>
          l.habitId === habitId && l.date === date
            ? { ...l, completed: !l.completed }
            : l
        );
      }
      awardXP(20);
      const totalCompleted = prev.filter(l => l.completed).length + 1;
      checkAchievement('habit_builder', totalCompleted);
      checkAchievement('habit_master', totalCompleted);
      return [...prev, { habitId, date, completed: true }];
    });
  };

  const addTask = (data: Omit<AppTask, 'id' | 'createdAt' | 'subTasks'>) => {
    setTasks(prev => [...prev, { ...data, id: genId(), createdAt: getToday(), subTasks: [] }]);
  };

  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? getEffectiveToday() : undefined } : t
      );
      const task = updated.find(t => t.id === id);
      if (task?.completed) {
        awardXP(40);
        const completedCount = updated.filter(t => t.completed).length;
        checkAchievement('task_master', completedCount);
        checkAchievement('task_finisher', completedCount);
        checkAchievement('task_legend', completedCount);
      }
      return updated;
    });
  };

  const addSubTask = (taskId: string, title: string) => {
    const newSubTask: SubTask = { id: genId(), title, completed: false };
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, subTasks: [...t.subTasks, newSubTask] } : t
    ));
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subTasks: t.subTasks.map(s =>
          s.id === subTaskId ? { ...s, completed: !s.completed } : s
        ),
      };
    }));
  };

  const deleteSubTask = (taskId: string, subTaskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, subTasks: t.subTasks.filter(s => s.id !== subTaskId) } : t
    ));
  };

  const addGoal = (data: Omit<Goal, 'id' | 'createdAt' | 'milestones' | 'progress'>) => {
    setGoals(prev => [...prev, { ...data, id: genId(), createdAt: getToday(), milestones: [], progress: 0 }]);
  };

  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const updateGoalProgress = (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g));
    if (progress >= 100) {
      awardXP(200);
      const completedCount = goals.filter(g => g.progress >= 100).length + 1;
      checkAchievement('goal_getter', completedCount);
      checkAchievement('goal_crusher', completedCount);
    }
  };

  const addMilestone = (goalId: string, title: string) => {
    setGoals(prev => prev.map(g =>
      g.id === goalId
        ? { ...g, milestones: [...g.milestones, { id: genId(), title, completed: false }] }
        : g
    ));
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const milestones = g.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completed = milestones.filter(m => m.completed).length;
      const progress = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : g.progress;
      if (milestones.find(m => m.id === milestoneId)?.completed === false) awardXP(50);
      return { ...g, milestones, progress };
    }));
  };

  const setUserName = (name: string) => setUserNameState(name);
  const setAccessibility = (patch: Partial<AccessibilitySettings>) =>
    setAccessibilityState(prev => ({ ...prev, ...patch }));
  const setHealthTargets = (targets: HealthTargets) => setHealthTargetsState(targets);
  const setDayStartHour = (hour: number) => setDayStartHourState(hour);

  const clearHealthData  = () => setHealthEntries([]);
  const clearMoodData    = () => setMoodEntries([]);
  const clearHabitsData  = () => { setHabits([]); setHabitLogs([]); };
  const clearTasksData   = () => setTasks([]);
  const clearGoalsData   = () => setGoals([]);

  const clearAllData = async () => {
    setHealthEntries([]);
    setMoodEntries([]);
    setHabits(DEFAULT_HABITS);
    setHabitLogs([]);
    setTasks([]);
    setGoals([]);
    setUserStats(DEFAULT_STATS);
    setUserNameState('');
    try {
      await AsyncStorage.multiRemove([
        '@wb_health', '@wb_mood', '@wb_habits', '@wb_habitLogs',
        '@wb_tasks', '@wb_goals', '@wb_stats', '@wb_userName',
      ]);
    } catch (e) {
      console.error('Failed to clear data', e);
    }
  };

  const getTodayHealthEntry = () => healthEntries.find(e => e.date === getEffectiveToday());
  const getTodayMoodEntry = () => moodEntries.find(e => e.date === getEffectiveToday());

  const getTodayHabitStats = () => {
    const today = getEffectiveToday();
    const completed = habitLogs.filter(l => l.date === today && l.completed).length;
    return { completed, total: habits.length };
  };

  const getHabitWeekLogs = (habitId: string) => {
    const todayDate = new Date(getEffectiveToday() + 'T12:00:00');
    const dayOfWeek = (todayDate.getDay() + 6) % 7; // Mon=0 … Sun=6
    const monday = new Date(todayDate);
    monday.setDate(todayDate.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const date = d.toISOString().split('T')[0];
      const log = habitLogs.find(l => l.habitId === habitId && l.date === date);
      return { date, completed: log?.completed ?? false };
    });
  };

  const getLevel = () => Math.floor(userStats.xp / 1000) + 1;
  const getXpToNextLevel = () => userStats.xp % 1000;

  // Returns 0 if the user missed yesterday — streak has broken
  const getEffectiveStreak = () => {
    const today = getEffectiveToday();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const last = userStats.lastActivityDate;
    if (last === today || last === yesterday) return userStats.currentStreak;
    return 0;
  };

  useEffect(() => {
    checkAchievement('streak_master', userStats.currentStreak);
    checkAchievement('streak_warrior', userStats.currentStreak);
    checkAchievement('streak_legend', userStats.currentStreak);
  }, [userStats.currentStreak]);

  useEffect(() => {
    if (userStats.xp >= 4000) checkAchievement('level_up', 1);
  }, [userStats.xp]);

  if (!loaded) return null;

  return (
    <AppContext.Provider value={{
      healthEntries, moodEntries, habits, habitLogs, tasks, goals, userStats, userName, accessibility, healthTargets,
      addHealthEntry, updateHealthEntry,
      addMoodEntry, updateMoodEntry,
      addHabit, deleteHabit, toggleHabitLog,
      addTask, deleteTask, toggleTask, addSubTask, toggleSubTask, deleteSubTask,
      addGoal, deleteGoal, updateGoalProgress, addMilestone, toggleMilestone,
      getTodayHealthEntry, getTodayMoodEntry, getTodayHabitStats,
      getHabitWeekLogs, getLevel, getXpToNextLevel, getEffectiveStreak,
      getEffectiveToday,
      accessibility, setAccessibility,
      healthTargets, setHealthTargets,
      dayStartHour, setDayStartHour,
      setUserName, clearHealthData, clearMoodData, clearHabitsData,
      clearTasksData, clearGoalsData, clearAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// Convenience hook — gives accessibility settings + a font-size scaler
export const useAccessibility = () => {
  const { accessibility, setAccessibility } = useApp();
  const fs = (base: number) => scaleFontSize(base, accessibility.fontSize);
  return { ...accessibility, setAccessibility, fs };
};

// Returns the correct colour palette based on the user's dark mode preference
export const useColors = (): ColorScheme => {
  const { accessibility } = useApp();
  return accessibility.darkMode ? DarkColors : Colors;
};
