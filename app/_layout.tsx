import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useColors } from '../context/AppContext';

function AppStack() {
  const Colors = useColors();

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mood"     options={{ title: 'Mood Tracking',  presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', headerBackTitle: 'Profile' }} />
      </Stack>
      <StatusBar style={Colors.text === '#F3F4F6' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AppStack />
    </AppProvider>
  );
}
