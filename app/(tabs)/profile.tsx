import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp, useColors } from '../../context/AppContext';
import { ColorScheme } from '../../constants/theme';
import { Achievement } from '../../types';

export default function ProfileScreen() {
  const router = useRouter();
  const { userStats, tasks, goals, habitLogs, getLevel, getXpToNextLevel, getEffectiveStreak } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const [modalAchievement, setModalAchievement] = useState<Achievement | null>(null);

  const level = getLevel();
  const xpProgress = getXpToNextLevel();
  const streak = getEffectiveStreak();

  const completedTasks = tasks.filter(t => t.completed).length;
  const completedGoals = goals.filter(g => g.progress >= 100).length;
  const totalHabitChecks = habitLogs.filter(l => l.completed).length;

  const unlocked = userStats.achievements.filter(a => a.unlockedAt);
  const locked = userStats.achievements.filter(a => !a.unlockedAt);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>Profile & Stats</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={22} color={Colors.subtext} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.levelCard]}>
        <View style={styles.row}>
          <View style={styles.levelCircle}>
            <Ionicons name="trophy" size={28} color="#FFF" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.levelLabel}>Level {level}</Text>
            <Text style={styles.levelSub}>Progress to Level {level + 1}</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${(xpProgress / 1000) * 100}%` }]} />
            </View>
            <Text style={styles.xpText}>{xpProgress} / 1000 XP</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.streakCard]}>
        <View style={styles.row}>
          <Text style={{ fontSize: 32 }}>🔥</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <Text style={styles.streakSub}>
              {streak === 0 ? 'Log today to start your streak!' : "Keep it up! 🔥"}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bestNum}>{userStats.longestStreak}</Text>
            <Text style={styles.bestLabel}>Best</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Statistics</Text>
      <View style={styles.statsGrid}>
        {[
          { icon: 'checkmark-circle', label: 'Tasks Completed', value: completedTasks,   color: Colors.blue    },
          { icon: 'flag',             label: 'Goals Achieved',  value: completedGoals,   color: Colors.primary  },
          { icon: 'trending-up',      label: 'Habit Check-ins', value: totalHabitChecks, color: Colors.green   },
          { icon: 'star',             label: 'Total XP',        value: userStats.xp,     color: Colors.yellow  },
        ].map(item => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon as any} size={22} color={item.color} />
            <Text style={[styles.statNum, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {unlocked.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Achievements Unlocked</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unlocked.length}</Text>
            </View>
          </View>
          <View style={styles.achieveGrid}>
            {unlocked.map(a => (
              <View key={a.id} style={[styles.achieveCell, styles.achieveCellUnlocked]}>
                <Text style={styles.achieveEmoji}>{a.icon}</Text>
                <Text style={styles.achieveCellTitle}>{a.title}</Text>
                <Text style={styles.achieveCellDate}>{formatDate(a.unlockedAt!)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {locked.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Locked</Text>
            <View style={[styles.countBadge, { backgroundColor: Colors.border }]}>
              <Text style={[styles.countBadgeText, { color: Colors.subtext }]}>{locked.length}</Text>
            </View>
          </View>
          <Text style={styles.tapHint}>Tap an achievement to see how to unlock it</Text>
          <View style={styles.achieveGrid}>
            {locked.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[styles.achieveCell, styles.achieveCellLocked]}
                onPress={() => setModalAchievement(a)}
                activeOpacity={0.6}
              >
                <View style={styles.lockOverlay}>
                  <Text style={styles.achieveEmojiLocked}>{a.icon}</Text>
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.achieveCellTitleLocked} numberOfLines={2}>{a.title}</Text>
                <View style={styles.cellProgressBg}>
                  <View style={[styles.cellProgressFill, {
                    width: `${Math.min((a.progress / a.requirement) * 100, 100)}%`,
                  }]} />
                </View>
                <Text style={styles.cellProgressText}>{a.progress}/{a.requirement}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={[styles.card, styles.xpGuideCard]}>
        <Text style={styles.xpGuideTitle}>💡 How to Earn XP</Text>
        {[
          ['Log health data',      '50 XP'],
          ['Track your mood',      '30 XP'],
          ['Complete a task',      '40 XP'],
          ['Check off a habit',    '20 XP'],
          ['Complete a milestone', '50 XP'],
          ['Complete a goal',     '200 XP'],
        ].map(([action, xp]) => (
          <View key={action} style={styles.xpRow}>
            <Text style={styles.xpAction}>{action}</Text>
            <Text style={styles.xpAmount}>{xp}</Text>
          </View>
        ))}
      </View>

      {/* Achievement detail modal */}
      <Modal
        visible={modalAchievement !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAchievement(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalAchievement(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {modalAchievement && (
              <>
                <Text style={styles.modalEmoji}>{modalAchievement.icon}</Text>
                <Text style={styles.modalTitle}>{modalAchievement.title}</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalHowLabel}>How to unlock</Text>
                <Text style={styles.modalDesc}>{modalAchievement.description}</Text>
                <View style={styles.modalProgressRow}>
                  <Text style={styles.modalProgressLabel}>Progress</Text>
                  <Text style={styles.modalProgressVal}>
                    {modalAchievement.progress} / {modalAchievement.requirement}
                  </Text>
                </View>
                <View style={styles.modalBarBg}>
                  <View style={[styles.modalBarFill, {
                    width: `${Math.min((modalAchievement.progress / modalAchievement.requirement) * 100, 100)}%`,
                  }]} />
                </View>
                <TouchableOpacity style={styles.modalClose} onPress={() => setModalAchievement(null)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: C.text },
  settingsBtn: { padding: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },
  tapHint: { fontSize: 12, color: C.subtext, marginBottom: 10, marginTop: -4 },

  card: { borderRadius: 16, padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },

  levelCard: { backgroundColor: C.primary },
  levelCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  levelLabel: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  levelSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 8 },
  progressFill: { height: 8, backgroundColor: '#FFF', borderRadius: 4 },
  xpText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  streakCard: { backgroundColor: C.orange },
  streakNum: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  streakLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  streakSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bestNum: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  bestLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: C.subtext, textAlign: 'center' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  countBadge: { backgroundColor: C.yellow, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: C.text },

  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achieveCell: { width: '31%', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },

  achieveCellUnlocked: { backgroundColor: C.yellow + '22', borderWidth: 1.5, borderColor: C.yellow },
  achieveEmoji: { fontSize: 30 },
  achieveCellTitle: { fontSize: 11, fontWeight: '700', color: C.text, textAlign: 'center' },
  achieveCellDate: { fontSize: 9, color: C.green, textAlign: 'center' },

  achieveCellLocked: { backgroundColor: C.border },
  lockOverlay: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  achieveEmojiLocked: { fontSize: 30, opacity: 0.35 },
  lockBadge: { position: 'absolute', bottom: -2, right: -6, backgroundColor: C.subtext, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  achieveCellTitleLocked: { fontSize: 11, fontWeight: '700', color: C.subtext, textAlign: 'center' },
  cellProgressBg: { width: '100%', height: 4, backgroundColor: C.background, borderRadius: 2, marginTop: 2 },
  cellProgressFill: { height: 4, backgroundColor: C.subtext, borderRadius: 2 },
  cellProgressText: { fontSize: 9, color: C.subtext },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard: { backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  modalEmoji: { fontSize: 48, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center' },
  modalDivider: { width: '100%', height: 1, backgroundColor: C.border, marginVertical: 16 },
  modalHowLabel: { fontSize: 12, fontWeight: '700', color: C.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  modalDesc: { fontSize: 15, color: C.text, textAlign: 'center', marginBottom: 16 },
  modalProgressRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6 },
  modalProgressLabel: { fontSize: 12, color: C.subtext },
  modalProgressVal: { fontSize: 12, fontWeight: '700', color: C.text },
  modalBarBg: { width: '100%', height: 8, backgroundColor: C.border, borderRadius: 4, marginBottom: 20 },
  modalBarFill: { height: 8, backgroundColor: C.primary, borderRadius: 4 },
  modalClose: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  modalCloseText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  xpGuideCard: { backgroundColor: C.primary, marginTop: 20 },
  xpGuideTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpAction: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  xpAmount: { fontSize: 13, fontWeight: '700', color: '#FFF' },
});
