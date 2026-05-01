import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../../context/AppContext';
import { HealthTargets } from '../../context/AppContext';
import { ColorScheme } from '../../constants/theme';

const getToday = () => new Date().toISOString().split('T')[0];

// Converts decimal hours to "Xh Ym" display string
const formatSleep = (h: number) => {
  if (h === 0) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} h`;
  return `${hrs} h ${mins} min`;
};

const EXERCISE_OPTIONS   = Array.from({ length: 37 }, (_, i) => i * 5);   // 0,5,10…180
const SLEEP_HOUR_OPTIONS = Array.from({ length: 13 }, (_, i) => i);        // 0–12
const SLEEP_MIN_OPTIONS  = Array.from({ length: 12 }, (_, i) => i * 5);    // 0,5,10…55

const ML_PER_OZ = 29.5735;

const formatExercise = (m: number) => {
  if (m === 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} h` : `${h} h ${rem} min`;
};

// ── Sleep Wheel Picker ────────────────────────────────────────────────────────
function SleepDropdown({
  value, onChange, color, cardBg, borderColor, textColor, subtextColor,
}: {
  value: number; onChange: (v: number) => void;
  color: string; cardBg: string; borderColor: string;
  textColor: string; subtextColor: string;
}) {
  const [open,   setOpen]   = useState(false);
  const [tempH,  setTempH]  = useState(7);
  const [tempM,  setTempM]  = useState(0);

  const handleOpen = () => {
    const h = Math.floor(value);
    const m = Math.round(((value - h) * 60) / 5) * 5;
    setTempH(h);
    setTempM(m >= 60 ? 55 : m);
    setOpen(true);
  };

  const handleDone = () => {
    onChange(tempH + tempM / 60);
    setOpen(false);
  };

  const displayText = value === 0 ? '—' : formatSleep(value);

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderWidth: 1.5, borderColor: color + '80', borderRadius: 12,
          paddingHorizontal: 16, paddingVertical: 14, backgroundColor: cardBg,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: value === 0 ? subtextColor : color }}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={18} color={color} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderColor: borderColor,
          }}>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={{ fontSize: 15, color: subtextColor }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Sleep</Text>
            <TouchableOpacity onPress={handleDone}>
              <Text style={{ fontSize: 15, fontWeight: '700', color }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4 }}>
            <WheelColumn options={SLEEP_HOUR_OPTIONS} selected={tempH} onSelect={setTempH}
              format={v => `${v}`} color={color} textColor={textColor} subtextColor={subtextColor} visible={open} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: subtextColor, marginRight: 10, width: 20 }}>h</Text>
            <WheelColumn options={SLEEP_MIN_OPTIONS} selected={tempM} onSelect={setTempM}
              format={v => `${v < 10 ? '0' : ''}${v}`} color={color} textColor={textColor} subtextColor={subtextColor} visible={open} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: subtextColor, marginLeft: 10, width: 32 }}>min</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Exercise Dropdown ─────────────────────────────────────────────────────────
function ExerciseDropdown({
  value, onChange, color, cardBg, borderColor, textColor,
}: {
  value: number; onChange: (v: number) => void;
  color: string; cardBg: string; borderColor: string; textColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderWidth: 1.5, borderColor: color + '80', borderRadius: 12,
          paddingHorizontal: 16, paddingVertical: 14, backgroundColor: cardBg,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: value === 0 ? borderColor : color }}>
          {formatExercise(value)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={color} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={{
            backgroundColor: cardBg, borderRadius: 16, width: 220,
            maxHeight: 340, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, padding: 12, paddingBottom: 8, borderBottomWidth: 1, borderColor }}>
              Select duration
            </Text>
            <ScrollView>
              {EXERCISE_OPTIONS.map(opt => {
                const active = opt === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => { onChange(opt); setOpen(false); }}
                    style={{
                      paddingVertical: 11, paddingHorizontal: 16,
                      backgroundColor: active ? color + '20' : 'transparent',
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ fontSize: 15, color: active ? color : textColor, fontWeight: active ? '700' : '400' }}>
                      {formatExercise(opt)}
                    </Text>
                    {active && <Ionicons name="checkmark" size={15} color={color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Weight Wheel Picker ───────────────────────────────────────────────────────
const KG_OPTIONS    = Array.from({ length: 171 }, (_, i) => i + 30); // 30–200 kg
const DEC_OPTIONS   = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];               // .0–.9
const STONE_OPTIONS = Array.from({ length: 28 },  (_, i) => i + 4);  // 4–31 st
const LBS_OPTIONS   = Array.from({ length: 14 },  (_, i) => i);      // 0–13 lbs

const kgToStLbs = (kg: number) => {
  const totalLbs = kg * 2.20462;
  const st  = Math.floor(totalLbs / 14);
  const lbs = Math.round(totalLbs % 14);
  return { st: Math.max(4, Math.min(31, st)), lbs: Math.min(13, lbs) };
};
const stLbsToKg = (st: number, lbs: number) =>
  parseFloat(((st * 14 + lbs) / 2.20462).toFixed(1));

const ITEM_H   = 46;
const VISIBLE  = 5;
const PICKER_H = ITEM_H * VISIBLE;

function WheelColumn({
  options, selected, onSelect, format, color, textColor, subtextColor, visible,
}: {
  options: number[]; selected: number; onSelect: (v: number) => void;
  format: (v: number) => string; color: string;
  textColor: string; subtextColor: string; visible: boolean;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const idx = Math.max(0, options.indexOf(selected));
    const timer = setTimeout(() => {
      ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(options.length - 1, idx));
    onSelect(options[clamped]);
  };

  return (
    <View style={{ flex: 1, height: PICKER_H, overflow: 'hidden' }}>
      {/* Selection highlight bar */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', zIndex: 2,
          top: ITEM_H * 2, height: ITEM_H, left: 4, right: 4,
          backgroundColor: color + '18', borderRadius: 8,
          borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: color + '60',
        }}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
      >
        {options.map((opt, i) => {
          const active = opt === selected;
          return (
            <View key={i} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{
                fontSize: active ? 22 : 16,
                fontWeight: active ? '700' : '400',
                color: active ? color : subtextColor,
              }}>
                {format(opt)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function WeightDropdown({
  value, onChange, color, cardBg, borderColor, textColor, subtextColor,
}: {
  value: number; onChange: (v: number) => void;
  color: string; cardBg: string; borderColor: string;
  textColor: string; subtextColor: string;
}) {
  const [open,    setOpen]    = useState(false);
  const [unit,    setUnit]    = useState<'kg' | 'st'>('kg');
  const [tempKg,  setTempKg]  = useState(70);
  const [tempDec, setTempDec] = useState(0);
  const [tempSt,  setTempSt]  = useState(11);
  const [tempLbs, setTempLbs] = useState(0);

  const handleOpen = () => {
    if (value > 0) {
      setTempKg(Math.floor(value));
      setTempDec(Math.round((value % 1) * 10));
      const { st, lbs } = kgToStLbs(value);
      setTempSt(st); setTempLbs(lbs);
    } else {
      setTempKg(70); setTempDec(0); setTempSt(11); setTempLbs(0);
    }
    setOpen(true);
  };

  const handleDone = () => {
    const result = unit === 'kg'
      ? parseFloat(`${tempKg}.${tempDec}`)
      : stLbsToKg(tempSt, tempLbs);
    onChange(result);
    setOpen(false);
  };

  // Switch units and convert the current temp selection across
  const switchUnit = (next: 'kg' | 'st') => {
    if (next === unit) return;
    if (next === 'st') {
      const kg = parseFloat(`${tempKg}.${tempDec}`);
      const { st, lbs } = kgToStLbs(kg);
      setTempSt(st); setTempLbs(lbs);
    } else {
      const kg = stLbsToKg(tempSt, tempLbs);
      setTempKg(Math.floor(kg));
      setTempDec(Math.round((kg % 1) * 10));
    }
    setUnit(next);
  };

  const displayText = value <= 0 ? '—'
    : unit === 'kg'
      ? `${Math.floor(value)}.${Math.round((value % 1) * 10)} kg`
      : (() => { const { st, lbs } = kgToStLbs(value); return `${st} st ${lbs} lbs`; })();

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderWidth: 1.5, borderColor: color + '80', borderRadius: 12,
          paddingHorizontal: 16, paddingVertical: 14, backgroundColor: cardBg,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', color: value === 0 ? subtextColor : color }}>
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={18} color={color} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>

          {/* Header */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderColor: borderColor,
          }}>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={{ fontSize: 15, color: subtextColor }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Weight</Text>
            <TouchableOpacity onPress={handleDone}>
              <Text style={{ fontSize: 15, fontWeight: '700', color }}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Unit toggle */}
          <View style={{
            flexDirection: 'row', margin: 16, marginBottom: 4,
            backgroundColor: borderColor, borderRadius: 10, padding: 3,
          }}>
            {(['kg', 'st'] as const).map(u => (
              <TouchableOpacity
                key={u}
                onPress={() => switchUnit(u)}
                style={{
                  flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center',
                  backgroundColor: unit === u ? cardBg : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 14, fontWeight: '700',
                  color: unit === u ? color : subtextColor,
                }}>
                  {u === 'kg' ? 'kg' : 'stone'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Wheel columns */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4 }}>
            {unit === 'kg' ? (
              <>
                <WheelColumn options={KG_OPTIONS} selected={tempKg} onSelect={setTempKg}
                  format={v => `${v}`} color={color} textColor={textColor} subtextColor={subtextColor} visible={open} />
                <Text style={{ fontSize: 26, fontWeight: '700', color: textColor, marginHorizontal: 2 }}>.</Text>
                <WheelColumn options={DEC_OPTIONS} selected={tempDec} onSelect={setTempDec}
                  format={v => `${v}`} color={color} textColor={textColor} subtextColor={subtextColor} visible={open} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: subtextColor, marginLeft: 10, width: 28 }}>kg</Text>
              </>
            ) : (
              <>
                <WheelColumn options={STONE_OPTIONS} selected={tempSt} onSelect={setTempSt}
                  format={v => `${v}`} color={color} textColor={textColor} subtextColor={subtextColor} visible={open} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: subtextColor, marginRight: 10, width: 24 }}>st</Text>
                <WheelColumn options={LBS_OPTIONS} selected={tempLbs} onSelect={setTempLbs}
                  format={v => `${v}`} color={color} textColor={textColor} subtextColor={subtextColor} visible={open} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: subtextColor, marginLeft: 10, width: 32 }}>lbs</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({
  value, onChange, step, min, max, unit, decimals = 0, color, styles,
}: {
  value: number; onChange: (v: number) => void;
  step: number; min: number; max: number;
  unit: string; decimals?: number; color: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity
        style={[styles.stepBtn, { borderColor: color }]}
        onPress={() => onChange(Math.max(min, parseFloat((value - step).toFixed(decimals + 1))))}
      >
        <Ionicons name="remove" size={20} color={color} />
      </TouchableOpacity>
      <TextInput
        style={[styles.stepValue, { color }]}
        value={value === 0 ? '' : value.toFixed(decimals)}
        onChangeText={t => { const n = parseFloat(t); if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n))); else if (t === '') onChange(0); }}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={color + '60'}
        textAlign="center"
      />
      <Text style={styles.stepUnit}>{unit}</Text>
      <TouchableOpacity
        style={[styles.stepBtn, { borderColor: color }]}
        onPress={() => onChange(Math.min(max, parseFloat((value + step).toFixed(decimals + 1))))}
      >
        <Ionicons name="add" size={20} color={color} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HealthScreen() {
  const { healthEntries, addHealthEntry, updateHealthEntry, getTodayHealthEntry, healthTargets, setHealthTargets, getEffectiveToday } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  // Log modal state (numbers, not strings)
  const [logModal, setLogModal]       = useState(false);
  const [logDate, setLogDate]         = useState(() => getEffectiveToday());
  const [waterUnit, setWaterUnit]     = useState<'ml' | 'oz'>('ml');
  const [waterVal, setWaterVal]       = useState(0);
  const [sleepVal, setSleepVal]       = useState(0);
  const [exerciseVal, setExerciseVal] = useState(0);
  const [weightVal, setWeightVal]     = useState(0);

  // Targets modal state
  const [targetModal, setTargetModal]   = useState(false);
  const [tWater, setTWater]             = useState(healthTargets.water);
  const [tSleep, setTSleep]             = useState(healthTargets.sleep);
  const [tExercise, setTExercise]       = useState(healthTargets.exercise);

  const todayEntry = getTodayHealthEntry();

  const loadEntryForDate = (date: string) => {
    const entry = healthEntries.find(e => e.date === date);
    if (entry) {
      setWaterVal(entry.waterIntake);
      setSleepVal(entry.sleepHours);
      setExerciseVal(entry.exerciseMinutes);
      setWeightVal(entry.weight ?? 0);
    } else {
      setWaterVal(0); setSleepVal(0); setExerciseVal(0); setWeightVal(0);
    }
  };

  const openLog = () => {
    const d = getToday();
    setLogDate(d);
    loadEntryForDate(d);
    setLogModal(true);
  };

  const changeLogDate = (delta: number) => {
    const d = new Date(logDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().split('T')[0];
    if (newDate > getToday()) return;
    setLogDate(newDate);
    loadEntryForDate(newDate);
  };

  const formatLogDate = (date: string) => {
    const todayStr = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (date === todayStr) return 'Today';
    if (date === yStr) return 'Yesterday';
    return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const handleSave = () => {
    if (!waterVal && !sleepVal && !exerciseVal && !weightVal) {
      Alert.alert('Please enter at least one value before saving.');
      return;
    }
    const data = {
      date: logDate,
      waterIntake: waterVal || 0,
      sleepHours: sleepVal || 0,
      exerciseMinutes: exerciseVal || 0,
      weight: weightVal > 0 ? weightVal : undefined,
    };
    const existingEntry = healthEntries.find(e => e.date === logDate);
    if (existingEntry) updateHealthEntry(existingEntry.id, data);
    else addHealthEntry(data);
    setLogModal(false);
  };

  const openTargets = () => {
    setTWater(healthTargets.water);
    setTSleep(healthTargets.sleep);
    setTExercise(healthTargets.exercise);
    setTargetModal(true);
  };

  const saveTargets = () => {
    if (!tWater || !tSleep || !tExercise) {
      Alert.alert('Please set all target values.');
      return;
    }
    setHealthTargets({ water: tWater, sleep: tSleep, exercise: tExercise });
    setTargetModal(false);
  };

  // Last 7 days
  // Build Mon–Sun for the current week
  const todayDate = new Date();
  const dayOfWeek = (todayDate.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday    = new Date(todayDate);
  monday.setDate(todayDate.getDate() - dayOfWeek);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date  = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
    const entry = healthEntries.find(e => e.date === date);
    return { date, label, entry };
  });

  const loggedDays = last7.filter(d => d.entry);

  // Monthly consistency data
  const [consistencyView, setConsistencyView] = useState<'week' | 'month'>('week');
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrentMonth) return; // don't go into the future
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const monthYear      = new Date(viewYear, viewMonth, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d    = new Date(viewYear, viewMonth, i + 1);
    const date = d.toISOString().split('T')[0];
    return { day: i + 1, date, logged: !!healthEntries.find(e => e.date === date) };
  });
  const monthLoggedCount = monthDays.filter(d => d.logged).length;

  const pct = (value: number, target: number) => Math.min(Math.round((value / target) * 100), 100);

  const todayMetrics = todayEntry ? [
    { icon: 'water'   as const, label: 'Water',    value: todayEntry.waterIntake,     unit: 'ml',  target: healthTargets.water,    color: Colors.blue    },
    { icon: 'barbell' as const, label: 'Exercise', value: todayEntry.exerciseMinutes, unit: 'min', target: healthTargets.exercise, color: Colors.green   },
    { icon: 'moon'    as const, label: 'Sleep',    value: todayEntry.sleepHours,      unit: 'h',   target: healthTargets.sleep,    color: Colors.primary },
  ] : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Health Tracking</Text>

      {/* Log / Update button */}
      <TouchableOpacity style={styles.logBtn} onPress={openLog}>
        <Ionicons name={todayEntry ? 'pencil' : 'add-circle'} size={20} color="#FFF" />
        <Text style={styles.logBtnText}>
          {todayEntry ? "Update Today's Health Data" : "Log Today's Health Data"}
        </Text>
      </TouchableOpacity>

      {/* ── Daily Targets ── */}
      <View style={styles.targetsCard}>
        <View style={styles.targetsHeader}>
          <Text style={styles.targetsTitle}>Daily Targets</Text>
          <TouchableOpacity style={styles.editTargetsBtn} onPress={openTargets}>
            <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
            <Text style={styles.editTargetsText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.targetsRow}>
          {[
            { icon: 'water'   as const, label: 'Water',    value: `${healthTargets.water}ml`,       color: Colors.blue    },
            { icon: 'barbell' as const, label: 'Exercise', value: `${healthTargets.exercise}min`,   color: Colors.green   },
            { icon: 'moon'    as const, label: 'Sleep',    value: `${healthTargets.sleep}h`,         color: Colors.primary },
          ].map(t => (
            <View key={t.label} style={[styles.targetItem, { backgroundColor: t.color + '15' }]}>
              <Ionicons name={t.icon} size={16} color={t.color} />
              <Text style={[styles.targetValue, { color: t.color }]}>{t.value}</Text>
              <Text style={styles.targetLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Today's Metrics ── */}
      {todayEntry ? (
        <>
          <Text style={styles.sectionTitle}>Today's Data</Text>
          <View style={styles.metricsRow}>
            {todayMetrics.map(m => {
              const p = pct(m.value, m.target);
              const met = p >= 100;
              return (
                <View key={m.label} style={[styles.metricCard, { borderTopColor: m.color, borderTopWidth: 3 }]}>
                  <View style={styles.metricTop}>
                    <Ionicons name={m.icon} size={18} color={m.color} />
                    {met && (
                      <View style={[styles.targetBadge, { backgroundColor: m.color + '25' }]}>
                        <Ionicons name="checkmark-circle" size={11} color={m.color} />
                        <Text style={[styles.targetBadgeText, { color: m.color }]}>Goal</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                  <Text style={styles.metricUnit}>{m.unit}</Text>
                  <View style={styles.metricBarBg}>
                    <View style={[styles.metricBarFill, { width: `${p}%`, backgroundColor: m.color }]} />
                  </View>
                  <Text style={styles.metricPct}>{p}%</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>
          {todayEntry.weight && (
            <View style={styles.weightCard}>
              <Ionicons name="body" size={20} color={Colors.orange} />
              <Text style={styles.weightLabel}>Weight</Text>
              <Text style={[styles.weightValue, { color: Colors.orange }]}>{todayEntry.weight} kg</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="heart-outline" size={40} color={Colors.subtext} />
          <Text style={styles.emptyTitle}>No data logged yet</Text>
          <Text style={styles.emptySub}>Tap the button above to log your health stats for today.</Text>
        </View>
      )}

      {/* ── Consistency ── */}
      <View style={styles.consistencyHeaderRow}>
        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Consistency</Text>
        <View style={styles.consistencyToggle}>
          {(['week', 'month'] as const).map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => setConsistencyView(v)}
              style={[styles.consistencyToggleBtn, consistencyView === v && { backgroundColor: Colors.primary }]}
            >
              <Text style={[styles.consistencyToggleText, consistencyView === v && { color: '#FFF' }]}>
                {v === 'week' ? 'Weekly' : 'Monthly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.consistencyCard}>
        {consistencyView === 'week' ? (
          <>
            <View style={styles.consistencyRow}>
              {last7.map((d, i) => {
                const isToday = d.date === getToday();
                const logged  = !!d.entry;
                return (
                  <View key={i} style={styles.consistencyItem}>
                    <View style={[
                      styles.consistencyDot,
                      logged  ? { backgroundColor: Colors.green } :
                      isToday ? { backgroundColor: Colors.primary + '40', borderColor: Colors.primary, borderWidth: 2 } :
                                { backgroundColor: Colors.border },
                    ]}>
                      {logged && <Ionicons name="checkmark" size={11} color="#FFF" />}
                    </View>
                    <Text style={[styles.consistencyLabel, isToday && { color: Colors.primary, fontWeight: '700' }]}>
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.consistencySub}>{loggedDays.length} / 7 days logged this week</Text>
          </>
        ) : (
          <>
            <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                <Ionicons name="chevron-back" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthYear}</Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={[styles.monthNavBtn, isCurrentMonth && { opacity: 0.3 }]}
                disabled={isCurrentMonth}
              >
                <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {/* Day-of-week headers */}
            <View style={styles.monthGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <Text key={i} style={styles.monthHeader}>{d}</Text>
              ))}
              {/* Blank offset cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`blank-${i}`} style={styles.monthCell} />
              ))}
              {/* Day cells */}
              {monthDays.map(({ day, date, logged }) => {
                const isToday = date === getToday();
                const isFuture = date > getToday();
                return (
                  <View
                    key={day}
                    style={[
                      styles.monthCell,
                      styles.monthDayCell,
                      logged   ? { backgroundColor: Colors.green } :
                      isToday  ? { borderWidth: 1.5, borderColor: Colors.primary } :
                      isFuture ? { backgroundColor: 'transparent' } :
                                 { backgroundColor: Colors.border },
                    ]}
                  >
                    <Text style={[
                      styles.monthDayNum,
                      logged   ? { color: '#FFF', fontWeight: '700' } :
                      isToday  ? { color: Colors.primary, fontWeight: '700' } :
                      isFuture ? { color: Colors.border } :
                                 { color: Colors.subtext },
                    ]}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.consistencySub}>{monthLoggedCount} / {daysInMonth} days logged this month</Text>
          </>
        )}
      </View>

      {/* ══════════════════════════════════════════════
          LOG MODAL
      ══════════════════════════════════════════════ */}
      <Modal visible={logModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>
              {healthEntries.find(e => e.date === logDate) ? 'Update Health Data' : 'Log Health Data'}
            </Text>

            {/* Date selector */}
            <View style={styles.datePicker}>
              <TouchableOpacity onPress={() => changeLogDate(-1)} style={styles.dateNavBtn}>
                <Ionicons name="chevron-back" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <View style={styles.datePickerCenter}>
                <Ionicons name="calendar-outline" size={14} color={Colors.subtext} />
                <Text style={styles.datePickerText}>{formatLogDate(logDate)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => changeLogDate(1)}
                style={[styles.dateNavBtn, logDate >= getEffectiveToday() && { opacity: 0.3 }]}
                disabled={logDate >= getEffectiveToday()}
              >
                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Water */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="water" size={18} color={Colors.blue} />
                <Text style={[styles.modalSectionTitle, { color: Colors.blue }]}>Water Intake</Text>
              </View>
              <View style={styles.unitToggle}>
                {(['ml', 'oz'] as const).map(u => (
                  <TouchableOpacity key={u} onPress={() => setWaterUnit(u)}
                    style={[styles.unitBtn, waterUnit === u && { backgroundColor: Colors.blue }]}>
                    <Text style={[styles.unitBtnText, waterUnit === u && { color: '#FFF' }]}>
                      {u === 'ml' ? 'ml' : 'fl oz'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Stepper
                value={waterUnit === 'ml' ? waterVal : Math.round(waterVal / ML_PER_OZ)}
                onChange={v => setWaterVal(waterUnit === 'ml' ? v : Math.round(v * ML_PER_OZ))}
                step={waterUnit === 'ml' ? 250 : 8}
                min={0}
                max={waterUnit === 'ml' ? 5000 : 170}
                unit={waterUnit === 'ml' ? 'ml' : 'fl oz'}
                color={Colors.blue}
                styles={styles}
              />
            </View>

            {/* Exercise */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="barbell" size={18} color={Colors.green} />
                <Text style={[styles.modalSectionTitle, { color: Colors.green }]}>Exercise</Text>
              </View>
              <ExerciseDropdown value={exerciseVal} onChange={setExerciseVal} color={Colors.green} cardBg={Colors.background} borderColor={Colors.border} textColor={Colors.text} />
            </View>

            {/* Sleep */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="moon" size={18} color={Colors.primary} />
                <Text style={[styles.modalSectionTitle, { color: Colors.primary }]}>Sleep</Text>
              </View>
              <SleepDropdown value={sleepVal} onChange={setSleepVal} color={Colors.primary} cardBg={Colors.background} borderColor={Colors.border} textColor={Colors.text} subtextColor={Colors.subtext} />
            </View>

            {/* Weight */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="body" size={18} color={Colors.orange} />
                <Text style={[styles.modalSectionTitle, { color: Colors.orange }]}>Weight</Text>
              </View>
              <WeightDropdown value={weightVal} onChange={setWeightVal} color={Colors.orange} cardBg={Colors.background} borderColor={Colors.border} textColor={Colors.text} subtextColor={Colors.subtext} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          TARGETS MODAL
      ══════════════════════════════════════════════ */}
      <Modal visible={targetModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Daily Targets</Text>

            {/* Water target */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="water" size={18} color={Colors.blue} />
                <Text style={[styles.modalSectionTitle, { color: Colors.blue }]}>Water Target</Text>
              </View>
              <View style={styles.unitToggle}>
                {(['ml', 'oz'] as const).map(u => (
                  <TouchableOpacity key={u} onPress={() => setWaterUnit(u)}
                    style={[styles.unitBtn, waterUnit === u && { backgroundColor: Colors.blue }]}>
                    <Text style={[styles.unitBtnText, waterUnit === u && { color: '#FFF' }]}>
                      {u === 'ml' ? 'ml' : 'fl oz'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Stepper
                value={waterUnit === 'ml' ? tWater : Math.round(tWater / ML_PER_OZ)}
                onChange={v => setTWater(waterUnit === 'ml' ? v : Math.round(v * ML_PER_OZ))}
                step={waterUnit === 'ml' ? 250 : 8}
                min={waterUnit === 'ml' ? 250 : 8}
                max={waterUnit === 'ml' ? 5000 : 170}
                unit={waterUnit === 'ml' ? 'ml' : 'fl oz'}
                color={Colors.blue}
                styles={styles}
              />
            </View>

            {/* Exercise target */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="barbell" size={18} color={Colors.green} />
                <Text style={[styles.modalSectionTitle, { color: Colors.green }]}>Exercise Target</Text>
              </View>
              <ExerciseDropdown value={tExercise} onChange={setTExercise} color={Colors.green} cardBg={Colors.background} borderColor={Colors.border} textColor={Colors.text} />
            </View>

            {/* Sleep target */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <Ionicons name="moon" size={18} color={Colors.primary} />
                <Text style={[styles.modalSectionTitle, { color: Colors.primary }]}>Sleep Target</Text>
              </View>
              <SleepDropdown value={tSleep} onChange={setTSleep} color={Colors.primary} cardBg={Colors.background} borderColor={Colors.border} textColor={Colors.text} subtextColor={Colors.subtext} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveTargets}>
              <Text style={styles.saveBtnText}>Save Targets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setTargetModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.background },
  content:      { padding: 16, paddingBottom: 40 },
  screenTitle:  { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },

  logBtn:     { backgroundColor: C.primary, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ── Targets card ──
  targetsCard:    { backgroundColor: C.card, borderRadius: 14, padding: 14, marginTop: 14 },
  targetsHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  targetsTitle:   { fontSize: 15, fontWeight: '700', color: C.text },
  editTargetsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editTargetsText:{ fontSize: 13, fontWeight: '600', color: C.primary },
  targetsRow:     { flexDirection: 'row', gap: 8 },
  targetItem:     { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 3 },
  targetValue:    { fontSize: 14, fontWeight: '800' },
  targetLabel:    { fontSize: 10, color: C.subtext },

  // ── Today metric cards ──
  metricsRow:      { flexDirection: 'row', gap: 10 },
  metricCard:      { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12, alignItems: 'center', gap: 2 },
  metricTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 6 },
  targetBadge:     { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  targetBadgeText: { fontSize: 9, fontWeight: '700' },
  metricValue:     { fontSize: 22, fontWeight: '800' },
  metricUnit:      { fontSize: 10, color: C.subtext, marginBottom: 4 },
  metricBarBg:     { width: '100%', height: 5, backgroundColor: C.border, borderRadius: 3 },
  metricBarFill:   { height: 5, borderRadius: 3 },
  metricPct:       { fontSize: 10, color: C.subtext, marginTop: 2 },
  metricLabel:     { fontSize: 11, fontWeight: '600', color: C.subtext, marginTop: 2 },

  weightCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 14, padding: 14, marginTop: 10 },
  weightLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
  weightValue: { fontSize: 18, fontWeight: '800' },

  emptyCard:  { backgroundColor: C.card, borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.subtext },
  emptySub:   { fontSize: 13, color: C.subtext, textAlign: 'center', lineHeight: 18 },

  // ── Consistency ──
  consistencyHeaderRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  consistencyToggle:     { flexDirection: 'row', backgroundColor: C.border, borderRadius: 10, padding: 3 },
  consistencyToggleBtn:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  consistencyToggleText: { fontSize: 12, fontWeight: '700', color: C.subtext },

  consistencyCard:  { backgroundColor: C.card, borderRadius: 14, padding: 14 },
  consistencyRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  consistencyItem:  { alignItems: 'center', gap: 4 },
  consistencyDot:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  consistencyLabel: { fontSize: 10, color: C.subtext },
  consistencySub:   { fontSize: 12, color: C.subtext, textAlign: 'center', marginTop: 10 },

  monthNavRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthNavBtn:   { padding: 4 },
  monthTitle:    { fontSize: 14, fontWeight: '700', color: C.text },
  monthGrid:     { flexDirection: 'row', flexWrap: 'wrap' },
  monthHeader:   { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '700', color: C.subtext, paddingVertical: 4 },
  monthCell:     { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  monthDayCell:  { borderRadius: 100 },
  monthDayNum:   { fontSize: 11 },

  // ── Modals ──
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:      { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },

  datePicker:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.background, borderRadius: 12, marginBottom: 20, paddingVertical: 4 },
  dateNavBtn:       { padding: 8 },
  datePickerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  datePickerText:   { fontSize: 15, fontWeight: '700', color: C.text },

  modalSection:       { marginBottom: 20 },
  modalSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  modalSectionTitle:  { fontSize: 15, fontWeight: '700' },

  unitToggle:   { flexDirection: 'row', backgroundColor: C.border, borderRadius: 10, padding: 3, marginBottom: 12 },
  unitBtn:      { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  unitBtnText:  { fontSize: 13, fontWeight: '700', color: C.subtext },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn:    { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  stepValue:  { flex: 1, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  stepUnit:   { fontSize: 14, color: C.subtext, fontWeight: '600', width: 36 },

  saveBtn:      { backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn:    { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 6 },
  cancelBtnText:{ color: C.subtext, fontSize: 15 },
});
