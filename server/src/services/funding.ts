import db from '../db';
import { createProcessorToken } from './plaid';
import { getSettings } from './settings';
import { coinbaseAuthHeaders } from './coinbase';
import Alpaca from '@alpacahq/alpaca-trade-api';
import axios from 'axios';

// ── Alpaca ACH ────────────────────────────────────────────────────────────────

async function getAlpacaClient() {
  const s = await getSettings();
  return new Alpaca({ keyId: s.alpacaKey, secretKey: s.alpacaSecret, paper: s.alpacaPaper });
}

export async function depositToAlpaca(bankAccountId: string, amount: number): Promise<string> {
  const account = await db.bankAccount.findUnique({ where: { id: bankAccountId } });
  if (!account) throw new Error('Bank account not found');

  const processorToken = await createProcessorToken(account.accountId, 'alpaca');
  const alpaca = await getAlpacaClient() as any;

  // Create ACH relationship using processor token
  const relationship = await alpaca.createACHRelationship({ processor_token: processorToken });
  const relationshipId = relationship.id;

  // Initiate transfer
  const transfer = await alpaca.createTransfer({
    relationship_id: relationshipId,
    amount: amount.toString(),
    direction: 'INCOMING',
    timing: 'immediate',
  });

  await db.fundingTransfer.create({
    data: { bankAccountId, broker: 'alpaca', amount, status: 'pending', externalId: transfer.id },
  });

  return transfer.id;
}

// ── Coinbase deposit ──────────────────────────────────────────────────────────

export async function depositToCoinbase(_bankAccountId: string, _amount: number): Promise<string> {
  // Plaid does not support Coinbase as a processor partner.
  // Fund your Coinbase account manually at coinbase.com, then use it for crypto DCA.
  throw new Error('Direct bank-to-Coinbase transfers are not supported. Please fund your Coinbase account at coinbase.com.');
}

export async function getTransferHistory() {
  return db.fundingTransfer.findMany({
    include: { bankAccount: { include: { plaidItem: { select: { institutionName: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
