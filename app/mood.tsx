import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, StyleSheet,
} from 'react-native';
import { useApp, useColors } from '../context/AppContext';
import { ColorScheme } from '../constants/theme';

const getToday = () => new Date().toISOString().split('T')[0];

type MoodLevel = 'excellent' | 'good' | 'okay' | 'bad' | 'terrible';

const MOODS: { value: MoodLevel; emoji: string; label: string; color: string; num: number }[] = [
  { value: 'excellent', emoji: '😄', label: 'Excellent', color: '#10B981', num: 5 },
  { value: 'good',      emoji: '😊', label: 'Good',      color: '#3B82F6', num: 4 },
  { value: 'okay',      emoji: '😐', label: 'Okay',      color: '#F59E0B', num: 3 },
  { value: 'bad',       emoji: '😟', label: 'Bad',       color: '#F97316', num: 2 },
  { value: 'terrible',  emoji: '😢', label: 'Terrible',  color: '#EF4444', num: 1 },
];

const getMoodConfig = (mood: MoodLevel) => MOODS.find(m => m.value === mood)!;

export default function MoodScreen() {
  const { moodEntries, addMoodEntry, updateMoodEntry, getTodayMoodEntry, getEffectiveToday } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodLevel>('good');
  const [note, setNote] = useState('');

  const todayEntry = getTodayMoodEntry();

  const openModal = () => {
    if (todayEntry) {
      setSelectedMood(todayEntry.mood);
      setNote(todayEntry.note ?? '');
    } else {
      setSelectedMood('good');
      setNote('');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    const data = { date: getEffectiveToday(), mood: selectedMood, note: note.trim() || undefined };
    if (todayEntry) {
      updateMoodEntry(todayEntry.id, data);
    } else {
      addMoodEntry(data);
    }
    setModalVisible(false);
  };

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const date = d.toISOString().split('T')[0];
    const label = d.getDate().toString();
    const entry = moodEntries.find(e => e.date === date);
    return { date, label, entry };
  });

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

      <Text style={styles.sectionTitle}>14-Day Mood Trend</Text>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 2 }}>
          {last14.map((d, i) => {
            const num = d.entry ? getMoodConfig(d.entry.mood).num : 0;
            const color = d.entry ? getMoodConfig(d.entry.mood).color : Colors.border;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{
                  width: 12, height: 12, borderRadius: 6,
                  backgroundColor: num > 0 ? color : Colors.border,
                  marginBottom: num > 0 ? ((num - 1) / 4) * 56 : 0,
                }} />
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={styles.chartAxisLabel}>😢 Terrible</Text>
          <Text style={styles.chartAxisLabel}>😄 Excellent</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          {last14.map((d, i) => (
            <Text key={i} style={{ flex: 1, fontSize: 8, color: Colors.subtext, textAlign: 'center' }}>
              {i % 3 === 0 ? d.label : ''}
            </Text>
          ))}
        </View>
      </View>

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
              {todayEntry ? 'Update Your Mood' : 'How are you feeling?'}
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
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },

  logBtn: { backgroundColor: C.primary, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  todayCard: { borderRadius: 16, padding: 24, marginTop: 16, alignItems: 'center', gap: 8 },
  todayMoodLabel: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  todayNote: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', textAlign: 'center' },

  card: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },

  chartAxisLabel: { fontSize: 11, color: C.subtext },

  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  distLabel: { width: 58, fontSize: 13, color: C.text },
  distBarBg: { flex: 1, height: 10, backgroundColor: C.border, borderRadius: 5 },
  distBarFill: { height: 10, borderRadius: 5 },
  distCount: { width: 24, fontSize: 12, color: C.subtext, textAlign: 'right' },

  entryCard: { backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  entryMood: { fontSize: 15, fontWeight: '700', color: C.text },
  entryNote: { fontSize: 12, color: C.subtext, marginTop: 2 },
  entryDate: { fontSize: 11, color: C.subtext },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },

  moodSelector: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  moodOption: {
    flex: 1, alignItems: 'center', padding: 8, borderRadius: 12,
    borderWidth: 2, borderColor: C.border, gap: 4,
  },
  moodOptionLabel: { fontSize: 9, color: C.subtext, fontWeight: '600', textAlign: 'center' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  input: { backgroundColor: C.background, borderRadius: 8, padding: 12, fontSize: 15, color: C.text },

  saveBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: C.subtext, fontSize: 15 },
});
