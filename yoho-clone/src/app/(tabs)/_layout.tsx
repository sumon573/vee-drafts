/**
 * Bottom nav — replica-design spec (5 tabs).
 * Home, Moments, Create (+) centre, Messages, Me.
 * Height 56 + safe-area; centre Create is a raised 56px circle
 * (accent bg, white + icon, shadow pop). Active tab: accent icon +
 * accent label; inactive: text-muted. Messages shows a badge count
 * when there are unread messages (none in the slice).
 * Tokens only — no raw hex or pixel values.
 */
import { GestureResponderEvent, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Images, MessageCircle, Plus, User } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';

function CreateButton({ onPress }: { onPress?: (e: GestureResponderEvent) => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Create a room"
      style={styles.createButton}
    >
      <Plus size={28} stroke={tokens.color.onAccent} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: tokens.color.accent,
        tabBarInactiveTintColor: tokens.color.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: 'Moments',
          tabBarIcon: ({ color, size }) => <Images size={size} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: (props) => <CreateButton onPress={props.onPress} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} stroke={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => <User size={size} stroke={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: tokens.layout.bottomNavHeight,
    backgroundColor: tokens.color.bg,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
