export interface Holding {
  asset: string;
  broker: 'alpaca' | 'coinbase';
  qty: number;
  price: number;
  value: number;
  unrealizedPl: number | null;
}

export interface Portfolio {
  totalValue: number;
  cash: number;
  holdings: Holding[];
}

export interface Rule {
  id: string;
  asset: string;
  amount: number;
  frequency: string;
  broker: string;
  active: boolean;
  nextRunAt: string;
  createdAt: string;
}

export interface Trade {
  id: string;
  ruleId: string | null;
  asset: string;
  side: string;
  qty: number;
  price: number;
  total: number;
  broker: string;
  mode: string;
  executedAt: string;
  rule?: { frequency: string } | null;
}

export interface ServerSettings {
  alpacaKey: string;
  alpacaSecretSet: boolean;
  alpacaPaper: boolean;
  coinbaseKey: string;
  coinbaseSecretSet: boolean;
  coinbasePaper: boolean;
}
