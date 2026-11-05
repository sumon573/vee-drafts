/**
 * S04 Profile setup (recon S04, design spec: Profile setup form).
 * After sign-up: nickname (required), gender, age, country, bio.
 * Avatar photo upload is a later milestone (needs the media service);
 * the avatar shows the user's initials until then.
 * Age enforces 13+ with an error message.
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
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { tokens } from '../theme/tokens';

const GENDERS = ['Female', 'Male', 'Other'] as const;

export default function ProfileSetup() {
  const { user, completeProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const name = nickname.trim();
    if (!name) {
      setError('Choose a nickname so people recognise you.');
      return;
    }
    let ageNum: number | null = null;
    if (age.trim()) {
      ageNum = Number(age.trim());
      if (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 120) {
        setError('Age must be 13 or older.');
        return;
      }
    }
    setBusy(true);
    try {
      await completeProfile({
        nickname: name,
        gender,
        age: ageNum,
        country: country.trim() || null,
        bio,
      });
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
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
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          A few details so people recognise you in rooms.
        </Text>

        <View style={styles.avatarRow}>
          <Avatar name={nickname || 'You'} size="xl" />
          <Text style={styles.avatarNote}>
            Photo upload comes later — your initials show for now.
          </Text>
        </View>

        <TextInput
          label="Nickname"
          value={nickname}
          onChangeText={setNickname}
          placeholder="Your nickname"
          maxLength={30}
        />

        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <Button
              key={g}
              label={g}
              onPress={() => setGender(g === gender ? null : g)}
              variant={gender === g ? 'primary' : 'secondary'}
              size="md"
            />
          ))}
        </View>

        <TextInput
          label="Age"
          value={age}
          onChangeText={setAge}
          placeholder="Your age (13+)"
          variant="numeric"
          maxLength={3}
        />
        <TextInput
          label="Country"
          value={country}
          onChangeText={setCountry}
          placeholder="Your country"
          maxLength={60}
        />
        <TextInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="A line about you"
          variant="multiline"
          maxLength={200}
        />

        {error ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Button
          label="Continue"
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
  scroll: {
    flexGrow: 1,
    padding: tokens.space[4],
    gap: tokens.space[3],
  },
  title: {
    fontSize: tokens.type.xl.size,
    lineHeight: tokens.type.xl.line,
    fontWeight: '700',
    color: tokens.color.text,
  },
  subtitle: { fontSize: tokens.type.base.size, color: tokens.color.textMuted },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    marginVertical: tokens.space[2],
  },
  avatarNote: {
    flex: 1,
    color: tokens.color.textMuted,
    fontSize: tokens.type.sm.size,
    flexShrink: 1,
  },
  sectionLabel: {
    fontSize: tokens.type.sm.size,
    fontWeight: '600',
    color: tokens.color.text,
  },
  genderRow: { flexDirection: 'row', gap: tokens.space[2], flexWrap: 'wrap' },
  errorText: { color: tokens.color.danger, fontSize: tokens.type.sm.size },
  submitButton: { marginTop: tokens.space[2] },
});
