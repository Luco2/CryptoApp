import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import InfoTooltip from '../components/InfoTooltip';
import AISuggestions from '../components/AISuggestions';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../theme';
import { Rule } from '../types';

const FREQUENCIES = ['daily', 'weekly', 'monthly'];
const BROKERS = ['alpaca', 'coinbase'];

const CRYPTO_SYMBOLS = new Set([
  'BTC','ETH','SOL','DOGE','ADA','XRP','DOT','AVAX','MATIC','LINK',
  'UNI','AAVE','LTC','BCH','ATOM','ALGO','XLM','FIL','VET','THETA',
  'EOS','TRX','NEAR','ICP','FTM','SAND','MANA','AXS','SHIB','PEPE',
  'CRV','COMP','SNX','YFI','SUSHI','BAT','ZRX','GRT','ANKR','CHZ',
  'ENJ','GALA','APE','IMX','FLOW','HBAR','EGLD','ONE','ZEC','DASH',
]);

function inferBroker(symbol: string): 'alpaca' | 'coinbase' {
  return CRYPTO_SYMBOLS.has(symbol.toUpperCase()) ? 'coinbase' : 'alpaca';
}

function RuleCard({ rule, theme, onToggle, onDelete, onExecute }: {
  rule: Rule; theme: Theme;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
}) {
  const s = useMemo(() => cardStyles(theme), [theme]);
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View>
          <Text style={s.asset}>{rule.asset}</Text>
          <Text style={s.sub}>${rule.amount} · {rule.frequency} · {rule.broker}</Text>
        </View>
        <Switch value={rule.active} onValueChange={(v) => onToggle(rule.id, v)}
          trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }} thumbColor="#fff" />
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => onExecute(rule.id)}>
          <Text style={s.actionText}>Run now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => onDelete(rule.id)}>
          <Text style={[s.actionText, { color: theme.negative }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RulesScreen() {
  const theme = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const api = useApi();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [asset, setAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [broker, setBroker] = useState('coinbase');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setRules(await api.get<Rule[]>('/rules')); } catch {}
  }, [api]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const handleToggle = async (id: string, active: boolean) => {
    setRules((r) => r.map((x) => x.id === id ? { ...x, active } : x));
    try { await api.put(`/rules/${id}`, { active }); } catch {}
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete rule?', 'This will stop future automated purchases.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.del(`/rules/${id}`); setRules((r) => r.filter((x) => x.id !== id)); } catch {}
      }},
    ]);
  };

  const handleExecute = async (id: string) => {
    try {
      await api.post(`/rules/${id}/execute`);
      Alert.alert('Success', 'Trade executed. Check the Trades tab.');
    } catch (e: any) { Alert.alert('Error', e.message ?? 'Execution failed'); }
  };

  const handleSave = async () => {
    if (!asset.trim() || !amount || isNaN(Number(amount))) {
      Alert.alert('Invalid input', 'Enter a valid asset symbol and dollar amount.'); return;
    }
    setSaving(true);
    try {
      const rule = await api.post<Rule>('/rules', { asset: asset.trim().toUpperCase(), amount: Number(amount), frequency, broker });
      setRules((r) => [rule, ...r]);
      setModalVisible(false); setAsset(''); setAmount('');
    } catch (e: any) { Alert.alert('Error', e.message ?? 'Failed to create rule'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={rules}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RuleCard rule={item} theme={theme} onToggle={handleToggle} onDelete={handleDelete} onExecute={handleExecute} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No rules yet.</Text>
            <Text style={s.hint}>Tap + to create your first DCA rule.</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>New DCA Rule</Text>
            <ScrollView>
              <AISuggestions onSelect={(suggestion) => {
                setAsset(suggestion.symbol);
                setBroker(suggestion.broker);
                setFrequency(suggestion.frequency);
                setAmount(String(suggestion.amount));
              }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.fieldLabel}>Asset symbol</Text>
                <InfoTooltip title="Asset Symbol" body={'The ticker symbol for what you want to buy.\n\nStocks: AAPL (Apple), MSFT (Microsoft), GOOGL (Google), TSLA (Tesla), SPY (S&P 500 index)\n\nCrypto: BTC (Bitcoin), ETH (Ethereum), SOL (Solana)\n\nMake sure to choose the matching broker below.'} />
              </View>
              <TextInput style={s.input} placeholder="e.g. BTC, AAPL" placeholderTextColor={theme.textMuted}
                value={asset}
                onChangeText={(v) => {
                  const upper = v.toUpperCase();
                  setAsset(upper);
                  setBroker(inferBroker(upper));
                }}
                autoCapitalize="characters" />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.fieldLabel}>Buy amount (USD)</Text>
                <InfoTooltip title="Buy Amount" body="How many dollars to invest each time this rule runs. For example, entering 25 means you'll buy $25 worth of the asset on every scheduled run.\n\nYou can start small — even $5 or $10 works. The app supports fractional shares and fractional crypto." />
              </View>
              <TextInput style={s.input} placeholder="e.g. 25" placeholderTextColor={theme.textMuted}
                value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.fieldLabel}>Frequency</Text>
                <InfoTooltip title="Frequency" body={'How often to automatically buy.\n\nDaily — buys every day. Good for volatile assets like crypto where spreading purchases reduces risk.\n\nWeekly — buys once a week. Popular choice for most investors.\n\nMonthly — buys once a month. Lower transaction frequency, good for stocks.'} />
              </View>
              <View style={s.chips}>
                {FREQUENCIES.map((f) => (
                  <Pressable key={f} style={[s.chip, frequency === f && s.chipActive]} onPress={() => setFrequency(f)}>
                    <Text style={[s.chipText, frequency === f && s.chipTextActive]}>{f}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.fieldLabel}>Broker</Text>
                <InfoTooltip title="Broker" body={'Which platform will execute the trade.\n\nAlpaca — use this for stocks (AAPL, MSFT, SPY, etc.)\n\nCoinbase — use this for crypto (BTC, ETH, SOL, etc.)\n\nMake sure the asset symbol matches the broker you choose.'} />
              </View>
              <View style={s.chips}>
                {BROKERS.map((b) => (
                  <Pressable key={b} style={[s.chip, broker === b && s.chipActive]} onPress={() => setBroker(b as 'alpaca' | 'coinbase')}>
                    <Text style={[s.chipText, broker === b && s.chipTextActive]}>{b}</Text>
                  </Pressable>
                ))}
              </View>
              {asset.length > 0 && (
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
                  {CRYPTO_SYMBOLS.has(asset) ? '₿ Auto-detected as crypto → Coinbase' : '📈 Auto-detected as stock → Alpaca'} · tap to override
                </Text>
              )}
            </ScrollView>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={s.saveText}>{saving ? 'Saving…' : 'Create Rule'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function cardStyles(t: Theme) {
  return StyleSheet.create({
    card: { backgroundColor: t.bgCard, borderRadius: 12, padding: 16, marginBottom: 12 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    asset: { color: t.text, fontSize: 18, fontWeight: '700' },
    sub: { color: t.textSub, fontSize: 13, marginTop: 3 },
    actions: { flexDirection: 'row', marginTop: 12, gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: t.accent, alignItems: 'center' },
    deleteBtn: { borderColor: t.negative },
    actionText: { color: t.accent, fontSize: 13, fontWeight: '600' },
  });
}

function styles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: t.textSub, fontSize: 16 },
    hint: { color: t.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    fabText: { color: t.accentText, fontSize: 28, lineHeight: 32 },
    overlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: t.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
    modalTitle: { color: t.text, fontSize: 20, fontWeight: '700', marginBottom: 20 },
    fieldLabel: { color: t.textSub, fontSize: 13, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: t.bgInput, borderRadius: 8, color: t.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: t.border },
    chips: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: t.border },
    chipActive: { backgroundColor: t.accent, borderColor: t.accent },
    chipText: { color: t.textSub, fontSize: 14 },
    chipTextActive: { color: t.accentText },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: t.border, alignItems: 'center' },
    cancelText: { color: t.textSub, fontSize: 16 },
    saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: t.accent, alignItems: 'center' },
    saveText: { color: t.accentText, fontSize: 16, fontWeight: '700' },
  });
}
