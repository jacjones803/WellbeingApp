export interface HealthEntry {
  id: string;
  date: string;
  waterIntake: number;
  sleepHours: number;
  exerciseMinutes: number;
  weight?: number;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: 'excellent' | 'good' | 'okay' | 'bad' | 'terrible';
  note?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetDays: number;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AppTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  subTasks: SubTask[];
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'health' | 'fitness' | 'personal' | 'career' | 'education' | 'mental' | 'financial' | 'social' | 'creative' | 'travel' | 'other';
  targetDate: string;
  progress: number;
  createdAt: string;
  milestones: Milestone[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  progress: number;
  unlockedAt?: string;
}

export interface UserStats {
  xp: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  achievements: Achievement[];
}
