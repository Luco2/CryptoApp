import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, ProcessorTokenCreateRequestProcessorEnum } from 'plaid';
import db from '../db';

function getClient() {
  const env = process.env.PLAID_ENV ?? 'sandbox';
  const config = new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
        'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
      },
    },
  });
  return new PlaidApi(config);
}

export function isConfigured() {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export async function createLinkToken(userId = 'user-1') {
  const client = getClient();
  const res = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'CryptoApp',
    products: [Products.Auth, Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });
  return res.data.link_token;
}

export async function exchangePublicToken(publicToken: string) {
  const client = getClient();
  const exchange = await client.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchange.data.access_token;
  const itemId = exchange.data.item_id;

  // Fetch institution name
  const itemRes = await client.itemGet({ access_token: accessToken });
  const institutionId = itemRes.data.item.institution_id ?? '';
  let institutionName = 'Your Bank';
  if (institutionId) {
    try {
      const instRes = await client.institutionsGetById({ institution_id: institutionId, country_codes: [CountryCode.Us] });
      institutionName = instRes.data.institution.name;
    } catch {}
  }

  // Store PlaidItem
  const item = await db.plaidItem.upsert({
    where: { itemId },
    create: { accessToken, itemId, institutionName },
    update: { accessToken, institutionName },
  });

  // Fetch and store accounts + balances
  await syncAccounts(item.id, accessToken);

  return item;
}

export async function syncAccounts(plaidItemId: string, accessToken: string) {
  const client = getClient();
  const res = await client.accountsBalanceGet({ access_token: accessToken });

  for (const acct of res.data.accounts) {
    await db.bankAccount.upsert({
      where: { accountId: acct.account_id },
      create: {
        plaidItemId,
        accountId: acct.account_id,
        name: acct.name,
        mask: acct.mask ?? '••••',
        type: acct.subtype ?? acct.type,
        balance: acct.balances.current ?? 0,
      },
      update: {
        name: acct.name,
        balance: acct.balances.current ?? 0,
      },
    });
  }
}

export async function refreshAllBalances() {
  const items = await db.plaidItem.findMany({ include: { accounts: true } });
  for (const item of items) {
    try { await syncAccounts(item.id, item.accessToken); } catch {}
  }
}

export async function createProcessorToken(accountId: string, processor: 'alpaca') {
  const account = await db.bankAccount.findUnique({ where: { accountId }, include: { plaidItem: true } });
  if (!account) throw new Error('Bank account not found');

  const client = getClient();
  const res = await client.processorTokenCreate({
    access_token: account.plaidItem.accessToken,
    account_id: accountId,
    processor: ProcessorTokenCreateRequestProcessorEnum.Alpaca,
  });
  return res.data.processor_token;
}

export async function getLinkedAccounts() {
  return db.bankAccount.findMany({
    include: { plaidItem: { select: { institutionName: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function unlinkAccount(accountId: string) {
  const account = await db.bankAccount.findUnique({
    where: { accountId },
    include: { plaidItem: { include: { accounts: true } } },
  });
  if (!account) throw new Error('Account not found');

  // If this is the last account for the item, delete the whole item
  if (account.plaidItem.accounts.length <= 1) {
    await db.plaidItem.delete({ where: { id: account.plaidItemId } });
  } else {
    await db.bankAccount.delete({ where: { accountId } });
  }
}
