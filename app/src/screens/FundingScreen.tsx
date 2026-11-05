import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import InfoTooltip from '../components/InfoTooltip';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';
import { Theme } from '../theme';
import { Rule } from '../types';

type Mode = 'reminders' | 'bank';

interface BankAccount {
  id: string;
  accountId: string;
  name: string;
  mask: string;
  type: string;
  balance: number;
  plaidItem: { institutionName: string };
}

interface FundingTransfer {
  id: string;
  broker: string;
  amount: number;
  status: string;
  createdAt: string;
  bankAccount: { name: string; plaidItem: { institutionName: string } };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function FundingScreen() {
  const theme = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const api = useApi();
  const { serverUrl } = useAppStore();
  const [mode, setMode] = useState<Mode>('reminders');

  const [rules, setRules] = useState<Rule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [notifGranted, setNotifGranted] = useState<boolean>(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [depositAccount, setDepositAccount] = useState<BankAccount | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositBroker, setDepositBroker] = useState<'alpaca' | 'coinbase'>('alpaca');
  const [depositing, setDepositing] = useState(false);
  const [transfers, setTransfers] = useState<FundingTransfer[]>([]);

  const loadRules = useCallback(async () => {
    try {
      const data = await api.get<Rule[]>('/rules');
      setRules(data.filter(r => r.active));
    } catch {}
    setRulesLoading(false);
  }, [api]);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const [accts, hist] = await Promise.all([
        api.get<BankAccount[]>('/plaid/accounts'),
        api.get<FundingTransfer[]>('/funding/transfers'),
      ]);
      setAccounts(accts);
      setTransfers(hist);
    } catch {}
    setAccountsLoading(false);
  }, [api]);

  useEffect(() => {
    loadRules();
    Notifications.getPermissionsAsync().then(p => setNotifGranted(p.granted));
  }, [loadRules]);

  useEffect(() => {
    if (mode === 'bank') loadAccounts();
  }, [mode, loadAccounts]);

  const scheduleReminders = async () => {
    let granted = notifGranted;
    if (!granted) {
      const { granted: g } = await Notifications.requestPermissionsAsync();
      setNotifGranted(g);
      granted = g;
    }
    if (!granted) {
      Alert.alert('Permission needed', 'Go to your phone Settings → Notifications and enable notifications for this app.');
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    let count = 0;
    for (const rule of rules) {
      const runAt = new Date(rule.nextRunAt);
      const remindAt = new Date(runAt.getTime() - 60 * 60 * 1000);
      if (remindAt <= new Date()) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Funding reminder',
          body: `Top up ${rule.broker === 'alpaca' ? 'Alpaca' : 'Coinbase'} by $${rule.amount} for your ${rule.asset} DCA run`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
      });
      count++;
    }

    setScheduledCount(count);
    if (count === 0) {
      Alert.alert('No upcoming runs', 'Your next DCA runs are too soon (within 1 hour) to schedule a reminder.');
    } else {
      Alert.alert('Reminders set! 🔔', `${count} reminder${count !== 1 ? 's' : ''} scheduled. You'll get notified 1 hour before each run.`);
    }
  };

  const openPlaidLink = async () => {
    await WebBrowser.openBrowserAsync(`${serverUrl}/plaid/link-page`);
    loadAccounts();
  };

  const unlinkAccount = (accountId: string) => {
    Alert.alert('Unlink account?', 'This removes the bank account from the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink', style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/plaid/accounts/${accountId}`);
            setDepositAccount(null);
            loadAccounts();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const doDeposit = async () => {
    if (!depositAccount || !depositAmount) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive dollar amount.');
      return;
    }
    setDepositing(true);
    try {
      await api.post('/funding/deposit', { bankAccountId: depositAccount.id, broker: depositBroker, amount: amt });
      Alert.alert('Transfer initiated! 🎉', 'Your deposit is on its way. ACH transfers take 1–3 business days.');
      setDepositAmount('');
      setDepositAccount(null);
      loadAccounts();
    } catch (err: any) {
      Alert.alert('Deposit failed', err.message);
    }
    setDepositing(false);
  };

  const byBroker = rules.reduce<Record<string, number>>((acc, r) => {
    acc[r.broker] = (acc[r.broker] ?? 0) + r.amount;
    return acc;
  }, {});

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  const statusColor = (status: string) => status === 'completed' ? theme.positive : theme.accent;

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.modeBar}>
          <TouchableOpacity
            style={[s.modeBtn, mode === 'reminders' && s.modeBtnActive]}
            onPress={() => setMode('reminders')}
          >
            <Text style={[s.modeBtnText, mode === 'reminders' && s.modeBtnTextActive]}>🔔 Reminders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeBtn, mode === 'bank' && s.modeBtnActive]}
            onPress={() => setMode('bank')}
          >
            <Text style={[s.modeBtnText, mode === 'bank' && s.modeBtnTextActive]}>🏦 Link Bank</Text>
          </TouchableOpacity>
        </View>

        {mode === 'reminders' ? (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>🔔 Free funding reminders</Text>
              <Text style={s.cardBody}>
                Get a notification 1 hour before each DCA run so you have time to manually top up your Alpaca or
                Coinbase account. No bank connection required — 100% free.
              </Text>
            </View>

            {rulesLoading ? (
              <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />
            ) : rules.length === 0 ? (
              <View style={s.card}>
                <Text style={s.emptyText}>No active DCA rules yet.{'\n'}Create rules in the DCA Rules tab first, then come back to set reminders.</Text>
              </View>
            ) : (
              <>
                <View style={s.card}>
                  <Text style={s.cardTitle}>Upcoming funding needed</Text>
                  {Object.entries(byBroker).map(([broker, total]) => (
                    <View key={broker} style={s.brokerRow}>
                      <Text style={s.rowLabel}>
                        {broker === 'alpaca' ? '📈 Alpaca account' : '🪙 Coinbase account'}
                      </Text>
                      <Text style={s.rowValue}>${total.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.card}>
                  <Text style={s.cardTitle}>Your DCA schedule</Text>
                  {rules.map(rule => (
                    <View key={rule.id} style={s.ruleRow}>
                      <View>
                        <Text style={s.ruleAsset}>{rule.asset} — ${rule.amount}</Text>
                        <Text style={s.ruleMeta}>{rule.frequency} · {rule.broker}</Text>
                      </View>
                      <Text style={s.ruleMeta}>Next: {fmt(rule.nextRunAt)}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={s.btn} onPress={scheduleReminders}>
                  <Text style={s.btnText}>
                    {scheduledCount > 0 ? `✓ ${scheduledCount} reminders active — tap to refresh` : '🔔 Set reminders for all runs'}
                  </Text>
                </TouchableOpacity>
                <Text style={s.hint}>You'll be notified 1 hour before each DCA run</Text>
              </>
            )}
          </>
        ) : (
          <>
            <View style={s.card}>
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>🏦 Connect your bank</Text>
                <InfoTooltip
                  title="Bank linking with Plaid"
                  body="We use Plaid, the same technology used by apps like Venmo and Robinhood. Your bank credentials are entered directly with your bank — we only receive a secure token. Your login info is never stored."
                />
              </View>
              <Text style={s.cardBody}>
                Link a bank account to fund your Alpaca or Coinbase account directly from this app.
                Transfers are ACH and take 1–3 business days.
              </Text>
            </View>

            <TouchableOpacity style={s.btn} onPress={openPlaidLink}>
              <Text style={s.btnText}>+ Link bank account</Text>
            </TouchableOpacity>

            {accountsLoading ? (
              <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />
            ) : (
              <>
                {accounts.length > 0 && (
                  <>
                    <Text style={s.sectionTitle}>LINKED ACCOUNTS</Text>
                    <View style={s.card}>
                      {accounts.map(acct => (
                        <View key={acct.id} style={s.accountRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={s.accountName}>
                              {acct.plaidItem.institutionName} ····{acct.mask}
                            </Text>
                            <Text style={s.accountMeta}>{acct.name} · {acct.type}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 6 }}>
                            <Text style={s.accountBalance}>${acct.balance.toFixed(2)}</Text>
                            <TouchableOpacity
                              onPress={() => setDepositAccount(depositAccount?.id === acct.id ? null : acct)}
                            >
                              <Text style={s.actionLink}>
                                {depositAccount?.id === acct.id ? 'Cancel' : 'Deposit →'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => unlinkAccount(acct.accountId)}>
                              <Text style={s.unlinkLink}>Unlink</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>

                    {depositAccount && (
                      <View style={s.card}>
                        <Text style={s.cardTitle}>Deposit from {depositAccount.plaidItem.institutionName}</Text>
                        <TextInput
                          style={s.input}
                          placeholder="Amount (USD)"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="decimal-pad"
                          value={depositAmount}
                          onChangeText={setDepositAmount}
                        />
                        <Text style={s.fieldLabel}>Transfer to: 📈 Alpaca</Text>
                        <Text style={[s.hint, { marginBottom: 4 }]}>
                          Bank transfers go to Alpaca only. For Coinbase, add funds at coinbase.com.
                        </Text>
                        <TouchableOpacity
                          style={[s.btn, (!depositAmount || depositing) && { opacity: 0.6 }]}
                          onPress={doDeposit}
                          disabled={!depositAmount || depositing}
                        >
                          {depositing
                            ? <ActivityIndicator color={theme.accentText} />
                            : <Text style={s.btnText}>Transfer ${depositAmount || '0.00'}</Text>}
                        </TouchableOpacity>
                      </View>
                    )}

                    {transfers.length > 0 && (
                      <>
                        <Text style={s.sectionTitle}>RECENT TRANSFERS</Text>
                        <View style={s.card}>
                          {transfers.slice(0, 10).map(t => (
                            <View key={t.id} style={s.transferRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={s.transferTitle}>
                                  ${t.amount.toFixed(2)} → {t.broker === 'alpaca' ? 'Alpaca' : 'Coinbase'}
                                </Text>
                                <Text style={s.transferMeta}>{fmt(t.createdAt)} · {t.bankAccount.name}</Text>
                              </View>
                              <Text style={[s.statusBadge, { color: statusColor(t.status), backgroundColor: statusColor(t.status) + '22' }]}>
                                {t.status}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                  </>
                )}

                {accounts.length === 0 && (
                  <Text style={[s.emptyText, { marginTop: 20 }]}>
                    No bank accounts linked yet.{'\n'}Tap "Link bank account" above to get started.
                  </Text>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function styles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 16 },
    modeBar: {
      flexDirection: 'row', backgroundColor: t.bgCard, borderRadius: 12,
      padding: 4, marginBottom: 16, borderWidth: 1, borderColor: t.border,
    },
    modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    modeBtnActive: { backgroundColor: t.accent },
    modeBtnText: { fontWeight: '600', fontSize: 14, color: t.textMuted },
    modeBtnTextActive: { color: t.accentText },
    card: {
      backgroundColor: t.bgCard, borderRadius: 14, padding: 16,
      marginBottom: 12, borderWidth: 1, borderColor: t.border,
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 6 },
    cardBody: { fontSize: 14, color: t.textSub, lineHeight: 20 },
    brokerRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.borderLight,
    },
    rowLabel: { fontSize: 14, color: t.textSub },
    rowValue: { fontSize: 14, fontWeight: '700', color: t.text },
    ruleRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.borderLight,
    },
    ruleAsset: { fontSize: 14, fontWeight: '700', color: t.text },
    ruleMeta: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    btn: {
      backgroundColor: t.accent, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center', marginTop: 8,
    },
    btnText: { color: t.accentText, fontWeight: '700', fontSize: 15 },
    hint: { color: t.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 4 },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: t.textMuted,
      letterSpacing: 0.8, marginTop: 16, marginBottom: 8,
    },
    accountRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.borderLight,
    },
    accountName: { fontSize: 14, fontWeight: '600', color: t.text },
    accountMeta: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    accountBalance: { fontSize: 14, fontWeight: '700', color: t.positive },
    actionLink: { fontSize: 12, fontWeight: '600', color: t.accent },
    unlinkLink: { fontSize: 12, color: t.negative },
    input: {
      backgroundColor: t.bgInput, borderWidth: 1, borderColor: t.border,
      borderRadius: 10, padding: 12, color: t.text, fontSize: 14, marginTop: 4,
    },
    fieldLabel: { fontSize: 13, color: t.textSub, marginTop: 14, marginBottom: 4 },
    brokerPicker: { flexDirection: 'row', gap: 8 },
    brokerOpt: {
      flex: 1, paddingVertical: 10, alignItems: 'center',
      borderRadius: 10, borderWidth: 1.5, borderColor: t.border,
    },
    brokerOptActive: { borderColor: t.accent, backgroundColor: t.bgInput },
    brokerOptText: { fontSize: 13, fontWeight: '600', color: t.textSub },
    brokerOptTextActive: { color: t.accent },
    transferRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.borderLight,
    },
    transferTitle: { fontSize: 14, fontWeight: '600', color: t.text },
    transferMeta: { fontSize: 12, color: t.textMuted, marginTop: 2 },
    statusBadge: {
      fontSize: 11, fontWeight: '600',
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    emptyText: { textAlign: 'center', color: t.textMuted, fontSize: 14, lineHeight: 22 },
  });
}
