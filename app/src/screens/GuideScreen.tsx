import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../theme';

interface Section { title: string; emoji: string; content: (t: Theme) => React.ReactNode; }

function P({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 22, marginBottom: 10 }}>{children}</Text>;
}
function Heading({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 6, marginTop: 4 }}>{children}</Text>;
}
function Bullet({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: 4 }}>
      <Text style={{ color: theme.accent, fontSize: 14, marginRight: 8, lineHeight: 22 }}>•</Text>
      <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 22, flex: 1 }}>{children}</Text>
    </View>
  );
}
function HL({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <Text style={{ color: theme.accent, fontWeight: '600' }}>{children}</Text>;
}
function Step({ n, children, theme }: { n: number; children: React.ReactNode; theme: Theme }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 }}>
        <Text style={{ color: theme.accentText, fontSize: 12, fontWeight: '700' }}>{n}</Text>
      </View>
      <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 22, flex: 1 }}>{children}</Text>
    </View>
  );
}

function Accordion({ section, theme }: { section: Section; theme: Theme }) {
  const [open, setOpen] = useState(false);
  const s = useMemo(() => cardStyles(theme), [theme]);
  return (
    <View style={s.card}>
      <TouchableOpacity style={s.header} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <Text style={s.emoji}>{section.emoji}</Text>
        <Text style={s.title}>{section.title}</Text>
        <Text style={s.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && <View style={s.body}>{section.content(theme)}</View>}
    </View>
  );
}

function cardStyles(t: Theme) {
  return StyleSheet.create({
    card: { backgroundColor: t.bgCard, borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    emoji: { fontSize: 20, marginRight: 10 },
    title: { color: t.text, fontSize: 15, fontWeight: '600', flex: 1 },
    chevron: { color: t.textMuted, fontSize: 12 },
    body: { paddingHorizontal: 16, paddingBottom: 16 },
  });
}

const SECTIONS: Section[] = [
  {
    title: 'What does this app do?', emoji: '📱',
    content: (t) => (<>
      <P theme={t}>This app automatically invests money for you on a schedule — you set the rules once and it handles the rest.</P>
      <P theme={t}>For example: "Buy $25 of Bitcoin every week" or "Buy $50 of Apple stock every month." The app places those purchases automatically without you having to remember.</P>
      <P theme={t}>This strategy is called <HL theme={t}>Dollar-Cost Averaging (DCA)</HL> and it's one of the most widely recommended ways to invest for beginners.</P>
    </>),
  },
  {
    title: 'What is Dollar-Cost Averaging (DCA)?', emoji: '📈',
    content: (t) => (<>
      <P theme={t}>DCA means investing a fixed dollar amount at regular intervals — daily, weekly, or monthly — regardless of the price.</P>
      <P theme={t}>Why it works:</P>
      <Bullet theme={t}>When the price is high, your $25 buys fewer shares.</Bullet>
      <Bullet theme={t}>When the price is low, your $25 buys more shares.</Bullet>
      <Bullet theme={t}>Over time, your average purchase price smooths out the highs and lows.</Bullet>
      <P theme={t}>It removes the pressure of trying to "time the market." You just invest consistently and let time do the work.</P>
    </>),
  },
  {
    title: 'What is Paper Trading?', emoji: '📄',
    content: (t) => (<>
      <P theme={t}><HL theme={t}>Paper trading</HL> means simulated trading with fake money. No real money is ever spent.</P>
      <Bullet theme={t}>Your DCA rules run on a real schedule.</Bullet>
      <Bullet theme={t}>Real market prices are used to calculate trades.</Bullet>
      <Bullet theme={t}>But no actual money moves — it's practice.</Bullet>
      <P theme={t}>Use paper trading to get comfortable before switching to live mode in Settings.</P>
      <P theme={{ ...t, textSub: t.negative }}>⚠ Live mode uses real money. Only enable it when you're sure.</P>
    </>),
  },
  {
    title: 'Stocks — What are they?', emoji: '🏢',
    content: (t) => (<>
      <P theme={t}>A <HL theme={t}>stock</HL> is a small ownership share of a company. If the company grows, your shares are worth more.</P>
      <Heading theme={t}>Popular stocks to start with:</Heading>
      <Bullet theme={t}><HL theme={t}>AAPL</HL> — Apple. Makes the iPhone. Very stable large company.</Bullet>
      <Bullet theme={t}><HL theme={t}>MSFT</HL> — Microsoft. Windows, Xbox, Azure cloud.</Bullet>
      <Bullet theme={t}><HL theme={t}>GOOGL</HL> — Alphabet (Google). Search, YouTube, Android.</Bullet>
      <Bullet theme={t}><HL theme={t}>TSLA</HL> — Tesla. Electric vehicles and energy.</Bullet>
      <Bullet theme={t}><HL theme={t}>SPY</HL> — S&P 500 ETF. Tracks the top 500 US companies at once. Great for beginners who don't want to pick individual stocks.</Bullet>
    </>),
  },
  {
    title: 'Crypto — What is it?', emoji: '₿',
    content: (t) => (<>
      <P theme={t}><HL theme={t}>Cryptocurrency</HL> is digital money not controlled by any government. Crypto is more volatile than stocks — prices can move 5–20% in a single day. DCA is especially useful here.</P>
      <Heading theme={t}>Popular crypto to start with:</Heading>
      <Bullet theme={t}><HL theme={t}>BTC</HL> — Bitcoin. The original crypto. Treated like "digital gold." Most stable of the major cryptos.</Bullet>
      <Bullet theme={t}><HL theme={t}>ETH</HL> — Ethereum. Powers thousands of apps on its blockchain. Second largest crypto.</Bullet>
      <Bullet theme={t}><HL theme={t}>SOL</HL> — Solana. Faster and cheaper than Ethereum. Higher risk/reward.</Bullet>
    </>),
  },
  {
    title: 'How to set up Alpaca (stocks)', emoji: '🦙',
    content: (t) => (<>
      <Step n={1} theme={t}>Go to <HL theme={t}>app.alpaca.markets</HL> and create a free account.</Step>
      <Step n={2} theme={t}>Click <HL theme={t}>Paper Trading</HL> in the left sidebar.</Step>
      <Step n={3} theme={t}>Go to <HL theme={t}>API Keys</HL> in the top-right account menu.</Step>
      <Step n={4} theme={t}>Click <HL theme={t}>Generate New Key</HL>. Copy both the Key ID and Secret Key — the secret is only shown once.</Step>
      <Step n={5} theme={t}>Paste both keys into the <HL theme={t}>Settings tab</HL> of this app.</Step>
    </>),
  },
  {
    title: 'How to set up Coinbase (crypto)', emoji: '🪙',
    content: (t) => (<>
      <Step n={1} theme={t}>Go to <HL theme={t}>coinbase.com</HL> and create an account. Complete identity verification.</Step>
      <Step n={2} theme={t}>Go to <HL theme={t}>Settings → API</HL>.</Step>
      <Step n={3} theme={t}>Click <HL theme={t}>New API Key</HL>. Give it a nickname like "CryptoApp".</Step>
      <Step n={4} theme={t}>Enable <HL theme={t}>View</HL> and <HL theme={t}>Trade</HL> permissions. Leave withdraw OFF.</Step>
      <Step n={5} theme={t}>Paste the key and secret into the <HL theme={t}>Settings tab</HL>.</Step>
      <P theme={t}>In paper mode, Coinbase keys are optional — the app simulates trades locally.</P>
    </>),
  },
  {
    title: 'How to create your first DCA rule', emoji: '⚙️',
    content: (t) => (<>
      <Step n={1} theme={t}>Tap the <HL theme={t}>DCA Rules</HL> tab.</Step>
      <Step n={2} theme={t}>Tap the <HL theme={t}>+</HL> button in the bottom-right corner.</Step>
      <Step n={3} theme={t}>Enter an asset symbol — e.g. <HL theme={t}>BTC</HL> for Bitcoin or <HL theme={t}>AAPL</HL> for Apple.</Step>
      <Step n={4} theme={t}>Enter a dollar amount — e.g. <HL theme={t}>10</HL> to invest $10 each time.</Step>
      <Step n={5} theme={t}>Choose a frequency: daily, weekly, or monthly.</Step>
      <Step n={6} theme={t}>Choose a broker: <HL theme={t}>coinbase</HL> for crypto, <HL theme={t}>alpaca</HL> for stocks.</Step>
      <Step n={7} theme={t}>Tap <HL theme={t}>Create Rule</HL>. Done!</Step>
      <P theme={t}>Tap <HL theme={t}>Run now</HL> on any rule to trigger it immediately.</P>
    </>),
  },
  {
    title: 'Reading the Dashboard', emoji: '📊',
    content: (t) => (<>
      <Bullet theme={t}><HL theme={t}>Total Portfolio Value</HL> — current market value of everything you hold.</Bullet>
      <Bullet theme={t}><HL theme={t}>Holdings</HL> — each asset you own with current value and unrealized P&L.</Bullet>
      <P theme={t}><HL theme={t}>Unrealized P&L</HL> shows how much you've gained or lost vs. what you paid. Green = gain, red = loss. It's "unrealized" because you haven't sold yet.</P>
      <P theme={t}>With DCA, short-term red numbers are normal. The goal is long-term growth over months and years.</P>
    </>),
  },
];

export default function GuideScreen() {
  const theme = useTheme();
  const s = useMemo(() => pageStyles(theme), [theme]);
  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={s.title}>Beginner's Guide</Text>
      <Text style={s.subtitle}>Tap any section to expand it.</Text>
      {SECTIONS.map((section) => (
        <Accordion key={section.title} section={section} theme={theme} />
      ))}
    </ScrollView>
  );
}

function pageStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    title: { color: t.text, fontSize: 26, fontWeight: '700', marginBottom: 6 },
    subtitle: { color: t.textMuted, fontSize: 14, marginBottom: 20 },
  });
}
