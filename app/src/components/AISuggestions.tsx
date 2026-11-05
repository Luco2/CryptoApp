import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';

interface Suggestion {
  symbol: string;
  name: string;
  reason: string;
  broker: 'alpaca' | 'coinbase';
  frequency: string;
  amount: number;
}

interface SuggestionsResponse {
  conservative: Suggestion[];
  moderate: Suggestion[];
  aggressive: Suggestion[];
  generatedAt: string;
}

interface Props {
  onSelect: (s: Suggestion) => void;
}

const RISK_LEVELS = [
  { key: 'conservative' as const, label: 'Conservative', emoji: '🟢', desc: 'Stable, lower-risk assets' },
  { key: 'moderate' as const,     label: 'Moderate',     emoji: '🟡', desc: 'Balanced growth & risk' },
  { key: 'aggressive' as const,   label: 'Aggressive',   emoji: '🔴', desc: 'High growth, high risk' },
];

export default function AISuggestions({ onSelect }: Props) {
  const theme = useTheme();
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  const fetch = async () => {
    if (data) { setOpen(true); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<SuggestionsResponse>('/suggestions');
      setData(res);
      setOpen(true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = data?.[activeTab] ?? [];

  return (
    <View>
      <TouchableOpacity
        style={[s.triggerBtn, { backgroundColor: theme.accent + '18', borderColor: theme.accent, borderWidth: 1 }]}
        onPress={fetch}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator size="small" color={theme.accent} />
          : <Text style={[s.triggerText, { color: theme.accent }]}>✨ AI Suggestions</Text>
        }
      </TouchableOpacity>

      {error && <Text style={[s.errorText, { color: theme.negative }]}>{error}</Text>}

      {open && data && (
        <View style={[s.panel, { backgroundColor: theme.bgInput, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={s.panelHeader}>
            <Text style={[s.panelTitle, { color: theme.text }]}>AI Picks</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={[s.closeX, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Risk tabs */}
          <View style={s.tabs}>
            {RISK_LEVELS.map(({ key, label, emoji }) => (
              <Pressable
                key={key}
                style={[s.tab, activeTab === key && { backgroundColor: theme.accent, borderColor: theme.accent }, { borderColor: theme.border }]}
                onPress={() => setActiveTab(key)}
              >
                <Text style={[s.tabText, { color: activeTab === key ? theme.accentText : theme.textSub }]}>
                  {emoji} {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.riskDesc, { color: theme.textMuted }]}>
            {RISK_LEVELS.find(r => r.key === activeTab)?.desc}
          </Text>

          {/* Suggestion cards */}
          {suggestions.map((s2) => (
            <TouchableOpacity
              key={s2.symbol}
              style={[s.card, { backgroundColor: theme.bgCard, borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => { onSelect(s2); setOpen(false); }}
              activeOpacity={0.7}
            >
              <View style={s.cardTop}>
                <View style={[s.symbolBadge, { backgroundColor: theme.accent + '22' }]}>
                  <Text style={[s.symbol, { color: theme.accent }]}>{s2.symbol}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[s.name, { color: theme.text }]}>{s2.name}</Text>
                  <Text style={[s.meta, { color: theme.textMuted }]}>${s2.amount} · {s2.frequency} · {s2.broker}</Text>
                </View>
                <Text style={[s.tap, { color: theme.accent }]}>+ Use</Text>
              </View>
              <Text style={[s.reason, { color: theme.textSub }]}>{s2.reason}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[s.disclaimer, { color: theme.textMuted }]}>
            AI suggestions are not financial advice. Always do your own research.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  triggerBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  triggerText: { fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 12, marginTop: 6 },
  panel: { marginTop: 12, borderRadius: 12, padding: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { fontSize: 15, fontWeight: '700' },
  closeX: { fontSize: 16, padding: 4 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  tabText: { fontSize: 11, fontWeight: '600' },
  riskDesc: { fontSize: 12, marginBottom: 10 },
  card: { borderRadius: 10, padding: 12, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  symbolBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  symbol: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 13, fontWeight: '600' },
  meta: { fontSize: 11, marginTop: 2 },
  tap: { fontSize: 12, fontWeight: '700' },
  reason: { fontSize: 12, marginTop: 6, lineHeight: 17 },
  disclaimer: { fontSize: 10, marginTop: 8, textAlign: 'center', lineHeight: 14 },
});
