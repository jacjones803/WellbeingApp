import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../../context/AppContext';
import { ColorScheme } from '../../constants/theme';
import AISuggestionsCard from '../../components/AISuggestionsCard';

const MOOD_COLOR: Record<string, string> = {
  excellent: '#10B981', good: '#3B82F6', okay: '#F59E0B', bad: '#F97316', terrible: '#EF4444',
};

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const timeGreeting =
    hour >= 5  && hour < 12 ? 'Good morning' :
    hour >= 12 && hour < 17 ? 'Good afternoon' :
    hour >= 17 && hour < 21 ? 'Good evening' : 'Good night';
  return name ? `${timeGreeting}, ${name}! 👋` : `${timeGreeting}! 👋`;
}

const getToday = () => new Date().toISOString().split('T')[0];

export default function DashboardScreen() {
  const router = useRouter();
  const {
    userStats, getTodayHealthEntry, getTodayMoodEntry,
    getTodayHabitStats, tasks, goals, getLevel, getXpToNextLevel,
    getEffectiveStreak, userName, getEffectiveToday,
  } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const level = getLevel();
  const xpProgress = getXpToNextLevel();
  const streak = getEffectiveStreak();
  const todayHealth = getTodayHealthEntry();
  const todayMood = getTodayMoodEntry();
  const habitStats = getTodayHabitStats();
  const activeGoals = goals.filter(g => g.progress < 100).length;
  const recentAchievements = userStats.achievements.filter(a => a.unlockedAt).slice(-3);

  // Today's completion
  const today = getEffectiveToday();
  const completionItems: { label: string; done: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; route: string }[] = [
    { label: 'Mood',    done: !!todayMood,                                                route: '/mood',           icon: 'happy-outline'          },
    { label: 'Health',  done: !!todayHealth,                                              route: '/(tabs)/health',  icon: 'heart-outline'          },
    { label: 'Habits',  done: habitStats.completed > 0,                                   route: '/(tabs)/habits',  icon: 'checkmark-circle-outline'},
    { label: 'Tasks', done: tasks.some(t => t.completed && t.completedAt === today) || goals.some(g => g.progress > 0), route: '/(tabs)/tasks', icon: 'list-outline' },
  ];
  const completedCount = completionItems.filter(i => i.done).length;
  const completionPct  = (completedCount / completionItems.length) * 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Greeting */}
      <Text style={styles.greeting}>{getGreeting(userName)}</Text>

      {/* Level card */}
      <View style={[styles.card, styles.gradientPurple]}>
        <View style={styles.row}>
          <Ionicons name="trophy" size={28} color="#FFF" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cardLabel}>Level {level}</Text>
            <Text style={styles.cardSub}>Keep going — you're doing great!</Text>
          </View>
          <Text style={styles.bigNumber}>{level}</Text>
        </View>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${(xpProgress / 1000) * 100}%` }]} />
        </View>
        <Text style={styles.xpText}>{xpProgress} / 1000 XP to Level {level + 1}</Text>
      </View>

      {/* Streak card */}
      <View style={[styles.card, styles.gradientOrange]}>
        <View style={styles.row}>
          <Text style={{ fontSize: 28 }}>🔥</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cardLabel}>Current Streak</Text>
            <Text style={styles.cardSub}>
              {streak === 0 ? 'Log today to start your streak!' :
               streak === 1 ? 'Great start — come back tomorrow!' :
               streak < 5  ? 'Building momentum, keep going!' :
               streak < 10 ? 'Solid streak, stay consistent!' :
               streak < 30 ? "You're on fire, don't break it!" :
                              'Incredible dedication — legendary!'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bigNumber}>{streak}</Text>
            <Text style={styles.cardSub}>Best: {userStats.longestStreak}</Text>
          </View>
        </View>
      </View>

      {/* Today's completion */}
      <View style={styles.completionCard}>
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Today's Progress</Text>
          <Text style={styles.completionCount}>{completedCount}/{completionItems.length} done</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
        </View>
        <View style={styles.completionBadges}>
          {completionItems.map(item => (
            <TouchableOpacity
              key={item.label}
              style={[styles.completionBadge, item.done && styles.completionBadgeDone]}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons name={item.icon} size={13} color={item.done ? Colors.primary : Colors.subtext} />
              <Text numberOfLines={1} style={[styles.completionBadgeText, item.done && styles.completionBadgeTextDone]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's Stats */}
      <Text style={styles.sectionTitle}>Today's Stats</Text>
      <View style={styles.grid2}>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.blue + '20' }]} onPress={() => router.push('/(tabs)/health' as any)}>
          <Ionicons name="water" size={22} color={Colors.blue} />
          <Text style={styles.statValue}>{todayHealth ? `${todayHealth.waterIntake}ml` : '—'}</Text>
          <Text style={styles.statLabel}>Water</Text>
          {!todayHealth && <Text style={styles.statHint}>Tap to log</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.green + '20' }]} onPress={() => router.push('/(tabs)/health' as any)}>
          <Ionicons name="barbell" size={22} color={Colors.green} />
          <Text style={styles.statValue}>{todayHealth ? `${todayHealth.exerciseMinutes}min` : '—'}</Text>
          <Text style={styles.statLabel}>Exercise</Text>
          {!todayHealth && <Text style={styles.statHint}>Tap to log</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, { backgroundColor: Colors.primary + '20' }]} onPress={() => router.push('/(tabs)/health' as any)}>
          <Ionicons name="moon" size={22} color={Colors.primary} />
          <Text style={styles.statValue}>{todayHealth ? `${todayHealth.sleepHours}h` : '—'}</Text>
          <Text style={styles.statLabel}>Sleep</Text>
          {!todayHealth && <Text style={styles.statHint}>Tap to log</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: (todayMood ? MOOD_COLOR[todayMood.mood] : Colors.yellow) + '20' }]}
          onPress={() => router.push('/mood' as any)}
        >
          <Ionicons
            name="happy-outline"
            size={22}
            color={todayMood ? MOOD_COLOR[todayMood.mood] : Colors.yellow}
          />
          <Text style={styles.statValue}>{todayMood ? todayMood.mood : '—'}</Text>
          <Text style={styles.statLabel}>Mood</Text>
          {!todayMood && <Text style={styles.statHint}>Tap to log</Text>}
        </TouchableOpacity>
      </View>

      {/* AI Suggestions */}
      <Text style={styles.sectionTitle}>AI Suggestions</Text>
      <AISuggestionsCard />

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {recentAchievements.map(a => (
            <View key={a.id} style={[styles.card, { backgroundColor: Colors.yellow + '20', borderColor: Colors.yellow, borderWidth: 1 }]}>
              <View style={styles.row}>
                <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.achieveTitle}>{a.title}</Text>
                  <Text style={styles.achieveDesc}>{a.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 32 },

  greeting: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },

  // Completion card
  completionCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  completionCount: { fontSize: 13, fontWeight: '700', color: C.primary },
  progressBg: { height: 8, backgroundColor: C.border, borderRadius: 4, marginBottom: 12 },
  progressFill: { height: 8, backgroundColor: C.primary, borderRadius: 4 },
  completionBadges: { flexDirection: 'row', gap: 6 },
  completionBadge: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 2, paddingVertical: 6, paddingHorizontal: 2, borderRadius: 10,
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  completionBadgeDone: { borderColor: C.primary, backgroundColor: C.primary + '15' },
  completionBadgeText: { fontSize: 11, fontWeight: '600', color: C.subtext, flexShrink: 1 },
  completionBadgeTextDone: { color: C.primary },

  // Level / streak cards
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  gradientPurple: { backgroundColor: C.primary },
  gradientOrange: { backgroundColor: C.orange },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardLabel: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bigNumber: { fontSize: 36, fontWeight: '800', color: '#FFF' },
  xpBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 12 },
  xpBarFill: { height: 8, backgroundColor: '#FFF', borderRadius: 4 },
  xpText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  // Stat cards
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 12, color: C.subtext },
  statHint: { fontSize: 10, color: C.primary, fontWeight: '600', marginTop: 2 },

  achieveTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  achieveDesc: { fontSize: 12, color: C.subtext },
});
