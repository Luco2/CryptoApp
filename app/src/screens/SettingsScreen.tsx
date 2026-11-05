import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import InfoTooltip from '../components/InfoTooltip';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { Theme, ThemeMode } from '../theme';
import { ServerSettings } from '../types';

const THEMES: { mode: ThemeMode; label: string; emoji: string }[] = [
  { mode: 'dark', label: 'Dark', emoji: '🌙' },
  { mode: 'light', label: 'Light', emoji: '☀️' },
  { mode: 'diva', label: 'Diva', emoji: '💅' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const api = useApi();
  const { serverUrl, setServerUrl, themeMode, setThemeMode } = useAppStore();
  const [serverInput, setServerInput] = useState(serverUrl);

  const [alpacaKey, setAlpacaKey] = useState('');
  const [alpacaSecret, setAlpacaSecret] = useState('');
  const [alpacaPaper, setAlpacaPaper] = useState(true);
  const [alpacaKeySet, setAlpacaKeySet] = useState(false);
  const [coinbaseKey, setCoinbaseKey] = useState('');
  const [coinbaseSecret, setCoinbaseSecret] = useState('');
  const [coinbasePaper, setCoinbasePaper] = useState(true);
  const [coinbaseKeySet, setCoinbaseKeySet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api.get<ServerSettings>('/settings');
      // Don't pre-fill inputs with masked values — just track whether a key is saved
      setAlpacaKeySet(s.alpacaKey.length > 0);
      setAlpacaPaper(s.alpacaPaper);
      setCoinbaseKeySet(s.coinbaseKey.length > 0);
      setCoinbasePaper(s.coinbasePaper);
      setLoadError(false);
    } catch {
      // Never silently fall back to the paper-mode defaults — saving on top of
      // that would clobber a live setting on the server. Surface it instead.
      setLoadError(true);
    }
  }, [api]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const handleSave = async () => {
    if (loadError) {
      Alert.alert(
        'Settings not loaded',
        "The app couldn't read your current settings from the server, so the switches below may not reflect what's actually saved. Reload before saving to avoid overwriting your live/paper choice.",
      );
      return;
    }
    setSaving(true);
    try {
      const patch: Record<string, unknown> = { alpacaPaper, coinbasePaper };
      if (alpacaKey.trim()) patch.alpacaKey = alpacaKey.trim();
      if (alpacaSecret.trim()) patch.alpacaSecret = alpacaSecret.trim();
      if (coinbaseKey.trim()) patch.coinbaseKey = coinbaseKey.trim();
      if (coinbaseSecret.trim()) patch.coinbaseSecret = coinbaseSecret.trim();
      await api.put('/settings', patch);
      if (alpacaKey.trim()) { setAlpacaKeySet(true); setAlpacaKey(''); }
      if (coinbaseKey.trim()) { setCoinbaseKeySet(true); setCoinbaseKey(''); }
      setAlpacaSecret(''); setCoinbaseSecret('');
      Alert.alert('Saved', 'Settings updated.');
    } catch (e: any) { Alert.alert('Error', e.message ?? 'Failed to save'); }
    finally { setSaving(false); }
  };

  const testAlpaca = async () => {
    await handleSave();
    try {
      const res = await api.post<{ connected: boolean; error?: string }>('/settings/test/alpaca');
      Alert.alert(res.connected ? 'Connected ✓' : 'Connection Failed', res.connected ? 'Alpaca API is working.' : (res.error ?? 'Unknown error'));
    } catch { Alert.alert('Error', 'Could not reach the server. Is it running?'); }
  };

  const testCoinbase = async () => {
    await handleSave();
    try {
      const res = await api.post<{ connected: boolean; error?: string }>('/settings/test/coinbase');
      Alert.alert(res.connected ? 'Connected ✓' : 'Connection Failed', res.connected ? 'Coinbase API is working.' : (res.error ?? 'Unknown error'));
    } catch { Alert.alert('Error', 'Could not reach the server. Is it running?'); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* Couldn't load settings — warn instead of silently showing paper defaults */}
      {loadError && (
        <View style={s.errorBanner}>
          <Text style={s.errorBannerText}>
            ⚠ Couldn't load your saved settings from the server. The switches below show defaults, not your real values — reload before saving so you don't overwrite your live/paper choice.
          </Text>
          <TouchableOpacity style={s.errorRetryBtn} onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
            <Text style={s.errorRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Theme */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Appearance</Text>
        <View style={s.themeRow}>
          {THEMES.map(({ mode, label, emoji }) => (
            <Pressable key={mode} style={[s.themeCard, themeMode === mode && s.themeCardActive]} onPress={() => setThemeMode(mode)}>
              <Text style={s.themeEmoji}>{emoji}</Text>
              <Text style={[s.themeLabel, themeMode === mode && s.themeLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Server */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Server</Text>
        <Text style={s.label}>Server URL</Text>
        <TextInput style={s.input} value={serverInput} onChangeText={setServerInput}
          onBlur={() => setServerUrl(serverInput.trim())} autoCapitalize="none" autoCorrect={false}
          placeholder="http://10.0.0.90:3001" placeholderTextColor={theme.textMuted} />
        <Text style={s.hint}>Android emulator → 10.0.2.2 · iOS sim → localhost · Device → machine's local IP</Text>
      </View>

      {/* Alpaca */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Alpaca (Stocks)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 6 }}>
          <Text style={s.label}>API Key</Text>
          {alpacaKeySet && <View style={[s.savedBadge, { backgroundColor: theme.positive + '22', borderColor: theme.positive }]}><Text style={[s.savedText, { color: theme.positive }]}>✓ saved</Text></View>}
        </View>
        <TextInput style={s.input} value={alpacaKey} onChangeText={(v) => setAlpacaKey(v.replace(/\s/g, ''))} autoCapitalize="none" autoCorrect={false} autoComplete="off" spellCheck={false} placeholderTextColor={theme.textMuted} placeholder={alpacaKeySet ? 'Paste new key to replace' : 'Paste your API key'} />
        <Text style={s.label}>Secret{alpacaKeySet ? ' (leave blank to keep existing)' : ''}</Text>
        <TextInput style={s.input} value={alpacaSecret} onChangeText={(v) => setAlpacaSecret(v.replace(/\s/g, ''))} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholderTextColor={theme.textMuted} placeholder={alpacaKeySet ? 'Paste new secret to replace' : 'Paste your secret key'} />
        <View style={s.toggleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.toggleLabel}>Paper trading mode</Text>
            <InfoTooltip title="Paper Trading Mode" body="When ON, all trades are simulated with fake money — no real purchases are made. This is safe to use while learning.\n\nWhen OFF, the app places real orders using your Alpaca account with real money. Only turn this off when you're ready to invest for real." />
          </View>
          <Switch value={alpacaPaper} onValueChange={setAlpacaPaper} trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }} thumbColor="#fff" />
        </View>
        {!alpacaPaper && <Text style={s.liveWarning}>⚠ LIVE mode — real money will be used</Text>}
        <TouchableOpacity style={s.testBtn} onPress={testAlpaca}>
          <Text style={s.testBtnText}>Test Alpaca connection</Text>
        </TouchableOpacity>
      </View>

      {/* Coinbase */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Coinbase (Crypto)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 6 }}>
          <Text style={s.label}>API Key Name</Text>
          {coinbaseKeySet && <View style={[s.savedBadge, { backgroundColor: theme.positive + '22', borderColor: theme.positive }]}><Text style={[s.savedText, { color: theme.positive }]}>✓ saved</Text></View>}
        </View>
        <TextInput style={s.input} value={coinbaseKey} onChangeText={(v) => setCoinbaseKey(v.replace(/\s/g, ''))} autoCapitalize="none" autoCorrect={false} autoComplete="off" spellCheck={false} placeholderTextColor={theme.textMuted} placeholder={coinbaseKeySet ? 'Paste new key name to replace' : 'organizations/…/apiKeys/…'} />
        <Text style={s.label}>Private Key{coinbaseKeySet ? ' (leave blank to keep existing)' : ''}</Text>
        <Text style={[s.hint, { marginBottom: 4 }]}>Paste the full key including -----BEGIN EC PRIVATE KEY----- header and footer</Text>
        <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} value={coinbaseSecret} onChangeText={setCoinbaseSecret} autoCapitalize="none" autoCorrect={false} multiline placeholderTextColor={theme.textMuted} placeholder={coinbaseKeySet ? 'Paste new private key to replace' : '-----BEGIN EC PRIVATE KEY-----\n…\n-----END EC PRIVATE KEY-----'} />
        <View style={s.toggleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.toggleLabel}>Paper trading mode</Text>
            <InfoTooltip title="Paper Trading Mode" body="When ON, crypto trades are simulated locally — no real orders are sent to Coinbase. Your Coinbase API keys are not even required in paper mode.\n\nWhen OFF, the app places real buy orders on Coinbase using real money from your account." />
          </View>
          <Switch value={coinbasePaper} onValueChange={setCoinbasePaper} trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }} thumbColor="#fff" />
        </View>
        {!coinbasePaper && <Text style={s.liveWarning}>⚠ LIVE mode — real money will be used</Text>}
        <TouchableOpacity style={s.testBtn} onPress={testCoinbase}>
          <Text style={s.testBtnText}>Test Coinbase connection</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[s.saveBtn, (saving || loadError) && { opacity: 0.6 }]} onPress={handleSave} disabled={saving || loadError}>
        <Text style={s.saveBtnText}>{saving ? 'Saving…' : loadError ? 'Reload to save' : 'Save Settings'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function styles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg },
    section: { marginHorizontal: 16, marginTop: 20, backgroundColor: t.bgCard, borderRadius: 12, padding: 16 },
    sectionTitle: { color: t.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    label: { color: t.textSub, fontSize: 12, marginBottom: 6, marginTop: 10 },
    input: { backgroundColor: t.bgInput, borderRadius: 8, color: t.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: t.border },
    hint: { color: t.textMuted, fontSize: 11, marginTop: 6, lineHeight: 16 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
    toggleLabel: { color: t.text, fontSize: 15 },
    liveWarning: { color: t.negative, fontSize: 12, marginTop: 6 },
    errorBanner: { marginHorizontal: 16, marginTop: 20, backgroundColor: t.negative + '18', borderColor: t.negative, borderWidth: 1, borderRadius: 12, padding: 14 },
    errorBannerText: { color: t.negative, fontSize: 13, lineHeight: 18 },
    errorRetryBtn: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: t.negative },
    errorRetryText: { color: t.negative, fontSize: 13, fontWeight: '700' },
    testBtn: { marginTop: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: t.accent, alignItems: 'center' },
    testBtnText: { color: t.accent, fontSize: 14, fontWeight: '600' },
    saveBtn: { margin: 16, marginTop: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center' },
    saveBtnText: { color: t.accentText, fontSize: 16, fontWeight: '700' },
    savedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
    savedText: { fontSize: 11, fontWeight: '700' },
    themeRow: { flexDirection: 'row', gap: 10 },
    themeCard: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 2, borderColor: t.border, alignItems: 'center' },
    themeCardActive: { borderColor: t.accent, backgroundColor: t.bgInput },
    themeEmoji: { fontSize: 22, marginBottom: 4 },
    themeLabel: { color: t.textSub, fontSize: 13, fontWeight: '600' },
    themeLabelActive: { color: t.accent },
  });
}
