import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';
import { getSuggestedTasks, SuggestedTask } from '../services/aiSuggestions';
import { ColorScheme } from '../constants/theme';

export default function AISuggestionsCard() {
  const {
    moodEntries, getTodayHealthEntry, getTodayHabitStats,
    goals, tasks, userStats, addTask,
  } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const PRIORITY_COLOR: Record<string, string> = {
    high: Colors.red,
    medium: Colors.orange,
    low: Colors.green,
  };

  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getSuggestedTasks({
        recentMoods: moodEntries.slice(-7).map(e => ({ date: e.date, mood: e.mood })),
        todayHealth: getTodayHealthEntry() ?? null,
        habitStats: getTodayHabitStats(),
        activeGoals: goals
          .filter(g => g.progress < 100)
          .map(g => ({ title: g.title, category: g.category, progress: g.progress })),
        pendingTaskTitles: tasks.filter(t => !t.completed).map(t => t.title),
        streak: userStats.currentStreak,
      });
      setSuggestions(results);
      setAddedIds(new Set());
    } catch (e: any) {
      setError(e.message ?? 'Failed to get suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (s: SuggestedTask) => {
    addTask({ title: s.title, priority: s.priority, completed: false });
    setAddedIds(prev => new Set(prev).add(s.title));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.title}>AI Suggested Tasks</Text>
        </View>
        <TouchableOpacity onPress={fetchSuggestions} disabled={loading} style={styles.refreshBtn}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Ionicons name="refresh" size={18} color={Colors.primary} />}
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : suggestions.length === 0 && !loading ? (
        <Text style={styles.empty}>Tap the refresh button to get personalised task suggestions.</Text>
      ) : (
        suggestions.map((s, i) => {
          const added = addedIds.has(s.title);
          return (
            <View key={i} style={styles.suggestion}>
              <View style={styles.suggestionLeft}>
                <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[s.priority] + '22' }]}>
                  <Text style={[styles.priorityText, { color: PRIORITY_COLOR[s.priority] }]}>
                    {s.priority}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>{s.title}</Text>
                  <Text style={styles.suggestionReason}>{s.reason}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, added && styles.addedBtn]}
                onPress={() => handleAdd(s)}
                disabled={added}
              >
                <Ionicons name={added ? 'checkmark' : 'add'} size={18} color={added ? Colors.green : Colors.primary} />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '700', color: C.text },
  refreshBtn: { padding: 4 },
  error: { fontSize: 13, color: C.red, textAlign: 'center', paddingVertical: 8 },
  empty: { fontSize: 13, color: C.subtext, textAlign: 'center', paddingVertical: 8 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  suggestionLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1 },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  suggestionTitle: { fontSize: 13, fontWeight: '600', color: C.text, flexWrap: 'wrap' },
  suggestionReason: { fontSize: 11, color: C.subtext, marginTop: 2, flexWrap: 'wrap' },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addedBtn: { backgroundColor: C.green + '20' },
});
