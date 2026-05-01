import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, Switch, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp, useAccessibility, useColors } from '../context/AppContext';
import { ColorScheme } from '../constants/theme';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../services/notifications';

type FontSize = 'normal' | 'large' | 'xlarge';

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Default text size' },
  { value: 'large',  label: 'Large',  description: '20% larger'        },
  { value: 'xlarge', label: 'X-Large',description: '40% larger'        },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    userName, setUserName,
    clearHealthData, clearMoodData, clearHabitsData, clearTasksData, clearGoalsData,
    clearAllData, dayStartHour, setDayStartHour,
  } = useApp();
  const { fontSize, highContrast, boldText, reduceMotion, darkMode, setAccessibility, fs } = useAccessibility();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const [nameInput, setNameInput] = useState(userName);
  const [nameSaved, setNameSaved] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDayStartPicker, setShowDayStartPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await AsyncStorage.getItem('@wb_notif_enabled');
      const hour = await AsyncStorage.getItem('@wb_notif_hour');
      if (enabled === 'true') setNotificationsEnabled(true);
      if (hour) setReminderHour(parseInt(hour, 10));
    })();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications for this app in your device settings.'
        );
        return;
      }
      await scheduleDailyReminder(reminderHour, 0);
      await AsyncStorage.setItem('@wb_notif_enabled', 'true');
    } else {
      await cancelDailyReminder();
      await AsyncStorage.setItem('@wb_notif_enabled', 'false');
    }
    setNotificationsEnabled(value);
  };

  const handleSelectHour = async (hour: number) => {
    setReminderHour(hour);
    await AsyncStorage.setItem('@wb_notif_hour', String(hour));
    if (notificationsEnabled) {
      await scheduleDailyReminder(hour, 0);
    }
  };

  const ALL_HOURS = Array.from({ length: 24 }, (_, i) => {
    const period = i < 12 ? 'AM' : 'PM';
    const display = i === 0 ? 12 : i > 12 ? i - 12 : i;
    return { label: `${display}:00 ${period}`, hour: i };
  });

  const formatHour = (hour: number) => {
    const period = hour < 12 ? 'AM' : 'PM';
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display}:00 ${period}`;
  };

  const handleSaveName = () => {
    setUserName(nameInput.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const confirmClear = (label: string, onConfirm: () => void) => {
    Alert.alert(
      `Clear ${label}?`,
      `This will permanently delete all your ${label.toLowerCase()}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onConfirm },
      ]
    );
  };

  const confirmWipeAll = () => {
    Alert.alert(
      'Wipe All Data?',
      'This will permanently delete ALL your data including health logs, mood entries, habits, tasks, goals, and your profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            router.back();
          },
        },
      ]
    );
  };

  const DATA_SECTIONS = [
    { label: 'Health Data',   hint: 'Water, sleep, and exercise logs', onPress: () => confirmClear('Health Data',  clearHealthData) },
    { label: 'Mood Entries',  hint: 'All mood logs and notes',         onPress: () => confirmClear('Mood Entries', clearMoodData)   },
    { label: 'Tasks',         hint: 'All tasks (active & completed)',  onPress: () => confirmClear('Tasks',        clearTasksData)  },
    { label: 'Habits & Logs', hint: 'Habits and all check-in history', onPress: () => confirmClear('Habits & Logs', clearHabitsData) },
    { label: 'Goals',         hint: 'All goals and milestones',        onPress: () => confirmClear('Goals',        clearGoalsData)  },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Settings</Text>

      {/* Profile */}
      <Text style={styles.sectionTitle}>Your Profile</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Display Name</Text>
        <Text style={styles.fieldHint}>
          Personalises the greeting on your Insights screen.
        </Text>
        <View style={styles.nameRow}>
          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Enter your name"
            maxLength={30}
          />
          <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName}>
            <Text style={styles.saveNameText}>{nameSaved ? '✓ Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Accessibility */}
      <Text style={styles.sectionTitle}>Accessibility</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Text Size</Text>
        <Text style={styles.fieldHint}>Adjusts the size of text throughout the app.</Text>
        <View style={styles.fontSizeRow}>
          {FONT_SIZE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.fontSizeBtn, fontSize === opt.value && styles.fontSizeBtnActive]}
              onPress={() => setAccessibility({ fontSize: opt.value })}
            >
              <Text style={[styles.fontSizeBtnLabel, fontSize === opt.value && styles.fontSizeBtnLabelActive]}>
                {opt.label}
              </Text>
              <Text style={[styles.fontSizeBtnDesc, fontSize === opt.value && { color: '#FFF' }]}>
                {opt.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>

      <View style={styles.card}>
        {[
          {
            label:       'Dark Mode',
            hint:        'Switches the app to a dark colour scheme.',
            icon:        'moon-outline' as const,
            value:       darkMode,
            onChange:    (v: boolean) => setAccessibility({ darkMode: v }),
          },
          {
            label:       'High Contrast',
            hint:        'Increases colour contrast for better readability.',
            icon:        'contrast-outline' as const,
            value:       highContrast,
            onChange:    (v: boolean) => setAccessibility({ highContrast: v }),
          },
          {
            label:       'Bold Text',
            hint:        'Makes all text heavier throughout the app.',
            icon:        'text-outline' as const,
            value:       boldText,
            onChange:    (v: boolean) => setAccessibility({ boldText: v }),
          },
          {
            label:       'Reduce Motion',
            hint:        'Limits animations for users sensitive to motion.',
            icon:        'pause-circle-outline' as const,
            value:       reduceMotion,
            onChange:    (v: boolean) => setAccessibility({ reduceMotion: v }),
          },
        ].map((item, index, arr) => (
          <View
            key={item.label}
            style={[styles.toggleRow, index === arr.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View style={styles.toggleIconWrap}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { fontSize: fs(14), fontWeight: boldText ? '700' : '600' }]}>
                {item.label}
              </Text>
              <Text style={[styles.toggleHint, { fontSize: fs(12) }]}>{item.hint}</Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        ))}
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleIconWrap}>
            <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Daily Reminder</Text>
            <Text style={styles.toggleHint}>Reminds you to log your mood, health, and habits.</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFF"
          />
        </View>

        {notificationsEnabled && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.fieldLabel}>Reminder Time</Text>
            <Text style={styles.fieldHint}>Choose when you'd like to receive your daily reminder.</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.dropdownText}>{formatHour(reminderHour)}</Text>
              <Ionicons name="chevron-down" size={18} color={Colors.subtext} />
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={showTimePicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Select Reminder Time</Text>
              <FlatList
                data={ALL_HOURS}
                keyExtractor={item => String(item.hour)}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, item.hour === reminderHour && styles.modalOptionActive]}
                    onPress={() => { handleSelectHour(item.hour); setShowTimePicker(false); }}
                  >
                    <Text style={[styles.modalOptionText, item.hour === reminderHour && styles.modalOptionTextActive]}>
                      {item.label}
                    </Text>
                    {item.hour === reminderHour && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* Day Start */}
      <Text style={styles.sectionTitle}>Day Settings</Text>
      <View style={styles.card}>
        <View style={styles.toggleIconWrap}>
          <Ionicons name="sunny-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Text style={styles.fieldLabel}>Day Start Time</Text>
          <Text style={styles.fieldHint}>
            The app treats the day as starting at this time. If it's earlier than this, it's still considered the previous day — useful if you stay up past midnight.
          </Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDayStartPicker(true)}>
            <Text style={styles.dropdownText}>
              {dayStartHour === 0 ? 'Midnight (12:00 AM)' : formatHour(dayStartHour)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.subtext} />
          </TouchableOpacity>
        </View>

        <Modal visible={showDayStartPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDayStartPicker(false)}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Day Start Time</Text>
              <FlatList
                data={ALL_HOURS}
                keyExtractor={item => String(item.hour)}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, item.hour === dayStartHour && styles.modalOptionActive]}
                    onPress={() => { setDayStartHour(item.hour); setShowDayStartPicker(false); }}
                  >
                    <Text style={[styles.modalOptionText, item.hour === dayStartHour && styles.modalOptionTextActive]}>
                      {item.label}
                    </Text>
                    {item.hour === dayStartHour && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* Data Management */}
      <Text style={styles.sectionTitle}>Data Management</Text>
      <View style={styles.card}>
        <Text style={styles.cardNote}>
          Clear specific categories, or wipe everything to start completely fresh.
        </Text>
        {DATA_SECTIONS.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.clearRow,
              index === DATA_SECTIONS.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={item.onPress}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.clearLabel}>{item.label}</Text>
              <Text style={styles.clearHint}>{item.hint}</Text>
            </View>
            <Ionicons name="trash-outline" size={18} color={Colors.red} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.wipeBtn} onPress={confirmWipeAll}>
        <Ionicons name="warning" size={20} color="#FFF" />
        <Text style={styles.wipeBtnText}>Wipe All Data</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 40 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },

  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10 },
  cardNote: { fontSize: 13, color: C.subtext, marginBottom: 12 },

  fieldLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  fieldHint: { fontSize: 12, color: C.subtext, marginBottom: 10 },
  nameRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: C.background, borderRadius: 10, padding: 12, fontSize: 15, color: C.text },
  saveNameBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  saveNameText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  fontSizeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  fontSizeBtn: {
    flex: 1, borderRadius: 10, padding: 10, alignItems: 'center',
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
  },
  fontSizeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  fontSizeBtnLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  fontSizeBtnLabelActive: { color: '#FFF' },
  fontSizeBtnDesc: { fontSize: 10, color: C.subtext, marginTop: 2, textAlign: 'center' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  toggleIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  toggleLabel: { color: C.text },
  toggleHint: { color: C.subtext, marginTop: 1 },

  clearRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  clearLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  clearHint: { fontSize: 12, color: C.subtext, marginTop: 1 },

  wipeBtn: {
    backgroundColor: C.red, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 10,
  },
  wipeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.background, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, marginTop: 8,
  },
  dropdownText: { fontSize: 15, fontWeight: '600', color: C.text },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalSheet: {
    backgroundColor: C.card, borderRadius: 16,
    width: '80%', padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12, textAlign: 'center' },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalOptionActive: { backgroundColor: C.primary + '10', borderRadius: 8 },
  modalOptionText: { fontSize: 15, color: C.text },
  modalOptionTextActive: { fontWeight: '700', color: C.primary },
});
