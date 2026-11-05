import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import InfoTooltip from '../components/InfoTooltip';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../theme';
import { Holding, Portfolio } from '../types';

function HoldingRow({ item, theme }: { item: Holding; theme: Theme }) {
  const s = useMemo(() => rowStyles(theme), [theme]);
  const pl = item.unrealizedPl;
  const plColor = pl === null ? theme.textMuted : pl >= 0 ? theme.positive : theme.negative;
  const plText = pl === null ? '—' : `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`;
  return (
    <View style={s.row}>
      <View>
        <Text style={s.asset}>{item.asset}</Text>
        <Text style={s.broker}>{item.broker}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.value}>${item.value.toFixed(2)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Text style={[s.pl, { color: plColor }]}>{plText}</Text>
          <InfoTooltip
            title="Unrealized P&L"
            body={`P&L stands for Profit & Loss. This shows how much your ${item.asset} holding has gained or lost compared to what you paid for it total.\n\nIt's "unrealized" because you haven't sold yet — the number goes up and down with the market price. A loss here doesn't mean you've lost money permanently; prices fluctuate, especially with DCA over time.`}
          />
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const api = useApi();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Portfolio>('/portfolio');
      setPortfolio(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load portfolio');
    }
  }, [api]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={theme.accent} /></View>;

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.error}>{error}</Text>
        <Text style={s.hint}>Make sure the server is running and the URL in Settings is correct.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={s.container}
      data={portfolio?.holdings ?? []}
      keyExtractor={(item) => `${item.broker}-${item.asset}`}
      renderItem={({ item }) => <HoldingRow item={item} theme={theme} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      ListHeaderComponent={
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.label}>Total Portfolio Value</Text>
            <InfoTooltip
              title="Total Portfolio Value"
              body="The current market value of all your holdings combined, including any uninvested cash in your Alpaca account. This number updates in real time when you pull to refresh."
            />
          </View>
          <Text style={s.totalValue}>${portfolio?.totalValue.toFixed(2) ?? '—'}</Text>
          {(portfolio?.cash ?? 0) > 0 && <Text style={s.cash}>Cash: ${portfolio!.cash.toFixed(2)}</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 4 }}>
            <Text style={s.sectionTitle}>Holdings</Text>
            <InfoTooltip
              title="What are Holdings?"
              body="These are the assets you currently own. Each row shows the asset, which broker holds it, its current market value, and your unrealized P&L (profit or loss compared to what you paid)."
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>No holdings yet.</Text>
          <Text style={s.hint}>Add a DCA rule in the Rules tab to get started.</Text>
        </View>
      }
    />
  );
}

function rowStyles(t: Theme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: t.borderLight },
    asset: { color: t.text, fontSize: 17, fontWeight: '600' },
    broker: { color: t.textMuted, fontSize: 12, marginTop: 2 },
    value: { color: t.text, fontSize: 16, fontWeight: '500' },
    pl: { fontSize: 13, marginTop: 2 },
  });
}

function styles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg },
    header: { padding: 24, paddingBottom: 8 },
    label: { color: t.textMuted, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
    totalValue: { color: t.text, fontSize: 40, fontWeight: '700', marginTop: 4 },
    cash: { color: t.textSub, fontSize: 14, marginTop: 4 },
    sectionTitle: { color: t.textMuted, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 4 },
    error: { color: t.negative, fontSize: 16, textAlign: 'center', paddingHorizontal: 24 },
    hint: { color: t.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
    empty: { alignItems: 'center', paddingTop: 48 },
    emptyText: { color: t.textSub, fontSize: 16 },
  });
}
