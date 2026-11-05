import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../theme';
import { Trade } from '../types';

function TradeRow({ trade, theme }: { trade: Trade; theme: Theme }) {
  const s = useMemo(() => rowStyles(theme), [theme]);
  const date = new Date(trade.executedAt);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={s.row}>
      <View>
        <Text style={s.asset}>{trade.asset}</Text>
        <Text style={s.meta}>{trade.broker} · {trade.mode}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.total}>${trade.total.toFixed(2)}</Text>
        <Text style={s.qty}>{trade.qty.toFixed(6)} units</Text>
        <Text style={s.date}>{dateStr} {timeStr}</Text>
      </View>
    </View>
  );
}

export default function TradesScreen() {
  const theme = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const api = useApi();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setTrades(await api.get<Trade[]>('/trades')); } catch {}
  }, [api]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <FlatList
      style={s.container}
      data={trades}
      keyExtractor={(t) => t.id}
      renderItem={({ item }) => <TradeRow trade={item} theme={theme} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      ListHeaderComponent={<Text style={s.header}>Trade History</Text>}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>No trades yet.</Text>
          <Text style={s.hint}>Trades appear here once a DCA rule runs.</Text>
        </View>
      }
    />
  );
}

function rowStyles(t: Theme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: t.borderLight },
    asset: { color: t.text, fontSize: 17, fontWeight: '600' },
    meta: { color: t.textMuted, fontSize: 12, marginTop: 2 },
    total: { color: t.text, fontSize: 15, fontWeight: '600' },
    qty: { color: t.textSub, fontSize: 12, marginTop: 2 },
    date: { color: t.textMuted, fontSize: 11, marginTop: 2 },
  });
}

function styles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg },
    header: { color: t.textMuted, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: t.textSub, fontSize: 16 },
    hint: { color: t.textMuted, fontSize: 13, marginTop: 6 },
  });
}
