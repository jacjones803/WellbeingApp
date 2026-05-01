# WellbeingApp Project Memory

## Project
CM3203 Individual Project — "Mobile Application for Personal Health, Wellbeing, and Goal Tracking"
Student: 3rd year CS student on Windows 11

## Tech Stack
- Expo (SDK ~54) + React Native 0.81.5 + TypeScript
- Expo Router (file-based routing)
- AsyncStorage for persistence (@react-native-async-storage/async-storage)
- @expo/vector-icons (Ionicons) for icons
- NO external chart library — custom bar/line charts using React Native Views

## Project Location
C:/Users/Jacjo/OneDrive/Desktop/computerscience/Year 3/CM3203 - Individual Project/WellbeingApp/

## Architecture
- types/index.ts — all TypeScript interfaces
- context/AppContext.tsx — global state, AsyncStorage persistence, XP/streak/achievement logic
- constants/theme.ts — colour palette (Colors object)
- app/_layout.tsx — root layout with AppProvider, registers mood/goals as modal stack screens
- app/(tabs)/_layout.tsx — 5-tab layout (Dashboard, Health, Habits, Tasks, Profile)

## Screens
- app/(tabs)/index.tsx — Dashboard
- app/(tabs)/health.tsx — Health Tracking (water, sleep, exercise, weight)
- app/(tabs)/habits.tsx — Habit Tracking (7-day grid tracker)
- app/(tabs)/tasks.tsx — Task Management (priority, filter tabs)
- app/(tabs)/profile.tsx — Profile & Stats, Achievements
- app/mood.tsx — Mood Tracking (modal screen, navigated from Dashboard)
- app/goals.tsx — Goal Tracking (modal screen, navigated from Dashboard)

## Gamification System
- XP: health=50, mood=30, task=40, habit=20, milestone=50, goal=200
- Level = floor(xp / 1000) + 1
- Streak: consecutive days of any activity
- 6 achievements: first_steps, hydration_hero, streak_master, goal_getter, habit_builder, task_master

## Colours (constants/theme.ts)
primary=#7C3AED, blue=#3B82F6, green=#10B981, orange=#F97316,
red=#EF4444, yellow=#F59E0B, pink=#EC4899, background=#F5F3FF

## Status
Full app built and written to disk. User needs to:
1. Run: npx expo install @react-native-async-storage/async-storage
2. Run: npx expo start
3. Scan QR with Expo Go on iPhone
