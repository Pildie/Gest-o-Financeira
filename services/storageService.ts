
import { AppData, Category, Account, Goal } from '../types';

const STORAGE_KEY = 'finances_local_v2'; // Bump version

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Alimentação', type: 'EXPENSE', color: '#ef4444', icon: 'Utensils', subcategories: ['Mercado', 'Restaurante', 'Ifood'] },
  { id: 'c2', name: 'Transporte', type: 'EXPENSE', color: '#f97316', icon: 'Car', subcategories: ['Combustível', 'Uber/Taxi', 'Manutenção', 'Ônibus'] },
  { id: 'c3', name: 'Moradia', type: 'EXPENSE', color: '#eab308', icon: 'Home', subcategories: ['Aluguel', 'Condomínio', 'Luz', 'Água', 'Internet'] },
  { id: 'c4', name: 'Lazer', type: 'EXPENSE', color: '#8b5cf6', icon: 'Film', subcategories: ['Cinema', 'Viagem', 'Assinaturas'] },
  { id: 'c5', name: 'Saúde', type: 'EXPENSE', color: '#ec4899', icon: 'Heart', subcategories: ['Farmácia', 'Médico', 'Plano de Saúde'] },
  { id: 'c6', name: 'Salário', type: 'INCOME', color: '#10b981', icon: 'Briefcase', subcategories: ['Salário Mensal', '13º Salário', 'Férias'] },
  { id: 'c7', name: 'Investimentos', type: 'INCOME', color: '#06b6d4', icon: 'TrendingUp', subcategories: ['Dividendos', 'Rendimento Poupança'] },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Carteira (Dinheiro)', type: 'WALLET', balance: 0 },
  { id: 'a2', name: 'Conta Corrente', type: 'CHECKING', balance: 0 },
  { id: 'a3', name: 'Poupança / Reserva', type: 'SAVINGS', balance: 0 },
];

const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', name: 'Reserva de Emergência', targetAmount: 10000, currentAmount: 0, deadline: '2025-12-31', color: '#10b981', icon: 'Shield' }
];

const DEFAULT_DATA: AppData = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  accounts: DEFAULT_ACCOUNTS,
  goals: DEFAULT_GOALS
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge simples para garantir que novos campos existam em dados antigos
      return { ...DEFAULT_DATA, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load data", e);
  }
  return DEFAULT_DATA;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};
