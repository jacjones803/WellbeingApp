import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../context/AppContext';
import { ColorScheme } from '../constants/theme';

type MoodLevel = 'excellent' | 'good' | 'okay' | 'bad' | 'terrible';

const MOODS: { value: MoodLevel; emoji: string; label: string; color: string; num: number }[] = [
  { value: 'excellent', emoji: '😄', label: 'Excellent', color: '#10B981', num: 5 },
  { value: 'good',      emoji: '😊', label: 'Good',      color: '#3B82F6', num: 4 },
  { value: 'okay',      emoji: '😐', label: 'Okay',      color: '#F59E0B', num: 3 },
  { value: 'bad',       emoji: '😟', label: 'Bad',       color: '#F97316', num: 2 },
  { value: 'terrible',  emoji: '😢', label: 'Terrible',  color: '#EF4444', num: 1 },
];

const DAY_LABELS  = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const getMoodConfig = (mood: MoodLevel) => MOODS.find(m => m.value === mood)!;

export default function MoodScreen() {
  const { moodEntries, addMoodEntry, updateMoodEntry, getTodayMoodEntry, getEffectiveToday } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodLevel>('good');
  const [note, setNote] = useState('');
  const [editingDate, setEditingDate] = useState<string>('');

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const today = getEffectiveToday();
  const todayEntry = getTodayMoodEntry();

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const calCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const openModalForDate = (date: string) => {
    const existing = moodEntries.find(e => e.date === date);
    setEditingDate(date);
    if (existing) {
      setSelectedMood(existing.mood);
      setNote(existing.note ?? '');
    } else {
      setSelectedMood('good');
      setNote('');
    }
    setModalVisible(true);
  };

  const openModal = () => openModalForDate(today);

  const handleSave = () => {
    const existing = moodEntries.find(e => e.date === editingDate);
    const data = { date: editingDate, mood: selectedMood, note: note.trim() || undefined };
    if (existing) {
      updateMoodEntry(existing.id, data);
    } else {
      addMoodEntry(data);
    }
    setModalVisible(false);
  };

  const distribution = MOODS.map(m => ({
    ...m,
    count: moodEntries.filter(e => e.mood === m.value).length,
  }));
  const totalEntries = moodEntries.length;

  const recent = [...moodEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <TouchableOpacity style={styles.logBtn} onPress={openModal}>
        <Text style={{ fontSize: 20 }}>{todayEntry ? getMoodConfig(todayEntry.mood).emoji : '😊'}</Text>
        <Text style={styles.logBtnText}>
          {todayEntry ? 'Update Today\'s Mood' : 'Log Today\'s Mood'}
        </Text>
      </TouchableOpacity>

      {todayEntry && (
        <View style={[styles.todayCard, { backgroundColor: Colors.primary }]}>
          <Text style={{ fontSize: 48 }}>{getMoodConfig(todayEntry.mood).emoji}</Text>
          <Text style={styles.todayMoodLabel}>{getMoodConfig(todayEntry.mood).label}</Text>
          {todayEntry.note && <Text style={styles.todayNote}>"{todayEntry.note}"</Text>}
        </View>
      )}

      {/* Monthly Mood Calendar */}
      <Text style={styles.sectionTitle}>Monthly Mood</Text>
      <View style={styles.card}>
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.calTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={[styles.calNavBtn, isCurrentMonth && { opacity: 0.3 }]}
            disabled={isCurrentMonth}
          >
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
            const entry    = moodEntries.find(e => e.date === dateStr);
            const cfg      = entry ? getMoodConfig(entry.mood) : null;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calCell,
                  cfg && { backgroundColor: cfg.color + '35' },
                  isToday && styles.calCellToday,
                  isFuture && { opacity: 0.2 },
                ]}
                onPress={() => openModalForDate(dateStr)}
                disabled={isFuture}
              >
                {cfg && <Text style={{ fontSize: 10, lineHeight: 12 }}>{cfg.emoji}</Text>}
                <Text style={[
                  styles.calDayNum,
                  isToday && { color: Colors.primary, fontWeight: '700' },
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calLegend}>
          {MOODS.map(m => (
            <View key={m.value} style={styles.calLegendItem}>
              <View style={[styles.calLegendSwatch, { backgroundColor: m.color + '35' }]}>
                <Text style={{ fontSize: 8 }}>{m.emoji}</Text>
              </View>
              <Text style={styles.calLegendText}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Mood Distribution */}
      <Text style={styles.sectionTitle}>Mood Distribution</Text>
      <View style={styles.card}>
        {distribution.map(m => (
          <View key={m.value} style={styles.distRow}>
            <Text style={{ width: 28, fontSize: 18 }}>{m.emoji}</Text>
            <Text style={styles.distLabel}>{m.label}</Text>
            <View style={styles.distBarBg}>
              <View style={[styles.distBarFill, {
                width: totalEntries > 0 ? `${(m.count / totalEntries) * 100}%` : '0%',
                backgroundColor: m.color,
              }]} />
            </View>
            <Text style={styles.distCount}>{m.count}</Text>
          </View>
        ))}
      </View>

      {/* Recent Entries */}
      {recent.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {recent.map(entry => {
            const cfg = getMoodConfig(entry.mood);
            return (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.entryMood}>{cfg.label}</Text>
                  {entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
                </View>
                <Text style={styles.entryDate}>{entry.date}</Text>
              </View>
            );
          })}
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingDate !== today
                ? new Date(editingDate + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
                : todayEntry ? 'Update Your Mood' : 'How are you feeling?'}
            </Text>

            <View style={styles.moodSelector}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.value}
                  style={[
                    styles.moodOption,
                    selectedMood === m.value && { backgroundColor: m.color, borderColor: m.color },
                  ]}
                  onPress={() => setSelectedMood(m.value)}
                >
                  <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                  <Text style={[styles.moodOptionLabel, selectedMood === m.value && { color: '#FFF' }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Add a note (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="How was your day?"
              placeholderTextColor={Colors.subtext}
              multiline
            />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: getMoodConfig(selectedMood).color }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Mood</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content:   { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },

  logBtn:    { backgroundColor: C.primary, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  todayCard:      { borderRadius: 16, padding: 24, marginTop: 16, alignItems: 'center', gap: 8 },
  todayMoodLabel: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  todayNote:      { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', textAlign: 'center' },

  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10 },

  // Calendar
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
  calCellToday: { borderWidth: 2, borderColor: C.primary },
  calDayNum:    { fontSize: 11, color: C.text },
  calLegend:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 4 },
  calLegendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calLegendSwatch:{ width: 16, height: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  calLegendText:  { fontSize: 9, color: C.subtext },

  // Distribution
  distRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  distLabel:  { width: 58, fontSize: 13, color: C.text },
  distBarBg:  { flex: 1, height: 10, backgroundColor: C.border, borderRadius: 5 },
  distBarFill:{ height: 10, borderRadius: 5 },
  distCount:  { width: 24, fontSize: 12, color: C.subtext, textAlign: 'right' },

  // Recent entries
  entryCard:  { backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  entryMood:  { fontSize: 15, fontWeight: '700', color: C.text },
  entryNote:  { fontSize: 12, color: C.subtext, marginTop: 2 },
  entryDate:  { fontSize: 11, color: C.subtext },

  // Modal
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:      { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },

  moodSelector: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  moodOption:   {
    flex: 1, alignItems: 'center', padding: 8, borderRadius: 12,
    borderWidth: 2, borderColor: C.border, gap: 4,
  },
  moodOptionLabel: { fontSize: 9, color: C.subtext, fontWeight: '600', textAlign: 'center' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  input:      { backgroundColor: C.background, borderRadius: 8, padding: 12, fontSize: 15, color: C.text },

  saveBtn:     { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn:     { borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: C.subtext, fontSize: 15 },
});
