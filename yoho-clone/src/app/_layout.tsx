/**
 * Root layout — Expo Router (src/app/).
 * Wraps the app in AuthProvider; the Stack holds the auth screens,
 * the tab navigator, and the voice room.
 */
import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="room/[id]" />
      </Stack>
    </AuthProvider>
  );
}
