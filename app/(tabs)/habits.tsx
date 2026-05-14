import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../../context/AppContext';
import { ColorScheme } from '../../constants/theme';

const getToday = () => new Date().toISOString().split('T')[0];

const EMOJI_CATEGORIES = [
  { label: 'Sport',    emojis: ['🏋️','🏃','🚴','🧘','🏊','⚽','🎾','🥊','🤸','🏄','🧗','🚵','🤾','🥋','⛷️','🏂','🏹','🛹','🚣','🏌️','⛳','🎯','🎱','🏓','🏸','🤿','⛸️','🥌','🛷','🏇','🤺','🥅','🏒','🏑','🤼','🤽','🚀','🏆','🥇','🎽'] },
  { label: 'Wellness', emojis: ['🧠','💭','🙏','🌟','✨','💫','☮️','🕯️','🫧','💆','🛀','😌','💊','🩺','🩻','❤️','💪','🌡️','😴','🧬','🩹','🫀','🫁','🦷','👁️','👂','🤲','🧖','💅','🧴','🪥','🚿'] },
  { label: 'Food',     emojis: ['🍎','🥗','💧','☕','🍵','🥤','🍳','🥦','🍇','🫖','🥑','🍓','🥕','🍌','🍊','🫐','🥝','🍒','🍑','🌽','🥜','🫘','🍞','🥚','🧀','🍗','🥩','🍜','🍱','🥣','🥙','🌮','🥗','🍲','🫕','🥘','🍛','🍣','🥞','🧆','🥐','🫙','🧃','🍶','🧋','🥛'] },
  { label: 'Study',    emojis: ['📖','✍️','📚','💻','📝','🎓','🔬','📊','🗒️','🖊️','📐','📏','🔭','🖥️','⌨️','🖱️','📱','🔍','💡','🗃️','📂','📋','✏️','🖋️','📌','📍','🗂️','📄','📜','🔐','🧮','🗺️','📡','🔧','⚙️'] },
  { label: 'Creative', emojis: ['🎨','🎵','🎸','🎹','🎺','🎻','🪗','🥁','🎤','🎙️','🎬','📷','📸','🎭','🎪','🎠','🎡','✂️','🧵','🪡','🖌️','🖍️','📻','🎮','🕹️','🃏','🎲','♟️','🪆','🧩','🎪','🎟️'] },
  { label: 'Lifestyle',emojis: ['🌙','☀️','🌅','🌄','🛌','🛋️','🏠','🏡','🚗','✈️','🧹','🪴','🧺','🛍️','💃','🕺','📞','💌','🤝','👫','🫂','🐕','🐈','🐠','🌸','🎁','💰','⏰','🗓️','🔔','🏖️','🏕️','🌍'] },
  { label: 'Nature',   emojis: ['🌿','🌱','🌻','🌊','🏔️','🌲','🦋','🐾','🌺','🍃','🌴','🌵','🍀','🌾','🌞','🌝','⛅','🌧️','❄️','🌸','🍁','🍂','🍄','🌰','🌈','⚡','🔥','💧','🌬️','🌪️','🦅','🦁','🐻','🦊','🐺','🦝','🐘','🦒','🐬','🦈'] },
  { label: 'Symbols',  emojis: ['⭐','💯','✅','🔝','🆕','♻️','💥','🎉','🎊','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔶','🔷','🔸','🔹','🏳️','🚩','🎌','🏴','🔑','💎','🏅','🎖️','👑','🔮','💫'] },
];
const COLOR_OPTIONS = [
  '#7C3AED', '#3B82F6', '#10B981', '#F97316',
  '#EF4444', '#EC4899', '#F59E0B', '#14B8A6',
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HabitsScreen() {
  const { habits, habitLogs, addHabit, deleteHabit, toggleHabitLog, getHabitWeekLogs, getEffectiveToday } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const [modalVisible, setModalVisible]   = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [name, setName]         = useState('');
  const [icon, setIcon]         = useState(EMOJI_CATEGORIES[0].emojis[0]);
  const [color, setColor]       = useState(COLOR_OPTIONS[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  const today = getEffectiveToday();

  const handleAdd = () => {
    if (!name.trim()) { Alert.alert('Please enter a habit name.'); return; }
    addHabit({ name: name.trim(), icon, color, frequency, targetDays: 7 });
    setName(''); setIcon(EMOJI_CATEGORIES[0].emojis[0]); setColor(COLOR_OPTIONS[0]); setFrequency('daily');
    setShowEmojiPicker(false); setEmojiCategory(0);
    setModalVisible(false);
  };

  const getStreak = (habitId: string): number => {
    let streak = 0;
    const d = new Date();
    const todayDone = habitLogs.some(l => l.habitId === habitId && l.date === today && l.completed);
    if (!todayDone) d.setDate(d.getDate() - 1);
    while (streak <= 365) {
      const dateStr = d.toISOString().split('T')[0];
      if (!habitLogs.some(l => l.habitId === habitId && l.date === dateStr && l.completed)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const getTotal = (habitId: string) =>
    habitLogs.filter(l => l.habitId === habitId && l.completed).length;

  const completedToday = habitLogs.filter(l => l.date === today && l.completed).length;
  const completionPct  = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Habit Tracking</Text>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle" size={20} color="#FFF" />
        <Text style={styles.addBtnText}>Add New Habit</Text>
      </TouchableOpacity>

      {habits.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTitle}>Today's Summary</Text>
            <Text style={styles.summaryCount}>{completedToday}/{habits.length}</Text>
          </View>
          <View style={styles.summaryProgressBg}>
            <View style={[styles.summaryProgressFill, { width: `${completionPct}%` }]} />
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{habits.length}</Text>
              <Text style={styles.summaryLabel}>Total Habits</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{completedToday}</Text>
              <Text style={styles.summaryLabel}>Done Today</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{completionPct}%</Text>
              <Text style={styles.summaryLabel}>Completion</Text>
            </View>
          </View>
        </View>
      )}

      {habits.map(habit => {
        const weekLogs      = getHabitWeekLogs(habit.id);
        const weekCompleted = weekLogs.filter(l => l.completed).length;
        const weekPct       = Math.round((weekCompleted / 7) * 100);
        const streak        = getStreak(habit.id);
        const total         = getTotal(habit.id);
        const doneToday     = weekLogs.find(l => l.date === today)?.completed ?? false;

        return (
          <View key={habit.id} style={styles.habitCard}>
            {/* Header */}
            <View style={styles.habitHeader}>
              <View style={[styles.iconBadge, { backgroundColor: habit.color + '20' }]}>
                <Text style={{ fontSize: 20 }}>{habit.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <View style={styles.habitMeta}>
                  <Text style={styles.habitFreq}>
                    {habit.frequency === 'daily' ? 'Daily' : 'Weekly'}
                  </Text>
                  {streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakFire}>🔥</Text>
                      <Text style={[styles.streakText, { color: habit.color }]}>
                        {streak} day streak
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Delete habit', `Remove "${habit.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
                ])}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.subtext} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekGrid}>
              {weekLogs.map((log, i) => {
                const isToday   = log.date === today;
                const isFuture  = log.date > today;
                return (
                  <TouchableOpacity
                    key={log.date}
                    style={styles.dayCell}
                    onPress={() => !isFuture && toggleHabitLog(habit.id, log.date)}
                    disabled={isFuture}
                  >
                    <Text style={[
                      styles.dayLabel,
                      isToday && { color: habit.color, fontWeight: '700' },
                    ]}>
                      {DAY_LABELS[i]}
                    </Text>
                    <View style={[
                      styles.dayCircle,
                      log.completed && { backgroundColor: habit.color },
                      isToday && !log.completed && { borderColor: habit.color, borderWidth: 2 },
                      isFuture && { opacity: 0.3 },
                    ]}>
                      {log.completed
                        ? <Ionicons name="checkmark" size={14} color="#FFF" />
                        : <Text style={{ fontSize: 10, color: isToday ? habit.color : Colors.subtext }}>
                            {new Date(log.date).getDate()}
                          </Text>
                      }
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.weekProgressRow}>
              <Text style={styles.weekProgressLabel}>This week</Text>
              <Text style={[styles.weekProgressPct, { color: habit.color }]}>
                {weekCompleted}/7 days ({weekPct}%)
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${weekPct}%`, backgroundColor: habit.color }]} />
            </View>

            <Text style={styles.totalLabel}>
              {total} total check-in{total !== 1 ? 's' : ''}
            </Text>

            <TouchableOpacity
              style={[styles.markBtn, doneToday && { backgroundColor: habit.color }]}
              onPress={() => toggleHabitLog(habit.id, today)}
            >
              <Ionicons
                name={doneToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={18}
                color={doneToday ? '#FFF' : habit.color}
              />
              <Text style={[styles.markBtnText, { color: doneToday ? '#FFF' : habit.color }]}>
                {doneToday ? 'Done Today!' : 'Mark as Done Today'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {habits.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.subtext} />
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptyText}>Tap "Add New Habit" to start building your routine.</Text>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            {showEmojiPicker ? (
              <>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowEmojiPicker(false)} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={18} color={Colors.primary} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Choose Icon</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabs}>
                  {EMOJI_CATEGORIES.map((cat, i) => (
                    <TouchableOpacity
                      key={cat.label}
                      style={[styles.catTab, emojiCategory === i && styles.catTabActive]}
                      onPress={() => setEmojiCategory(i)}
                    >
                      <Text style={[styles.catTabText, emojiCategory === i && styles.catTabTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES[emojiCategory].emojis.map(em => (
                    <TouchableOpacity
                      key={em}
                      style={[styles.emojiCell, icon === em && styles.emojiCellSelected]}
                      onPress={() => { setIcon(em); setShowEmojiPicker(false); }}
                    >
                      <Text style={styles.emojiText}>{em}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>New Habit</Text>

                <Text style={styles.fieldLabel}>Habit Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Morning run"
                  placeholderTextColor={Colors.subtext}
                />

                <Text style={styles.fieldLabel}>Icon</Text>
                <TouchableOpacity style={styles.iconPickerBtn} onPress={() => setShowEmojiPicker(true)}>
                  <Text style={styles.iconPickerEmoji}>{icon}</Text>
                  <Text style={styles.iconPickerLabel}>Tap to change</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.subtext} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Colour</Text>
                <View style={styles.optionRow}>
                  {COLOR_OPTIONS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorSelected]}
                      onPress={() => setColor(c)}
                    />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Frequency</Text>
                <View style={styles.segmented}>
                  {(['daily', 'weekly'] as const).map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.segment, frequency === f && styles.segmentActive]}
                      onPress={() => setFrequency(f)}
                    >
                      <Text style={[styles.segmentText, frequency === f && styles.segmentTextActive]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                  <Text style={styles.saveBtnText}>Add Habit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                  setName(''); setIcon(EMOJI_CATEGORIES[0].emojis[0]); setColor(COLOR_OPTIONS[0]);
                  setFrequency('daily'); setShowEmojiPicker(false); setEmojiCategory(0);
                  setModalVisible(false);
                }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.background },
  content:      { padding: 16, paddingBottom: 32 },
  screenTitle:  { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 16 },

  addBtn:     { backgroundColor: C.green, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  summaryCard:         { backgroundColor: C.primary, borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 8 },
  summaryTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryTitle:        { color: '#FFF', fontSize: 14, fontWeight: '700' },
  summaryCount:        { color: '#FFF', fontSize: 14, fontWeight: '700' },
  summaryProgressBg:   { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, marginBottom: 14 },
  summaryProgressFill: { height: 8, backgroundColor: '#FFF', borderRadius: 4 },
  summaryRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem:         { flex: 1, alignItems: 'center' },
  summaryDivider:      { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },
  summaryNum:          { color: '#FFF', fontSize: 22, fontWeight: '800' },
  summaryLabel:        { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  habitCard:   { backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 12 },
  habitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBadge:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitName:   { fontSize: 16, fontWeight: '700', color: C.text },
  habitMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  habitFreq:   { fontSize: 12, color: C.subtext },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakFire:  { fontSize: 12 },
  streakText:  { fontSize: 12, fontWeight: '700' },
  deleteBtn:   { padding: 4 },

  weekGrid:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  dayCell:   { alignItems: 'center', flex: 1 },
  dayLabel:  { fontSize: 10, color: C.subtext, marginBottom: 4, fontWeight: '600' },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.border,
  },

  weekProgressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekProgressLabel: { fontSize: 12, color: C.subtext },
  weekProgressPct:   { fontSize: 12, fontWeight: '700' },
  progressBg:        { height: 6, backgroundColor: C.border, borderRadius: 3 },
  progressFill:      { height: 6, borderRadius: 3 },
  totalLabel:        { fontSize: 11, color: C.subtext, marginTop: 6 },

  markBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.background, borderWidth: 1.5, borderColor: C.border,
  },
  markBtnText: { fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.subtext },
  emptyText:  { fontSize: 13, color: C.subtext, textAlign: 'center', lineHeight: 18 },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:      { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 12 },
  input:      { backgroundColor: C.background, borderRadius: 8, padding: 12, fontSize: 15, color: C.text },

  optionRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption:  { width: 36, height: 36, borderRadius: 18 },
  colorSelected:  { borderWidth: 3, borderColor: C.text },

  iconPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.background, borderRadius: 12, padding: 12 },
  iconPickerEmoji: { fontSize: 28 },
  iconPickerLabel: { fontSize: 14, color: C.subtext },

  pickerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  backBtnText: { fontSize: 14, color: C.primary, fontWeight: '600' },

  catTabs: { flexGrow: 0, marginBottom: 14 },
  catTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.background, marginRight: 8 },
  catTabActive: { backgroundColor: C.primary },
  catTabText: { fontSize: 13, color: C.subtext, fontWeight: '600' },
  catTabTextActive: { color: '#FFF' },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  emojiCellSelected: { borderWidth: 2.5, borderColor: C.primary, backgroundColor: C.primary + '15' },
  emojiText: { fontSize: 26 },

  segmented:        { flexDirection: 'row', backgroundColor: C.background, borderRadius: 8, padding: 3 },
  segment:          { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  segmentActive:    { backgroundColor: C.primary },
  segmentText:      { fontSize: 13, color: C.subtext, fontWeight: '600' },
  segmentTextActive:{ color: '#FFF' },

  saveBtn:      { backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn:    { borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText:{ color: C.subtext, fontSize: 15 },
});
