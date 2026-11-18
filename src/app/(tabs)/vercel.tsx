import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useSettings } from '../../lib/settings-context';
import {
  VercelDeployment,
  listDeployments,
  redeployDeployment,
  cancelDeployment,
  VercelApiError,
} from '../../lib/vercel';

const STATE_COLORS: Record<string, string> = {
  READY: '#1a7f37',
  ERROR: '#cf222e',
  BUILDING: '#9a6700',
  QUEUED: '#9a6700',
  INITIALIZING: '#9a6700',
  CANCELED: '#57606a',
};

export default function VercelScreen() {
  const { settings, isVercelConfigured } = useSettings();
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const creds = useMemo(
    () => ({
      token: settings.vercelToken,
      projectId: settings.vercelProjectId,
      teamId: settings.vercelTeamId || undefined,
    }),
    [settings.vercelToken, settings.vercelProjectId, settings.vercelTeamId]
  );

  const load = useCallback(async () => {
    if (!isVercelConfigured) return;
    try {
      const result = await listDeployments(creds);
      setDeployments(result);
    } catch (err) {
      Alert.alert('Failed to load deployments', describeError(err));
    }
  }, [isVercelConfigured, creds]);

  useEffect(() => {
    let cancelled = false;
    // Standard fetch-on-mount/deps-change pattern; the lint rule's static
    // analysis flags any effect-scoped call that may eventually set state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onRedeployLatest = async () => {
    const latest = deployments[0];
    if (!latest) return;
    setBusyUid(latest.uid);
    try {
      await redeployDeployment(creds, latest);
      Alert.alert('Redeploy triggered', `Redeploying "${latest.name}"…`);
      await load();
    } catch (err) {
      Alert.alert('Redeploy failed', describeError(err));
    } finally {
      setBusyUid(null);
    }
  };

  const onCancel = async (deployment: VercelDeployment) => {
    setBusyUid(deployment.uid);
    try {
      await cancelDeployment(creds, deployment.uid);
      await load();
    } catch (err) {
      Alert.alert('Cancel failed', describeError(err));
    } finally {
      setBusyUid(null);
    }
  };

  if (!isVercelConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          Add a Vercel access token and project ID in the Settings tab to get started.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        style={[styles.redeployButton, !deployments.length && styles.buttonDisabled]}
        disabled={!deployments.length}
        onPress={onRedeployLatest}
      >
        <Text style={styles.redeployButtonText}>Redeploy latest</Text>
      </Pressable>

      <FlatList
        data={deployments}
        keyExtractor={(item) => item.uid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={
          !loading
            ? () => <Text style={styles.emptyText}>No deployments found for this project.</Text>
            : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={[styles.badge, { color: STATE_COLORS[item.state] ?? '#333' }]}>
                {item.state}
              </Text>
            </View>
            {!!item.url && (
              <Pressable onPress={() => Linking.openURL(`https://${item.url}`)}>
                <Text style={styles.link}>{item.url}</Text>
              </Pressable>
            )}
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
            {['BUILDING', 'QUEUED', 'INITIALIZING'].includes(item.state) && (
              <Pressable
                style={styles.cancelButton}
                disabled={busyUid === item.uid}
                onPress={() => onCancel(item)}
              >
                <Text style={styles.cancelButtonText}>
                  {busyUid === item.uid ? 'Cancelling…' : 'Cancel'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

function describeError(err: unknown): string {
  if (err instanceof VercelApiError) return `${err.message} (HTTP ${err.status})`;
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { textAlign: 'center', color: '#666', fontSize: 14, padding: 24 },
  redeployButton: {
    backgroundColor: '#000',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  redeployButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  badge: { fontSize: 12, fontWeight: '700' },
  link: { color: '#0969da', marginTop: 4, fontSize: 13 },
  meta: { color: '#666', fontSize: 12, marginTop: 4 },
  cancelButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cf222e',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: { color: '#cf222e', fontWeight: '600', fontSize: 13 },
});
