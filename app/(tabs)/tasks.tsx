import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, useColors } from '../../context/AppContext';
import { ColorScheme } from '../../constants/theme';
import { AppTask, Goal } from '../../types';

type FilterTab = 'all' | 'active' | 'done' | 'priority';
type Priority = 'low' | 'medium' | 'high';

const PRIORITY_CONFIG: Record<Priority, { color: string; label: string }> = {
  high:   { color: '#EF4444', label: 'High'   },
  medium: { color: '#F59E0B', label: 'Medium' },
  low:    { color: '#10B981', label: 'Low'    },
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

const getToday = () => new Date().toISOString().split('T')[0];

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

function getDueDateStyle(
  dueDate: string | undefined,
  Colors: ColorScheme,
): { label: string; color: string; bg: string } | null {
  if (!dueDate) return null;
  const today    = getToday();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dueDate < today)      return { label: 'Overdue',          color: Colors.red,    bg: Colors.red    + '15' };
  if (dueDate === today)    return { label: 'Due today',        color: Colors.orange, bg: Colors.orange + '15' };
  if (dueDate === tomorrow) return { label: 'Tomorrow',         color: Colors.yellow, bg: Colors.yellow + '15' };
  return { label: formatDate(dueDate), color: Colors.subtext, bg: Colors.background };
}

// ── Calendar picker ──────────────────────────────────────────────────────────

function CalendarPicker({
  selected, onSelect, onClose,
}: {
  selected?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const Colors = useColors();
  const cal = makeCal(Colors);
  const now = new Date();
  const [year, setYear]   = useState(selected ? parseInt(selected.slice(0, 4)) : now.getFullYear());
  const [month, setMonth] = useState(selected ? parseInt(selected.slice(5, 7)) - 1 : now.getMonth());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const today          = getToday();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={cal.title}>{MONTH_NAMES[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={cal.dayRow}>
        {DAY_LABELS.map(d => <Text key={d} style={cal.dayLabel}>{d}</Text>)}
      </View>

      <View style={cal.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={cal.cell} />;
          const dateStr    = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday    = dateStr === today;
          const isSelected = dateStr === selected;
          return (
            <TouchableOpacity
              key={dateStr}
              style={[cal.cell, isSelected && cal.cellSelected, isToday && !isSelected && cal.cellToday]}
              onPress={() => onSelect(dateStr)}
            >
              <Text style={[
                cal.dayNum,
                isSelected && cal.dayNumSelected,
                isToday && !isSelected && { color: Colors.primary, fontWeight: '700' },
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={cal.footer}>
        <TouchableOpacity style={cal.clearBtn} onPress={() => onSelect('')}>
          <Text style={cal.clearText}>Clear date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cal.doneBtn} onPress={onClose}>
          <Text style={cal.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete }: {
  task: AppTask;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { addSubTask, toggleSubTask, deleteSubTask } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);
  const [expanded, setExpanded]         = useState(false);
  const [newSubTask, setNewSubTask]     = useState('');
  const [addingSubTask, setAddingSubTask] = useState(false);

  const cfg         = PRIORITY_CONFIG[task.priority];
  const dueBadge    = getDueDateStyle(task.dueDate, Colors);
  const subTasks    = task.subTasks ?? [];
  const subDone     = subTasks.filter(s => s.completed).length;
  const subTotal    = subTasks.length;
  const hasSubTasks = subTotal > 0;

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    addSubTask(task.id, newSubTask.trim());
    setNewSubTask('');
    setAddingSubTask(false);
  };

  return (
    <View style={[styles.taskCard, task.completed ? styles.taskDone : { backgroundColor: Colors.card, borderLeftWidth: 3, borderLeftColor: cfg.color }]}>
      {/* Main row */}
      <View style={styles.taskMainRow}>
        <TouchableOpacity onPress={onToggle} style={styles.taskCheck}>
          <Ionicons
            name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={task.completed ? Colors.green : Colors.subtext}
          />
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: cfg.color + '20' }]}>
              <Text style={[styles.priorityText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {dueBadge && (
              <View style={[styles.dueBadge, { backgroundColor: dueBadge.bg }]}>
                <Ionicons name="calendar-outline" size={10} color={dueBadge.color} />
                <Text style={[styles.dueText, { color: dueBadge.color }]}>{dueBadge.label}</Text>
              </View>
            )}
            {hasSubTasks && (
              <View style={styles.subTaskBadge}>
                <Ionicons name="list-outline" size={10} color={Colors.subtext} />
                <Text style={styles.subTaskBadgeText}>{subDone}/{subTotal}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.expandBtn}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.subtext} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.subtext} />
        </TouchableOpacity>
      </View>

      {/* Sub-tasks (expanded) */}
      {expanded && (
        <View style={styles.subTaskSection}>
          <View style={styles.subTaskDivider} />

          {subTasks.map(sub => (
            <View key={sub.id} style={styles.subTaskRow}>
              <TouchableOpacity onPress={() => toggleSubTask(task.id, sub.id)}>
                <Ionicons
                  name={sub.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={sub.completed ? Colors.green : Colors.subtext}
                />
              </TouchableOpacity>
              <Text style={[styles.subTaskTitle, sub.completed && styles.subTaskTitleDone]}>
                {sub.title}
              </Text>
              <TouchableOpacity onPress={() => deleteSubTask(task.id, sub.id)} style={styles.subDeleteBtn}>
                <Ionicons name="close" size={14} color={Colors.subtext} />
              </TouchableOpacity>
            </View>
          ))}

          {addingSubTask ? (
            <View style={styles.addSubTaskRow}>
              <TextInput
                style={styles.subTaskInput}
                value={newSubTask}
                onChangeText={setNewSubTask}
                placeholder="Sub-task name..."
                placeholderTextColor={Colors.subtext}
                autoFocus
                onSubmitEditing={handleAddSubTask}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={handleAddSubTask} style={styles.subAddConfirmBtn}>
                <Ionicons name="checkmark" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddingSubTask(false); setNewSubTask(''); }}>
                <Ionicons name="close" size={18} color={Colors.subtext} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addSubTaskBtn} onPress={() => setAddingSubTask(true)}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addSubTaskText}>Add sub-task</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Goals ─────────────────────────────────────────────────────────────────────

type GoalCategory = Goal['category'];
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_CONFIG: Record<GoalCategory, { icon: IoniconsName; color: string; label: string }> = {
  health:    { icon: 'heart',         color: '#EF4444', label: 'Health'    },
  fitness:   { icon: 'barbell',       color: '#F97316', label: 'Fitness'   },
  personal:  { icon: 'person',        color: '#7C3AED', label: 'Personal'  },
  career:    { icon: 'briefcase',     color: '#3B82F6', label: 'Career'    },
  education: { icon: 'book',          color: '#10B981', label: 'Education' },
  mental:    { icon: 'happy',         color: '#22D3EE', label: 'Mental'    },
  financial: { icon: 'cash',          color: '#F59E0B', label: 'Finance'   },
  social:    { icon: 'people',        color: '#EC4899', label: 'Social'    },
  creative:  { icon: 'color-palette', color: '#8B5CF6', label: 'Creative'  },
  travel:    { icon: 'airplane',      color: '#06B6D4', label: 'Travel'    },
  other:     { icon: 'apps',          color: '#94A3B8', label: 'Other'     },
};

const parseDMY = (dmy: string): string | null => {
  const match = dmy.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  if (isNaN(date.getTime())) return null;
  return `${y}-${m}-${d}`;
};

const daysRemaining = (targetDate: string) => {
  const today = new Date(new Date().toISOString().split('T')[0]).getTime();
  return Math.round((new Date(targetDate).getTime() - today) / 86400000);
};

function GoalsView() {
  const { goals, addGoal, deleteGoal, updateGoalProgress, addMilestone, toggleMilestone } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const [goalModal, setGoalModal]           = useState(false);
  const [showGoalCalendar, setShowGoalCalendar] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [activeGoalId, setActiveGoalId]     = useState<string | null>(null);
  const [title, setTitle]                   = useState('');
  const [description, setDescription]       = useState('');
  const [category, setCategory]             = useState<GoalCategory>('personal');
  const [targetDate, setTargetDate]         = useState<string | undefined>();
  const [milestoneTitle, setMilestoneTitle] = useState('');

  const handleAddGoal = () => {
    if (!title.trim())   { Alert.alert('Please enter a goal title.'); return; }
    if (!targetDate)     { Alert.alert('Please select a target date.'); return; }
    addGoal({ title: title.trim(), description: description.trim(), category, targetDate });
    setTitle(''); setDescription(''); setCategory('personal'); setTargetDate(undefined);
    setShowGoalCalendar(false);
    setGoalModal(false);
  };

  const handleAddMilestone = () => {
    if (!milestoneTitle.trim() || !activeGoalId) return;
    addMilestone(activeGoalId, milestoneTitle.trim());
    setMilestoneTitle('');
    setMilestoneModal(false);
  };

  const activeGoals    = goals.filter(g => g.progress < 100);
  const completedGoals = goals.filter(g => g.progress >= 100);

  const renderGoal = (goal: Goal, isCompleted = false) => {
    const cfg  = CATEGORY_CONFIG[goal.category];
    const days = daysRemaining(goal.targetDate);
    return (
      <View key={goal.id} style={[styles.goalCard, isCompleted && styles.goalCardDone]}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconBadge, { backgroundColor: cfg.color + '20' }]}>
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.description ? <Text style={styles.goalDesc}>{goal.description}</Text> : null}
          </View>
          {!isCompleted && (
            <TouchableOpacity
              onPress={() => Alert.alert('Delete goal', `Remove "${goal.title}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
              ])}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={17} color={Colors.subtext} />
            </TouchableOpacity>
          )}
        </View>

        {!isCompleted && (
          <>
            <View style={styles.goalProgressRow}>
              <Text style={styles.goalProgressLabel}>Progress</Text>
              <Text style={[styles.goalProgressPct, { color: cfg.color }]}>{goal.progress}%</Text>
            </View>
            <View style={styles.goalProgressBg}>
              <View style={[styles.goalProgressFill, { width: `${goal.progress}%`, backgroundColor: cfg.color }]} />
            </View>
            <View style={styles.stepperRow}>
              {[0, 25, 50, 75, 100].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.stepBtn, goal.progress === val && { backgroundColor: cfg.color }]}
                  onPress={() => updateGoalProgress(goal.id, val)}
                >
                  <Text style={[styles.stepBtnText, goal.progress === val && { color: '#FFF' }]}>{val}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        )}

        <View style={styles.goalDateRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.subtext} />
          <Text style={styles.goalDateText}>
            Target: {formatDate(goal.targetDate)}
          </Text>
          {!isCompleted && (
            <Text style={[styles.goalDaysText, { color: days < 0 ? Colors.red : days < 7 ? Colors.orange : Colors.subtext }]}>
              {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
            </Text>
          )}
        </View>

        {!isCompleted && (
          <>
            {goal.milestones.length > 0 && (
              <View style={styles.milestones}>
                <Text style={styles.milestonesTitle}>Milestones</Text>
                {goal.milestones.map(m => (
                  <TouchableOpacity key={m.id} style={styles.milestoneRow} onPress={() => toggleMilestone(goal.id, m.id)}>
                    <Ionicons name={m.completed ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={m.completed ? Colors.green : Colors.subtext} />
                    <Text style={[styles.milestoneTitle, m.completed && styles.milestoneDone]}>{m.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.addMilestoneBtn} onPress={() => { setActiveGoalId(goal.id); setMilestoneTitle(''); setMilestoneModal(true); }}>
              <Ionicons name="add" size={16} color={cfg.color} />
              <Text style={[styles.addMilestoneText, { color: cfg.color }]}>Add Milestone</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.goalStatsRow}>
        <View style={[styles.goalStatCard, { backgroundColor: Colors.blue + '20' }]}>
          <Ionicons name="flag" size={20} color={Colors.blue} />
          <Text style={[styles.goalStatNum, { color: Colors.blue }]}>{activeGoals.length}</Text>
          <Text style={styles.goalStatLabel}>Active</Text>
        </View>
        <View style={[styles.goalStatCard, { backgroundColor: Colors.green + '20' }]}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
          <Text style={[styles.goalStatNum, { color: Colors.green }]}>{completedGoals.length}</Text>
          <Text style={styles.goalStatLabel}>Completed</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary }]} onPress={() => setGoalModal(true)}>
        <Ionicons name="add-circle" size={20} color="#FFF" />
        <Text style={styles.addBtnText}>Set New Goal</Text>
      </TouchableOpacity>

      {activeGoals.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          {activeGoals.map(g => renderGoal(g, false))}
        </>
      )}
      {completedGoals.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Completed</Text>
          {completedGoals.map(g => renderGoal(g, true))}
        </>
      )}
      {goals.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>🎯</Text>
          <Text style={styles.emptyText}>No goals yet. Set one to get started!</Text>
        </View>
      )}

      <Modal visible={goalModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            {showGoalCalendar ? (
              <>
                <View style={styles.calBackRow}>
                  <TouchableOpacity onPress={() => setShowGoalCalendar(false)} style={styles.calBackBtn}>
                    <Ionicons name="chevron-back" size={18} color={Colors.primary} />
                    <Text style={styles.calBackText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Pick a Target Date</Text>
                </View>
                <CalendarPicker
                  selected={targetDate}
                  onSelect={(date) => { setTargetDate(date || undefined); setShowGoalCalendar(false); }}
                  onClose={() => setShowGoalCalendar(false)}
                />
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>New Goal</Text>

                <Text style={styles.fieldLabel}>Goal Title</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What do you want to achieve?" placeholderTextColor={Colors.subtext} />

                <Text style={styles.fieldLabel}>Description (optional)</Text>
                <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Describe your goal..." placeholderTextColor={Colors.subtext} multiline />

                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {(Object.keys(CATEGORY_CONFIG) as GoalCategory[]).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catOption, category === cat && { borderColor: cfg.color, backgroundColor: cfg.color + '15' }]}
                        onPress={() => setCategory(cat)}
                      >
                        <Ionicons name={cfg.icon} size={16} color={category === cat ? cfg.color : Colors.subtext} />
                        <Text style={[styles.catLabel, category === cat && { color: cfg.color }]}>{cfg.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Target Date</Text>
                <TouchableOpacity
                  style={[styles.dueDateBtn, targetDate && { borderColor: Colors.primary }]}
                  onPress={() => setShowGoalCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={targetDate ? Colors.primary : Colors.subtext} />
                  <Text style={[styles.dueDateBtnText, targetDate && { color: Colors.primary }]}>
                    {targetDate ? formatDate(targetDate) : 'Set target date'}
                  </Text>
                  {targetDate && (
                    <TouchableOpacity onPress={() => setTargetDate(undefined)} style={{ marginLeft: 'auto' }}>
                      <Ionicons name="close-circle" size={18} color={Colors.subtext} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddGoal}>
                  <Text style={styles.saveBtnText}>Create Goal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                  setGoalModal(false); setShowGoalCalendar(false); setTargetDate(undefined);
                  setTitle(''); setDescription(''); setCategory('personal');
                }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={milestoneModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={[styles.modalTitle, { padding: 24, paddingBottom: 0 }]}>New Milestone</Text>
            <View style={{ padding: 24, paddingTop: 16 }}>
              <Text style={styles.fieldLabel}>Milestone Title</Text>
              <TextInput style={styles.input} value={milestoneTitle} onChangeText={setMilestoneTitle} placeholder="e.g. Week 1 complete" placeholderTextColor={Colors.subtext} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddMilestone}>
                <Text style={styles.saveBtnText}>Add Milestone</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMilestoneModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const { tasks, addTask, deleteTask, toggleTask, getEffectiveToday } = useApp();
  const Colors = useColors();
  const styles = makeStyles(Colors);

  const [activeSection, setActiveSection] = useState<'tasks' | 'goals'>('tasks');
  const [activeTab, setActiveTab]       = useState<FilterTab>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [title, setTitle]               = useState('');
  const [priority, setPriority]         = useState<Priority>('medium');
  const [dueDate, setDueDate]           = useState<string | undefined>();

  const resetForm = () => { setTitle(''); setPriority('medium'); setDueDate(undefined); setShowCalendar(false); };

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Please enter a task title.'); return; }
    addTask({ title: title.trim(), priority, completed: false, dueDate });
    resetForm();
    setModalVisible(false);
  };

  const today2         = getEffectiveToday();
  const activeTasks    = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks   = activeTasks.filter(t => t.dueDate && t.dueDate < today2);

  const getFiltered = (): AppTask[] => {
    switch (activeTab) {
      case 'active':   return activeTasks;
      case 'done':     return completedTasks;
      case 'priority': return [...activeTasks].sort((a, b) => {
        const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      });
      default: return [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.createdAt.localeCompare(b.createdAt);
      });
    }
  };

  const dueDateLabel = dueDate ? (getDueDateStyle(dueDate, Colors)?.label ?? formatDate(dueDate)) : 'Set due date';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Top section switcher */}
      <View style={styles.sectionSwitcher}>
        {(['tasks', 'goals'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sectionBtn, activeSection === s && styles.sectionBtnActive]}
            onPress={() => setActiveSection(s)}
          >
            <Ionicons
              name={s === 'tasks' ? 'list' : 'flag'}
              size={16}
              color={activeSection === s ? '#FFF' : Colors.subtext}
            />
            <Text style={[styles.sectionBtnText, activeSection === s && styles.sectionBtnTextActive]}>
              {s === 'tasks' ? 'Tasks' : 'Goals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSection === 'goals' ? <GoalsView /> : <>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle" size={20} color="#FFF" />
        <Text style={styles.addBtnText}>Add New Task</Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        {[
          { value: activeTasks.length,    label: 'Active',    color: Colors.blue    },
          { value: completedTasks.length, label: 'Completed', color: Colors.green   },
          { value: overdueTasks.length,   label: 'Overdue',   color: Colors.red     },
          { value: tasks.length,          label: 'Total',     color: Colors.primary },
        ].map(item => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: item.color + '15' }]}>
            <Text style={[styles.statNum, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tabs}>
        {(['all', 'active', 'done', 'priority'] as FilterTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {getFiltered().length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color={Colors.subtext} />
          <Text style={styles.emptyText}>No tasks here. Add one above!</Text>
        </View>
      ) : (
        getFiltered().map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={() => toggleTask(task.id)}
            onDelete={() => deleteTask(task.id)}
          />
        ))
      )}

      </> }

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <View style={styles.modal}>
            {showCalendar ? (
              <>
                <View style={styles.calBackRow}>
                  <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.calBackBtn}>
                    <Ionicons name="chevron-back" size={18} color={Colors.primary} />
                    <Text style={styles.calBackText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Pick a Due Date</Text>
                </View>
                <CalendarPicker
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date || undefined);
                    setShowCalendar(false);
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>New Task</Text>

                <Text style={styles.fieldLabel}>Task Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What needs to be done?"
                  placeholderTextColor={Colors.subtext}
                />

                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.priorityOptions}>
                  {(['high', 'medium', 'low'] as Priority[]).map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityOption,
                        { backgroundColor: PRIORITY_CONFIG[p].color + '20' },
                        priority === p && { borderWidth: 2, borderColor: PRIORITY_CONFIG[p].color },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.priorityOptionText, { color: PRIORITY_CONFIG[p].color }]}>
                        {PRIORITY_CONFIG[p].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Due Date (optional)</Text>
                <TouchableOpacity
                  style={[styles.dueDateBtn, dueDate && { borderColor: Colors.primary }]}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={dueDate ? Colors.primary : Colors.subtext}
                  />
                  <Text style={[styles.dueDateBtnText, dueDate && { color: Colors.primary }]}>
                    {dueDateLabel}
                  </Text>
                  {dueDate && (
                    <TouchableOpacity onPress={() => setDueDate(undefined)} style={{ marginLeft: 'auto' }}>
                      <Ionicons name="close-circle" size={18} color={Colors.subtext} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                  <Text style={styles.saveBtnText}>Add Task</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setModalVisible(false); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (C: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 32 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 20, marginBottom: 10 },

  sectionSwitcher: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, padding: 4, marginBottom: 16, gap: 4 },
  sectionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  sectionBtnActive: { backgroundColor: C.primary },
  sectionBtnText: { fontSize: 14, fontWeight: '700', color: C.subtext },
  sectionBtnTextActive: { color: '#FFF' },

  // Goals styles
  goalStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  goalStatCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  goalStatNum: { fontSize: 22, fontWeight: '800' },
  goalStatLabel: { fontSize: 11, color: C.subtext },
  goalCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  goalCardDone: { backgroundColor: C.green + '15', borderWidth: 1, borderColor: C.green },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  goalIconBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  goalDesc: { fontSize: 12, color: C.subtext, marginTop: 2 },
  goalProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  goalProgressLabel: { fontSize: 13, color: C.subtext },
  goalProgressPct: { fontSize: 13, fontWeight: '700' },
  goalProgressBg: { height: 8, backgroundColor: C.border, borderRadius: 4, marginBottom: 10 },
  goalProgressFill: { height: 8, borderRadius: 4 },
  stepperRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  stepBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: C.background, alignItems: 'center' },
  stepBtnText: { fontSize: 11, color: C.subtext, fontWeight: '600' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  completedBadgeText: { fontSize: 13, color: C.green, fontWeight: '600' },
  goalDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalDateText: { fontSize: 12, color: C.subtext },
  goalDaysText: { fontSize: 12, fontWeight: '600', marginLeft: 8 },
  milestones: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  milestonesTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  milestoneTitle: { fontSize: 14, color: C.text },
  milestoneDone: { textDecorationLine: 'line-through', color: C.subtext },
  addMilestoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  addMilestoneText: { fontSize: 13, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: C.border },
  catLabel: { fontSize: 13, color: C.subtext, fontWeight: '600' },

  addBtn: {
    backgroundColor: C.blue, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: C.subtext, marginTop: 2 },

  tabs: { flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: C.card, alignItems: 'center' },
  tabActive: { backgroundColor: C.primary },
  tabText: { fontSize: 11, color: C.subtext, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },

  taskCard: { borderRadius: 12, padding: 14, marginBottom: 8 },
  taskDone: { backgroundColor: C.border },
  taskMainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskCheck: {},
  taskTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: C.subtext },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  priorityBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  dueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  dueText: { fontSize: 11, fontWeight: '600' },
  subTaskBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.border, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  subTaskBadgeText: { fontSize: 11, color: C.subtext, fontWeight: '600' },
  expandBtn: { padding: 4 },
  deleteBtn: { padding: 4 },

  subTaskSection: { marginTop: 10 },
  subTaskDivider: { height: 1, backgroundColor: C.border, marginBottom: 8 },
  subTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  subTaskTitle: { flex: 1, fontSize: 14, color: C.text },
  subTaskTitleDone: { textDecorationLine: 'line-through', color: C.subtext },
  subDeleteBtn: { padding: 2 },
  addSubTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subTaskInput: {
    flex: 1, backgroundColor: C.background, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: C.text,
  },
  subAddConfirmBtn: { padding: 4 },
  addSubTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, marginTop: 2 },
  addSubTaskText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: C.subtext },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.background, borderRadius: 8, padding: 12, fontSize: 15, color: C.text },
  priorityOptions: { flexDirection: 'row', gap: 10 },
  priorityOption: {
    flex: 1, padding: 12, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  priorityOptionText: { fontSize: 13, fontWeight: '700' },
  dueDateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.background, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  dueDateBtnText: { fontSize: 15, color: C.subtext },
  saveBtn: { backgroundColor: C.blue, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: C.subtext, fontSize: 15 },

  calBackRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  calBackBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  calBackText: { fontSize: 14, color: C.primary, fontWeight: '600' },
});

const makeCal = (C: ColorScheme) => StyleSheet.create({
  container: { backgroundColor: C.card, borderRadius: 20, padding: 20, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 6 },
  title: { fontSize: 16, fontWeight: '700', color: C.text },
  dayRow: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.subtext },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: C.primary, borderRadius: 20 },
  cellToday: { backgroundColor: C.background, borderRadius: 20 },
  dayNum: { fontSize: 14, color: C.text },
  dayNumSelected: { color: '#FFF', fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  clearBtn: { padding: 10 },
  clearText: { fontSize: 14, color: C.subtext },
  doneBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  doneText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
