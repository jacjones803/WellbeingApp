import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../../context/AppContext';
import { ColorScheme } from '../../constants/theme';

type MoodLevel = 'excellent' | 'good' | 'okay' | 'bad' | 'terrible';

const MOOD_CONFIG: Record<MoodLevel, { emoji: string; color: string; num: number; label: string }> = {
  excellent: { emoji: '😄', color: '#10B981', num: 5, label: 'Excellent' },
  good:      { emoji: '😊', color: '#3B82F6', num: 4, label: 'Good'      },
  okay:      { emoji: '😐', color: '#F59E0B', num: 3, label: 'Okay'      },
  bad:       { emoji: '😟', color: '#F97316', num: 2, label: 'Bad'       },
  terrible:  { emoji: '😢', color: '#EF4444', num: 1, label: 'Terrible'  },
};

const DAY_LABELS   = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HEAT_COLORS  = ['transparent', '#4ade80', '#22c55e', '#16a34a', '#14532d'] as const;
const HEAT_LABELS  = ['None', 'Some', 'Good', 'Great', 'All'] as const;

export default function InsightsScreen() {
  const {
    healthEntries, moodEntries, habits, habitLogs,
    tasks, goals, healthTargets, getEffectiveToday,
  } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay,    setSelectedDay]    = useState<string | null>(null);
  const [expandedPanel,  setExpandedPanel]  = useState<'mood' | 'health' | 'habits' | 'tasks' | null>(null);

  const today      = getEffectiveToday();
  const dayOfWeek  = (now.getDay() + 6) % 7;
  const monday     = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  const thisWeekStart = monday.toISOString().split('T')[0];

  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const moodWeek     = last7Dates.map(date => moodEntries.find(e => e.date === date) ?? null);
  const moodWithData = moodWeek.filter(Boolean);
  const avgMoodNum   = moodWithData.length > 0
    ? moodWithData.reduce((s, e) => s + MOOD_CONFIG[e!.mood as MoodLevel].num, 0) / moodWithData.length
    : 0;
  const avgMoodLabel =
    avgMoodNum >= 4.5 ? 'Excellent' : avgMoodNum >= 3.5 ? 'Good' :
    avgMoodNum >= 2.5 ? 'Okay'      : avgMoodNum >= 1.5 ? 'Bad'  :
    avgMoodNum > 0   ? 'Terrible'   : 'No data';
  const avgMoodColor =
    avgMoodNum >= 4.5 ? '#10B981' : avgMoodNum >= 3.5 ? '#3B82F6' :
    avgMoodNum >= 2.5 ? '#F59E0B' : avgMoodNum >= 1.5 ? '#F97316' :
    avgMoodNum > 0   ? '#EF4444'  : Colors.subtext;

  const healthWeek     = last7Dates.map(date => healthEntries.find(e => e.date === date) ?? null);
  const healthWithData = healthWeek.filter(Boolean);
  const hCount         = Math.max(healthWithData.length, 1);
  const avgWater       = healthWithData.length > 0 ? healthWithData.reduce((s, e) => s + (e?.waterIntake ?? 0), 0) / hCount : 0;
  const avgSleep       = healthWithData.length > 0 ? healthWithData.reduce((s, e) => s + (e?.sleepHours ?? 0), 0) / hCount : 0;
  const avgExercise    = healthWithData.length > 0 ? healthWithData.reduce((s, e) => s + (e?.exerciseMinutes ?? 0), 0) / hCount : 0;

  const healthAvgs = {
    water:    Math.round(avgWater),
    sleep:    Math.round(avgSleep * 10) / 10,
    exercise: Math.round(avgExercise),
  };

  const habitsThisWeek = habitLogs.filter(l => l.date >= thisWeekStart && l.completed).length;
  const possibleChecks = habits.length * 7;
  const habitPct       = possibleChecks > 0 ? Math.round((habitsThisWeek / possibleChecks) * 100) : 0;

  const habitStats = habits.map(h => {
    const completed = habitLogs.filter(l => l.habitId === h.id && l.date >= thisWeekStart && l.completed).length;
    return { ...h, completed, pct: Math.round((completed / 7) * 100) };
  }).sort((a, b) => b.pct - a.pct);

  const tasksThisWeek = tasks.filter(t => t.completedAt && t.completedAt >= thisWeekStart).length;

  const activeGoals = goals.filter(g => g.progress < 100);

  const getDayScore = (dateStr: string): number => {
    const moodLogged    = moodEntries.some(e => e.date === dateStr) ? 1 : 0;
    const healthLogged  = healthEntries.some(e => e.date === dateStr) ? 1 : 0;
    const habitsLogged  = habitLogs.some(l => l.date === dateStr && l.completed) ? 1 : 0;
    const tasksLogged   = tasks.some(t => t.completedAt === dateStr) ? 1 : 0;
    return moodLogged + healthLogged + habitsLogged + tasksLogged;
  };

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const calCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selEntry = selectedDay ? {
    mood:    moodEntries.find(e => e.date === selectedDay),
    health:  healthEntries.find(e => e.date === selectedDay),
    habits:  habitLogs.filter(l => l.date === selectedDay && l.completed),
    tasks:   tasks.filter(t => t.completedAt === selectedDay),
  } : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Insights</Text>

      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.card}>
        <View style={styles.statRow}>
          {[
            { icon: 'checkmark-done-circle-outline', label: 'Habits',     value: `${habitPct}%`,                                 color: Colors.green },
            { icon: 'happy-outline',                 label: 'Avg Mood',   value: avgMoodLabel === 'No data' ? '—' : avgMoodLabel, color: avgMoodColor },
            { icon: 'list-outline',                  label: 'Tasks Done', value: String(tasksThisWeek),                           color: Colors.blue  },
          ].map(item => (
            <View key={item.label} style={[styles.statTile, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.weekDivider} />
        <Text style={styles.weekSubtitle}>Health — 7-Day Averages</Text>

        {healthWithData.length === 0 ? (
          <Text style={styles.weekNoData}>No health data logged this week.</Text>
        ) : (
          ([
            { key: 'water',    label: 'Water',    icon: 'water-outline',   color: Colors.blue,    unit: 'ml',  avg: healthAvgs.water,    target: healthTargets.water    },
            { key: 'sleep',    label: 'Sleep',    icon: 'moon-outline',    color: Colors.primary, unit: 'h',   avg: healthAvgs.sleep,    target: healthTargets.sleep    },
            { key: 'exercise', label: 'Exercise', icon: 'barbell-outline', color: Colors.green,   unit: 'min', avg: healthAvgs.exercise, target: healthTargets.exercise },
          ] as const).map((item, i) => {
            const pct = Math.min((item.avg / item.target) * 100, 100);
            return (
              <View key={item.key} style={[styles.healthRow, i > 0 && { marginTop: 14 }]}>
                <View style={[styles.healthIconBg, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.healthRowHeader}>
                    <Text style={styles.healthLabel}>{item.label}</Text>
                    <Text style={[styles.healthAvgVal, { color: item.color }]}>
                      {item.avg}{item.unit}
                      <Text style={styles.healthTarget}> / {item.target}{item.unit}</Text>
                    </Text>
                  </View>
                  <View style={styles.healthBarBg}>
                    <View style={[styles.healthBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      <Text style={styles.sectionTitle}>Daily Activity</Text>
      <View style={styles.card}>
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.calTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={[styles.calNavBtn, isCurrentMonth && { opacity: 0.3 }]} disabled={isCurrentMonth}>
            <Ionicons name="chevron-forward" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.calDayRow}>
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={styles.calDayLabel}>{d}</Text>
          ))}
        </View>

        <View style={styles.calGrid}>
          {calCells.map((day, i) => {
            if (!day) return <View key={`e${i}`} style={styles.calCell} />;
            const dateStr  = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isFuture = dateStr > today;
            const isToday  = dateStr === today;
            const isSel    = dateStr === selectedDay;
            const score    = isFuture ? 0 : getDayScore(dateStr);
            const bgColor  = isFuture ? 'transparent' : HEAT_COLORS[score];

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calCell,
                  { backgroundColor: bgColor },
                  isToday && styles.calCellToday,
                  isSel   && styles.calCellSelected,
                  isFuture && { opacity: 0.2 },
                ]}
                onPress={() => { if (isFuture) return; setSelectedDay(isSel ? null : dateStr); setExpandedPanel(null); }}
                disabled={isFuture}
              >
                <Text style={[
                  styles.calDayNum,
                  score > 0 && { color: '#FFF' },
                  isToday && !isSel && { color: Colors.primary, fontWeight: '700' },
                  isSel && { color: '#FFF' },
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calLegend}>
          <Text style={styles.calLegendLabel}>Activity:</Text>
          {HEAT_COLORS.map((color, i) => (
            <View key={i} style={styles.calLegendItem}>
              <View style={[styles.calLegendSwatch, { backgroundColor: color || Colors.border }]} />
              <Text style={styles.calLegendText}>{HEAT_LABELS[i]}</Text>
            </View>
          ))}
        </View>

        {selectedDay && selEntry && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>

            <View style={styles.dayDetailGrid}>
              {([
                {
                  key: 'mood' as const,
                  icon: 'happy-outline',
                  label: 'Mood',
                  value: selEntry.mood ? `${MOOD_CONFIG[selEntry.mood.mood as MoodLevel].emoji} ${selEntry.mood.mood.charAt(0).toUpperCase() + selEntry.mood.mood.slice(1)}` : 'Not logged',
                  color: selEntry.mood ? MOOD_CONFIG[selEntry.mood.mood as MoodLevel].color : Colors.subtext,
                  done: !!selEntry.mood,
                },
                {
                  key: 'health' as const,
                  icon: 'heart-outline',
                  label: 'Health',
                  value: selEntry.health ? 'Logged' : 'Not logged',
                  color: selEntry.health ? Colors.red : Colors.subtext,
                  done: !!selEntry.health,
                },
                {
                  key: 'habits' as const,
                  icon: 'checkmark-done-circle-outline',
                  label: 'Habits',
                  value: selEntry.habits.length > 0 ? `${selEntry.habits.length} done` : 'None',
                  color: selEntry.habits.length > 0 ? Colors.primary : Colors.subtext,
                  done: selEntry.habits.length > 0,
                },
                {
                  key: 'tasks' as const,
                  icon: 'list-outline',
                  label: 'Tasks',
                  value: selEntry.tasks.length > 0 ? `${selEntry.tasks.length} done` : 'None',
                  color: selEntry.tasks.length > 0 ? Colors.blue : Colors.subtext,
                  done: selEntry.tasks.length > 0,
                },
              ]).map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.dayDetailItem,
                    { backgroundColor: item.done ? item.color + '15' : Colors.background },
                    expandedPanel === item.key && { borderWidth: 1.5, borderColor: item.color },
                  ]}
                  onPress={() => setExpandedPanel(expandedPanel === item.key ? null : item.key)}
                  disabled={!item.done}
                  activeOpacity={item.done ? 0.7 : 1}
                >
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                  <Text style={styles.dayDetailItemLabel}>{item.label}</Text>
                  <Text style={[styles.dayDetailItemValue, { color: item.color }]}>{item.value}</Text>
                  {item.done && (
                    <Ionicons
                      name={expandedPanel === item.key ? 'chevron-up' : 'chevron-down'}
                      size={12} color={item.color}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {expandedPanel === 'mood' && selEntry.mood && (
              <View style={styles.expandedPanel}>
                <Text style={[styles.expandedRow]}>
                  {MOOD_CONFIG[selEntry.mood.mood as MoodLevel].emoji}{'  '}
                  <Text style={{ color: MOOD_CONFIG[selEntry.mood.mood as MoodLevel].color, fontWeight: '700' }}>
                    {selEntry.mood.mood.charAt(0).toUpperCase() + selEntry.mood.mood.slice(1)}
                  </Text>
                </Text>
                {selEntry.mood.note ? <Text style={styles.expandedNote}>"{selEntry.mood.note}"</Text> : null}
              </View>
            )}

            {expandedPanel === 'health' && selEntry.health && (
              <View style={styles.expandedPanel}>
                {[
                  { icon: 'water-outline',   label: 'Water',    value: `${selEntry.health.waterIntake} ml`,                                                                                          color: Colors.blue    },
                  { icon: 'moon-outline',    label: 'Sleep',    value: `${Math.floor(selEntry.health.sleepHours)}h ${Math.round((selEntry.health.sleepHours % 1) * 60)}min`,                          color: Colors.primary },
                  { icon: 'barbell-outline', label: 'Exercise', value: `${selEntry.health.exerciseMinutes} min`,                                                                                      color: Colors.green   },
                  ...(selEntry.health.weight ? [{ icon: 'scale-outline', label: 'Weight', value: `${selEntry.health.weight} kg`, color: Colors.orange }] : []),
                ].map(row => (
                  <View key={row.label} style={styles.expandedSubRow}>
                    <Ionicons name={row.icon as any} size={14} color={row.color} />
                    <Text style={styles.expandedSubLabel}>{row.label}</Text>
                    <Text style={[styles.expandedSubValue, { color: row.color }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {expandedPanel === 'habits' && selEntry.habits.length > 0 && (
              <View style={styles.expandedPanel}>
                {habits
                  .filter(h => selEntry.habits.some(l => l.habitId === h.id))
                  .map(h => (
                    <View key={h.id} style={styles.expandedSubRow}>
                      <Text style={{ fontSize: 14 }}>{h.icon}</Text>
                      <Text style={[styles.expandedSubLabel, { color: h.color, fontWeight: '600' }]}>{h.name}</Text>
                    </View>
                  ))
                }
              </View>
            )}

            {expandedPanel === 'tasks' && selEntry.tasks.length > 0 && (
              <View style={styles.expandedPanel}>
                {selEntry.tasks.map(t => (
                  <View key={t.id} style={styles.expandedSubRow}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.blue} />
                    <Text style={styles.expandedSubLabel} numberOfLines={1}>{t.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Habit Completion This Week</Text>
      <View style={styles.card}>
        {habitStats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={36} color={Colors.subtext} />
            <Text style={styles.emptyText}>No habits added yet.</Text>
          </View>
        ) : (
          habitStats.map((habit, i) => (
            <View key={habit.id} style={[styles.habitRow, i > 0 && { marginTop: 14 }]}>
              <View style={[styles.habitIconBg, { backgroundColor: habit.color + '20' }]}>
                <Text style={{ fontSize: 16 }}>{habit.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.habitRowHeader}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={[styles.habitPct, { color: habit.color }]}>{habit.pct}%</Text>
                </View>
                <View style={styles.habitBarBg}>
                  <View style={[styles.habitBarFill, { width: `${habit.pct}%`, backgroundColor: habit.color }]} />
                </View>
                <Text style={styles.habitDays}>{habit.completed}/7 days</Text>
              </View>
            </View>
          ))
        )}
      </View>
      <Text style={styles.sectionTitle}>Goal Progress</Text>
      <View style={styles.card}>
        {activeGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={36} color={Colors.subtext} />
            <Text style={styles.emptyText}>No active goals. Add one in the Goals screen!</Text>
          </View>
        ) : (
          activeGoals.map((goal, i) => (
            <View key={goal.id} style={[styles.goalRow, i > 0 && { marginTop: 16 }]}>
              <View style={styles.goalRowHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalName}>{goal.title}</Text>
                  {goal.category ? (
                    <Text style={styles.goalCategory}>{goal.category}</Text>
                  ) : null}
                </View>
                <Text style={[styles.goalPct, { color: goal.progress >= 75 ? Colors.green : goal.progress >= 40 ? Colors.yellow : Colors.primary }]}>
                  {goal.progress}%
                </Text>
              </View>
              <View style={styles.goalBarBg}>
                <View style={[
                  styles.goalBarFill,
                  {
                    width: `${goal.progress}%`,
                    backgroundColor: goal.progress >= 75 ? Colors.green : goal.progress >= 40 ? Colors.yellow : Colors.primary,
                  },
                ]} />
              </View>
              {goal.milestones && goal.milestones.length > 0 && (
                <Text style={styles.goalMilestone}>
                  {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.background },
  content:      { padding: 16, paddingBottom: 32 },
  screenTitle:  { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },
  subSectionTitle: { fontSize: 13, fontWeight: '600', color: C.subtext, marginTop: 16, marginBottom: 8 },
  card:         { backgroundColor: C.card, borderRadius: 16, padding: 16 },

  statRow:      { flexDirection: 'row', gap: 8 },
  statTile:     { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 3 },
  statValue:    { fontSize: 16, fontWeight: '800' },
  statLabel:    { fontSize: 10, color: C.subtext, textAlign: 'center' },
  weekDivider:  { height: 1, backgroundColor: C.border, marginVertical: 14 },
  weekSubtitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12 },
  weekNoData:   { fontSize: 12, color: C.subtext, textAlign: 'center', paddingVertical: 8 },

  calHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calNavBtn:   { padding: 6 },
  calTitle:    { fontSize: 15, fontWeight: '700', color: C.text },
  calDayRow:   { flexDirection: 'row', marginBottom: 6 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.subtext },
  calGrid:     { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:     {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, padding: 2,
  },
  calCellToday:    { borderWidth: 2, borderColor: C.primary },
  calCellSelected: { borderWidth: 2, borderColor: C.text },
  calDayNum:       { fontSize: 12, color: C.text },

  calLegend:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  calLegendLabel:  { fontSize: 10, color: C.subtext, fontWeight: '600' },
  calLegendItem:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  calLegendSwatch: { width: 12, height: 12, borderRadius: 3 },
  calLegendText:   { fontSize: 10, color: C.subtext },

  dayDetail:          { marginTop: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },
  dayDetailTitle:     { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 10 },
  dayDetailGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayDetailItem:      { width: '47%', borderRadius: 10, padding: 10, gap: 4, borderWidth: 1, borderColor: 'transparent' },
  dayDetailItemLabel: { fontSize: 11, color: C.subtext, fontWeight: '600' },
  dayDetailItemValue: { fontSize: 13, fontWeight: '700' },
  expandedPanel:      { marginTop: 10, backgroundColor: C.background, borderRadius: 10, padding: 12, gap: 8 },
  expandedRow:        { fontSize: 14, color: C.text },
  expandedNote:       { fontSize: 12, color: C.subtext, fontStyle: 'italic' },
  expandedSubRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandedSubLabel:   { fontSize: 13, color: C.text, flex: 1 },
  expandedSubValue:   { fontSize: 13, fontWeight: '700' },

  healthRow:       { flexDirection: 'row', alignItems: 'center' },
  healthIconBg:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  healthRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  healthLabel:     { fontSize: 13, fontWeight: '600', color: C.text },
  healthAvgVal:    { fontSize: 13, fontWeight: '700' },
  healthTarget:    { fontSize: 11, fontWeight: '400', color: C.subtext },
  healthBarBg:     { height: 8, backgroundColor: C.border, borderRadius: 4 },
  healthBarFill:   { height: 8, borderRadius: 4 },

  habitRow:       { flexDirection: 'row', alignItems: 'center' },
  habitIconBg:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  habitName:      { fontSize: 13, fontWeight: '600', color: C.text },
  habitPct:       { fontSize: 13, fontWeight: '700' },
  habitBarBg:     { height: 8, backgroundColor: C.border, borderRadius: 4 },
  habitBarFill:   { height: 8, borderRadius: 4 },
  habitDays:      { fontSize: 10, color: C.subtext, marginTop: 3 },

  goalRow:        { },
  goalRowHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  goalName:       { fontSize: 14, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  goalCategory:   { fontSize: 11, color: C.subtext, marginTop: 2 },
  goalPct:        { fontSize: 14, fontWeight: '800' },
  goalBarBg:      { height: 8, backgroundColor: C.border, borderRadius: 4 },
  goalBarFill:    { height: 8, borderRadius: 4 },
  goalMilestone:  { fontSize: 10, color: C.subtext, marginTop: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  emptyText:  { fontSize: 13, color: C.subtext, textAlign: 'center' },
});
