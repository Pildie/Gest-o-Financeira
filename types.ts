
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED';

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
  subcategories: string[];
  budgetLimit?: number; // Limite mensal para alertas
}

export interface Account {
  id: string;
  name: string;
  type: 'WALLET' | 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD';
  balance: number;
  // Campos específicos para Cartão de Crédito
  creditLimit?: number;
  closingDay?: number; // Dia que fecha a fatura
  dueDay?: number;     // Dia do vencimento
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string; // ISO date string YYYY-MM-DD
  categoryId?: string;
  subCategory?: string;
  accountId: string;
  toAccountId?: string;
  tags?: string[];
  icon?: string; // Ícone personalizado
  
  groupId?: string;
  installment?: {
    current: number;
    total: number;
  };
  isRecurring?: boolean;

  // Cartão de crédito por competência
  creditCardId?: string;
  invoiceMonth?: string; // YYYY-MM
  installmentId?: string;
}


export type InvestmentType = 'CDB' | 'CDI' | 'FUNDO_RF' | 'FUNDO_MULT' | 'TESOURO' | 'OUTRO';

export interface InvestmentAsset {
  id: string;
  name: string;
  type: InvestmentType;
  institution: string;
  principal: number;
  annualRate: number; // % a.a.
  benchmark?: 'CDI' | 'IPCA' | 'PRE';
  benchmarkPercent?: number;
  liquidityDays: number;
  startDate: string;
  expectedWithdrawalDate?: string;
  iofRetroactive: boolean;
  iofRate: number;
  irRate: number;
  irRetroactiveBase?: string;
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  icon: string;
}

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  goals: Goal[];
  investments: InvestmentAsset[];
}

export interface CategoryStats {
  average: number;
  count: number;
  max: number;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  status?: TransactionStatus;
  type?: TransactionType;
}

export interface FinanceContextType {
  data: AppData;
  currentDate: Date;
  changeMonth: (offset: number) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Transações
  addTransaction: (t: Omit<Transaction, 'id'>, options?: { installments?: number, isRecurring?: boolean, repeatCount?: number }) => void;
  editTransaction: (id: string, updatedTransaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionStatus: (id: string) => void;
  
  updateAccountBalance: (id: string, newBalance: number) => void;
  updateAccountDetails: (id: string, details: Partial<Account>) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  
  // Categorias
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void; // Novo
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, sub: string) => void;

  // Metas
  addGoal: (g: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, currentAmount: number) => void;
  deleteGoal: (id: string) => void;

  // Investimentos
  addInvestment: (i: Omit<InvestmentAsset, 'id'>) => void;
  updateInvestment: (id: string, details: Partial<InvestmentAsset>) => void;
  deleteInvestment: (id: string) => void;

  // IO
  importData: (jsonData: string) => boolean;
  importOFX: (ofxString: string, accountId: string) => number;
  importCSV: (csvString: string, accountId: string, separator: string) => number;
  exportData: () => string;
  
  getCategoryStats: (categoryId: string) => CategoryStats;
  getUpcomingBills: () => Transaction[]; // Novo: Lembretes
  filteredTransactions: Transaction[];
  
  // Busca Avançada
  advancedFilters: FilterOptions;
  setAdvancedFilters: (filters: FilterOptions) => void;
}
