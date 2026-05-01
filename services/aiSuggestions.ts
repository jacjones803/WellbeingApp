const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';

export interface SuggestedTask {
  title: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

export interface SuggestionContext {
  recentMoods: { date: string; mood: string }[];
  todayHealth: { waterIntake: number; sleepHours: number; exerciseMinutes: number } | null;
  habitStats: { completed: number; total: number };
  activeGoals: { title: string; category: string; progress: number }[];
  pendingTaskTitles: string[];
  streak: number;
}

export async function getSuggestedTasks(ctx: SuggestionContext): Promise<SuggestedTask[]> {
  if (!API_KEY || API_KEY === 'your_anthropic_api_key_here') {
    throw new Error('Please add your Anthropic API key to the .env file.');
  }

  const prompt = buildPrompt(ctx);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? '';

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Unexpected response format from AI.');

  const parsed = JSON.parse(match[0]) as SuggestedTask[];
  return parsed.slice(0, 3);
}

function buildPrompt(ctx: SuggestionContext): string {
  const moodSummary = ctx.recentMoods.length > 0
    ? ctx.recentMoods.slice(-3).map(m => m.mood).join(', ')
    : 'not logged recently';

  const healthSummary = ctx.todayHealth
    ? `sleep ${ctx.todayHealth.sleepHours}h, water ${ctx.todayHealth.waterIntake}ml, exercise ${ctx.todayHealth.exerciseMinutes}min`
    : 'not logged today';

  const goalsSummary = ctx.activeGoals.length > 0
    ? ctx.activeGoals.slice(0, 3).map(g => `${g.title} (${g.progress}%)`).join('; ')
    : 'none';

  const tasksSummary = ctx.pendingTaskTitles.slice(0, 5).join(', ') || 'none';

  return `You are a supportive wellbeing coach. Based on the user data below, suggest 3 simple, actionable daily tasks to help improve their wellbeing today.

User data:
- Recent moods: ${moodSummary}
- Today's health: ${healthSummary}
- Habits completed today: ${ctx.habitStats.completed} of ${ctx.habitStats.total}
- Current activity streak: ${ctx.streak} days
- Active goals: ${goalsSummary}
- Already pending tasks: ${tasksSummary}

Rules:
- Do NOT repeat tasks already in the pending list
- Keep tasks specific and achievable within one day
- Vary the focus areas (mental, physical, social, productivity)

Return ONLY a valid JSON array of exactly 3 objects, no explanation or other text:
[
  {"title": "Short task name", "priority": "high", "reason": "One brief reason why."},
  {"title": "Short task name", "priority": "medium", "reason": "One brief reason why."},
  {"title": "Short task name", "priority": "low", "reason": "One brief reason why."}
]`;
}
