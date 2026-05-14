# Level Up Tracker

A mobile wellbeing app built with React Native and Expo for my Year 3 Individual Project (CM3203) at Cardiff University.

The idea came from frustration with having to use multiple separate apps to track different aspects of daily life. Level Up Tracker combines mood tracking, health logging, habit building, and goal management into one place — with a gamification layer (XP, levels, streaks, achievements) to keep things engaging.

## Features

- **Dashboard** — overview of your level, XP progress, current streak, and today's completion across all categories
- **Mood Tracking** — log your mood daily using a monthly calendar; tap any past day to fill in a missed entry
- **Health Logging** — track water intake, exercise, sleep, and weight with daily targets and a 7-day consistency view
- **Habit Tracking** — create custom habits with icons and colours; track completions across the week
- **Tasks & Goals** — manage daily tasks with priorities and due dates alongside longer-term goals with milestones
- **Insights** — activity heatmap calendar with weekly summaries and per-day breakdowns
- **Gamification** — earn XP for logging data, level up, maintain streaks, and unlock achievements
- **AI Suggestions** — get personalised daily task suggestions based on your recent mood, health, and habit data (powered by the Claude API)
- **Dark / Light mode** — follows the system theme automatically

## Tech Stack

- **React Native** + **Expo** (SDK 54)
- **Expo Router** for file-based navigation
- **AsyncStorage** for local data persistence
- **TypeScript** throughout
- **Claude API** (Anthropic) for AI suggestions

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo`)
- Android emulator, iOS simulator, or the Expo Go app on a physical device

### Installation

```bash
git clone https://github.com/jacjones803/WellbeingApp.git
cd WellbeingApp
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
```

The AI suggestions feature requires a Claude API key from [console.anthropic.com](https://console.anthropic.com). The rest of the app works without it.

### Running the App

```bash
npx expo start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Project Structure

```
app/
  (tabs)/         # Main tab screens (dashboard, health, habits, tasks, insights)
  mood.tsx        # Mood tracking screen
  settings.tsx    # App settings
  _layout.tsx     # Root layout and navigation config
components/       # Shared UI components
context/          # AppContext — global state and AsyncStorage logic
services/         # AI suggestions service
constants/        # Theme and colour definitions
types/            # TypeScript type definitions
```

## Notes

- All data is stored locally on-device using AsyncStorage — nothing is sent to a server (except the AI suggestion requests to the Claude API)
- The day start time setting in Settings lets you shift when a new "day" begins, useful if you tend to log data late at night

## License

This project was built as part of an academic submission and is not licensed for commercial use.
