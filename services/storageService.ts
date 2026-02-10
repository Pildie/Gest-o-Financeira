import { AppData, Category, Account, Goal, Transaction, InvestmentAsset } from '../types';

const STORAGE_KEYS = ['finances_local_v3', 'finances_local_v2', 'finances_local_v1', 'finances_local'];
const PRIMARY_STORAGE_KEY = STORAGE_KEYS[0];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#ef4444', icon: 'Utensils', subcategories: ['Mercado', 'Restaurante', 'Ifood'] },
  { id: 'c2', name: 'Transporte', type: 'EXPENSE', color: '#f97316', icon: 'Car', subcategories: ['Combustível', 'Uber/Taxi', 'Manutenção', 'Ônibus'] },
  { id: 'c3', name: 'Moradia', type: 'EXPENSE', color: '#eab308', icon: 'Home', subcategories: ['Aluguel', 'Condomínio', 'Luz', 'Água', 'Internet'] },
  { id: 'c4', name: 'Lazer', type: 'EXPENSE', color: '#8b5cf6', icon: 'Film', subcategories: ['Cinema', 'Viagem', 'Assinaturas'] },
  { id: 'c5', name: 'Saúde', type: 'EXPENSE', color: '#ec4899', icon: 'Heart', subcategories: ['Farmácia', 'Médico', 'Plano de Saúde'] },
  { id: 'c6', name: 'Salário', type: 'INCOME', color: '#10b981', icon: 'Briefcase', subcategories: ['Salário Mensal', '13º Salário', 'Férias'] },
  { id: 'c7', name: 'Investimentos', type: 'INCOME', color: '#06b6d4', icon: 'TrendingUp', subcategories: ['Dividendos', 'Rendimento Poupança', 'Aporte CDB/CDI/Fundos'] },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Carteira (Dinheiro)', type: 'WALLET', balance: 0 },
  { id: 'a2', name: 'Conta Corrente', type: 'CHECKING', balance: 0 },
  { id: 'a3', name: 'Poupança / Reserva', type: 'SAVINGS', balance: 0 },
  { id: 'a4', name: 'Corretora / Investimentos', type: 'INVESTMENT', balance: 0 },
];

const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', name: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 0, deadline: '2025-12-31', color: '#10b981', icon: 'Shield' }
];

const DEFAULT_DATA: AppData = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  accounts: DEFAULT_ACCOUNTS,
  goals: DEFAULT_GOALS,
  investments: [],
};

const randomId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

const dedupeById = <T extends { id?: string }>(items: unknown, prefix: string): T[] => {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, T>();

  items.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return;
    const candidate = raw as T;
    const rawId = candidate.id;
    const hasId = typeof rawId === 'string' && rawId.trim().length > 0;
    let id = hasId ? rawId.trim() : `${prefix}-${index + 1}`;
    while (map.has(id)) id = randomId(prefix);
    map.set(id, { ...candidate, id } as T);
  });

  return Array.from(map.values());
};

const mergeAccountsByType = (accounts: Account[] = []): Account[] => {
  const existingByType = new Set(accounts.map(acc => acc.type));
  const normalized = [...accounts];

  DEFAULT_ACCOUNTS.forEach(acc => {
    if (!existingByType.has(acc.type)) {
      normalized.push({ ...acc, id: randomId('account') });
    }
  });

  return normalized;
};

const pickBestStoredPayload = (): unknown => {
  let bestScore = -1;
  let bestPayload: unknown = null;

  STORAGE_KEYS.forEach(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const score =
        (Array.isArray(parsed?.transactions) ? parsed.transactions.length : 0) * 1000 +
        (Array.isArray(parsed?.accounts) ? parsed.accounts.length : 0) * 100 +
        (Array.isArray(parsed?.categories) ? parsed.categories.length : 0) * 10 +
        (Array.isArray(parsed?.goals) ? parsed.goals.length : 0);

      if (score > bestScore) {
        bestScore = score;
        bestPayload = parsed;
      }
    } catch (error) {
      console.warn(`Ignoring invalid storage payload at key ${key}`, error);
    }
  });

  return bestPayload;
};

const sanitizeData = (parsed: any): AppData => {
  const categories = dedupeById<Category>(parsed?.categories, 'category').map(category => ({
    ...category,
    subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
  }));

  const accounts = mergeAccountsByType(dedupeById<Account>(parsed?.accounts, 'account'));
  const accountIdSet = new Set(accounts.map(account => account.id));

  const transactions = dedupeById<Transaction>(parsed?.transactions, 'transaction').map(transaction => {
    const fallbackAccountId = accounts[0]?.id || randomId('account');
    return {
      ...transaction,
      accountId: accountIdSet.has(transaction.accountId) ? transaction.accountId : fallbackAccountId,
      toAccountId: transaction.toAccountId && accountIdSet.has(transaction.toAccountId) ? transaction.toAccountId : undefined,
    };
  });

  const goals = dedupeById<Goal>(parsed?.goals, 'goal');

  return {
    transactions,
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS,
    goals: goals.length ? goals : DEFAULT_GOALS,
    investments: dedupeById<InvestmentAsset>(parsed?.investments, 'investment'),
  };
};

export const loadData = (): AppData => {
  try {
    const parsed = pickBestStoredPayload();
    if (parsed) return sanitizeData(parsed);
  } catch (e) {
    console.error('Failed to load data', e);
  }

  return DEFAULT_DATA;
};

export const saveData = (data: AppData): void => {
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(PRIMARY_STORAGE_KEY, payload);
    // Mantém compatibilidade entre versões em execução simultânea.
    localStorage.setItem('finances_local_v2', payload);
  } catch (e) {
    console.error('Failed to save data', e);
  }
};
