import { useMemo, useState } from 'react';
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
import { useSettings } from '../../lib/settings-context';
import { createSupabaseClient, fetchTableRows, insertTableRow } from '../../lib/supabase';

export default function SupabaseScreen() {
  const { settings, isSupabaseConfigured } = useSettings();
  const [table, setTable] = useState('');
  const [rows, setRows] = useState<unknown[] | null>(null);
  const [insertJson, setInsertJson] = useState('{\n  \n}');
  const [loading, setLoading] = useState(false);

  const client = useMemo(() => {
    if (!isSupabaseConfigured) return null;
    return createSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);
  }, [isSupabaseConfigured, settings.supabaseUrl, settings.supabaseAnonKey]);

  if (!isSupabaseConfigured || !client) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          Add a Supabase project URL and anon key in the Settings tab to get started.
        </Text>
      </View>
    );
  }

  const onLoad = async () => {
    if (!table.trim()) {
      Alert.alert('Table name required', 'Enter a table name to query first.');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTableRows(client, table.trim());
      setRows(data);
    } catch (err) {
      Alert.alert('Query failed', describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const onInsert = async () => {
    if (!table.trim()) {
      Alert.alert('Table name required', 'Enter a table name to insert into first.');
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(insertJson);
    } catch {
      Alert.alert('Invalid JSON', 'The row to insert must be valid JSON, e.g. {"name": "test"}.');
      return;
    }
    setLoading(true);
    try {
      await insertTableRow(client, table.trim(), parsed);
      Alert.alert('Inserted', `Row added to "${table.trim()}".`);
      await onLoad();
    } catch (err) {
      Alert.alert('Insert failed', describeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Table name</Text>
        <TextInput
          style={styles.input}
          value={table}
          onChangeText={setTable}
          placeholder="e.g. todos"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable style={styles.button} onPress={onLoad} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Loading…' : 'Load rows (limit 20)'}</Text>
        </Pressable>

        {rows && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>{rows.length} row(s)</Text>
            <Text style={styles.code}>{JSON.stringify(rows, null, 2)}</Text>
          </View>
        )}

        <Text style={[styles.label, { marginTop: 24 }]}>Insert row (JSON)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={insertJson}
          onChangeText={setInsertJson}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={styles.buttonSecondary} onPress={onInsert} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>Insert row</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14 },
  label: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top', fontFamily: 'monospace' },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSecondaryText: { color: '#000', fontWeight: '600', fontSize: 15 },
  resultBox: {
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  resultTitle: { fontWeight: '600', marginBottom: 6 },
  code: { fontFamily: 'monospace', fontSize: 12 },
});
