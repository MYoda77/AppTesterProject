import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSettings, Settings } from '../../lib/settings-context';

export default function SettingsScreen() {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  // Mounted only once the stored settings have loaded, so the form's
  // initial state below is always seeded with the real persisted values.
  return <SettingsForm initial={settings} />;
}

function SettingsForm({ initial }: { initial: Settings }) {
  const { save, clear } = useSettings();
  const [form, setForm] = useState<Settings>(initial);

  const update = (key: keyof Settings) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    await save(form);
    Alert.alert('Saved', 'Credentials saved to this device.');
  };

  const onClear = async () => {
    await clear();
    Alert.alert('Cleared', 'All stored credentials were removed.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.warning}>
          Credentials are stored locally on this device only (SecureStore on
          iOS/Android, localStorage on web — web is NOT secure). This is a
          throwaway testing app: use scoped/low-privilege tokens, never
          production secrets.
        </Text>

        <Text style={styles.sectionTitle}>Vercel</Text>
        <Field label="Access Token" value={form.vercelToken} onChangeText={update('vercelToken')} secure />
        <Field label="Project ID" value={form.vercelProjectId} onChangeText={update('vercelProjectId')} />
        <Field label="Team ID (optional)" value={form.vercelTeamId} onChangeText={update('vercelTeamId')} />

        <Text style={styles.sectionTitle}>Supabase</Text>
        <Field label="Project URL" value={form.supabaseUrl} onChangeText={update('supabaseUrl')} autoCapitalize="none" />
        <Field label="Anon Key" value={form.supabaseAnonKey} onChangeText={update('supabaseAnonKey')} secure />

        <Pressable style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
        <Pressable style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearButtonText}>Clear all</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secure}
        autoCapitalize={props.autoCapitalize ?? 'none'}
        autoCorrect={false}
        placeholder={props.label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  warning: {
    backgroundColor: '#FFF4E5',
    color: '#8A5700',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  clearButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: { color: '#B00020', fontWeight: '600', fontSize: 15 },
});
