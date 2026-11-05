/**
 * Create room (recon S31, design spec: Create room form).
 * Minimal for the vertical slice: room name, topic tags, capacity.
 * The clone starts empty, so creating a room is how the core loop is
 * bootstrapped (create -> join -> mic seat -> talk -> chat -> leave).
 * Entry conditions (open / password / invite-only) and themes are a
 * later milestone (S08 / S31 full form).
 */
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { createRoom } from '../../lib/rooms';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { tokens } from '../../theme/tokens';

const TOPICS = ['Chat', 'Sing', 'Dating', 'Party'] as const;

export default function CreateRoom() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [topics, setTopics] = useState<string[]>(['Chat']);
  const [capacity, setCapacity] = useState(9);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (t: string) => {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const submit = async () => {
    setError(null);
    if (!user) {
      setError('Sign in first.');
      return;
    }
    if (!title.trim()) {
      setError('Give your room a name.');
      return;
    }
    if (topics.length === 0) {
      setError('Pick at least one topic.');
      return;
    }
    setBusy(true);
    try {
      const roomId = await createRoom(
        { title, topicTags: topics, capacity, entryType: 'open' },
        { uid: user.uid, nickname: user.nickname },
      );
      router.replace({ pathname: '/room/[id]', params: { id: roomId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create a room</Text>
        <Text style={styles.subtitle}>
          Start a live voice room and take the host seat.
        </Text>

        <TextInput
          label="Room name"
          value={title}
          onChangeText={setTitle}
          placeholder="A name for your room"
          maxLength={60}
        />

        <Text style={styles.sectionLabel}>Topic</Text>
        <View style={styles.topicRow}>
          {TOPICS.map((t) => (
            <Button
              key={t}
              label={t}
              onPress={() => toggleTopic(t)}
              variant={topics.includes(t) ? 'primary' : 'secondary'}
              size="md"
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Capacity</Text>
        <View style={styles.capacityRow}>
          <Button
            label="−"
            onPress={() => setCapacity((c) => Math.max(2, c - 1))}
            variant="secondary"
            size="md"
            accessibilityLabel="Decrease capacity"
          />
          <Text style={styles.capacityValue}>{capacity} seats</Text>
          <Button
            label="+"
            onPress={() => setCapacity((c) => Math.min(9, c + 1))}
            variant="secondary"
            size="md"
            accessibilityLabel="Increase capacity"
          />
        </View>

        {error ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Button
          label="Create room"
          onPress={submit}
          variant="primary"
          size="xl"
          loading={busy}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { flexGrow: 1, padding: tokens.space[4], gap: tokens.space[3] },
  title: {
    fontSize: tokens.type.xl.size,
    lineHeight: tokens.type.xl.line,
    fontWeight: '700',
    color: tokens.color.text,
  },
  subtitle: { fontSize: tokens.type.base.size, color: tokens.color.textMuted },
  sectionLabel: {
    fontSize: tokens.type.sm.size,
    fontWeight: '600',
    color: tokens.color.text,
  },
  topicRow: { flexDirection: 'row', gap: tokens.space[2], flexWrap: 'wrap' },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  capacityValue: {
    fontSize: tokens.type.base.size,
    fontWeight: '600',
    color: tokens.color.text,
    minWidth: 80,
    textAlign: 'center',
  },
  errorText: { color: tokens.color.danger, fontSize: tokens.type.sm.size },
  submitButton: { marginTop: tokens.space[2] },
});
