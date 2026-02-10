
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AppData, FinanceContextType, Transaction, CategoryStats, Category, Goal, TransactionStatus, Account, FilterOptions, InvestmentAsset } from '../types';
import { loadData, saveData } from '../services/storageService';
import { parseOFX } from '../services/ofxParser';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadData());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});

  useEffect(() => {
    saveData(data);
  }, [data]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  // --- ÍNDICE DE BUSCA OTIMIZADO ---
  const searchIndex = useMemo(() => {
    return data.transactions.map(t => {
      const category = data.categories.find(c => c.id === t.categoryId);
      const searchTerms = [
        t.description,
        t.amount.toString(),
        category?.name || '',
        t.subCategory || '',
        t.tags?.join(' ') || '',
        t.date.split('-').reverse().join('/')
      ].join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      return { id: t.id, term: searchTerms };
    });
  }, [data.transactions, data.categories]);

  // --- FILTRAGEM UNIFICADA ---
  const filteredTransactions = useMemo(() => {
    let result = data.transactions;

    // 1. Busca Texto Global
    if (searchQuery.trim().length > 0) {
      const normalizedQuery = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const matchingIds = new Set(
        searchIndex
          .filter(item => item.term.includes(normalizedQuery))
          .map(item => item.id)
      );
      result = result.filter(t => matchingIds.has(t.id));
    } else if (!advancedFilters.startDate && !advancedFilters.endDate) {
      // Se não tem busca nem filtro de data específico, usa o Mês Atual
      result = result.filter(t => {
        const tDate = new Date(t.date + 'T00:00:00');
        return (
          tDate.getMonth() === currentDate.getMonth() &&
          tDate.getFullYear() === currentDate.getFullYear()
        );
      });
    }

    // 2. Filtros Avançados
    if (advancedFilters.startDate) {
      result = result.filter(t => t.date >= advancedFilters.startDate!);
    }
    if (advancedFilters.endDate) {
      result = result.filter(t => t.date <= advancedFilters.endDate!);
    }
    if (advancedFilters.accountId) {
      result = result.filter(t => t.accountId === advancedFilters.accountId || t.toAccountId === advancedFilters.accountId);
    }
    if (advancedFilters.status) {
      result = result.filter(t => t.status === advancedFilters.status);
    }
    if (advancedFilters.type) {
      result = result.filter(t => t.type === advancedFilters.type);
    }

    // Ordenação: Data DESC
    return result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeB - timeA;
      if (a.type === 'INCOME' && b.type === 'EXPENSE') return -1;
      return 1;
    });
  }, [data.transactions, currentDate, searchQuery, searchIndex, advancedFilters]);


  const applyBalanceEffect = (accounts: typeof data.accounts, transaction: Transaction, reverse: boolean = false) => {
    return accounts.map(acc => {
       let balanceChange = 0;
       const multiplier = reverse ? -1 : 1;

       // Lógica Cartão de Crédito: 
       // Se a conta for Cartão, o "Saldo" é quanto foi gasto (geralmente negativo ou positivo dependendo da impl).
       // Aqui assumimos que saldo de cartão reflete o limite utilizado ou disponível.
       // Para simplificar: Saldo da conta cartão diminui quando gasta.

       if (transaction.status === 'COMPLETED') {
          if (transaction.type === 'TRANSFER' && transaction.toAccountId) {
             if (acc.id === transaction.accountId) balanceChange = -transaction.amount;
             if (acc.id === transaction.toAccountId) balanceChange = transaction.amount;
          } else {
             if (acc.id === transaction.accountId) {
                balanceChange = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
             }
          }
       }
       return { ...acc, balance: acc.balance + (balanceChange * multiplier) };
    });
  };

  // --- Transactions ---

  const addTransaction = (baseTransaction: Omit<Transaction, 'id'>, options?: { installments?: number, isRecurring?: boolean, repeatCount?: number }) => {
    const newTransactions: Transaction[] = [];
    const groupId = crypto.randomUUID();
    let updatedAccounts = [...data.accounts];

    if (options?.installments && options.installments > 1) {
      const installmentValue = parseFloat((baseTransaction.amount / options.installments).toFixed(2));
      for (let i = 0; i < options.installments; i++) {
        const date = new Date(baseTransaction.date);
        date.setMonth(date.getMonth() + i);
        newTransactions.push({
          ...baseTransaction,
          id: crypto.randomUUID(),
          groupId,
          date: date.toISOString().split('T')[0],
          amount: installmentValue,
          status: i === 0 ? baseTransaction.status : 'PENDING',
          installment: { current: i + 1, total: options.installments },
          description: `${baseTransaction.description} (${i + 1}/${options.installments})`
        });
      }
    } else if (options?.isRecurring) {
      const repeat = options.repeatCount || 12;
      for (let i = 0; i < repeat; i++) {
        const date = new Date(baseTransaction.date);
        date.setMonth(date.getMonth() + i);
        newTransactions.push({
          ...baseTransaction,
          id: crypto.randomUUID(),
          groupId,
          date: date.toISOString().split('T')[0],
          status: i === 0 ? baseTransaction.status : 'PENDING',
          isRecurring: true
        });
      }
    } else {
      newTransactions.push({ ...baseTransaction, id: crypto.randomUUID() });
    }

    newTransactions.forEach(t => {
       updatedAccounts = applyBalanceEffect(updatedAccounts, t, false);
    });

    setData(prev => ({
      ...prev,
      accounts: updatedAccounts,
      transactions: [...newTransactions, ...prev.transactions],
    }));
  };

  const editTransaction = (id: string, updatedTransaction: Omit<Transaction, 'id'>) => {
    setData(prev => {
      const oldTransaction = prev.transactions.find(t => t.id === id);
      if (!oldTransaction) return prev;
      let tempAccounts = applyBalanceEffect(prev.accounts, oldTransaction, true);
      const newTransactionFull: Transaction = { ...updatedTransaction, id };
      tempAccounts = applyBalanceEffect(tempAccounts, newTransactionFull, false);
      return {
        ...prev,
        accounts: tempAccounts,
        transactions: prev.transactions.map(t => t.id === id ? newTransactionFull : t)
      };
    });
  };

  const deleteTransaction = (id: string) => {
    setData(prev => {
      const transaction = prev.transactions.find(t => t.id === id);
      if (!transaction) return prev;
      const updatedAccounts = applyBalanceEffect(prev.accounts, transaction, true);
      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: prev.transactions.filter(t => t.id !== id),
      };
    });
  };

  const toggleTransactionStatus = (id: string) => {
    setData(prev => {
      const transaction = prev.transactions.find(t => t.id === id);
      if (!transaction) return prev;
      let tempAccounts = applyBalanceEffect(prev.accounts, transaction, true);
      const newStatus: TransactionStatus = transaction.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const updatedTransaction: Transaction = { ...transaction, status: newStatus };
      tempAccounts = applyBalanceEffect(tempAccounts, updatedTransaction, false);
      return {
        ...prev,
        accounts: tempAccounts,
        transactions: prev.transactions.map(t => t.id === id ? updatedTransaction : t)
      };
    });
  };

  const updateAccountBalance = (id: string, newBalance: number) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === id ? { ...a, balance: newBalance } : a)
    }));
  };

  const updateAccountDetails = (id: string, details: Partial<Account>) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === id ? { ...a, ...details } : a)
    }));
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    setData(prev => ({ ...prev, categories: [...prev.categories, { ...c, id: crypto.randomUUID(), subcategories: c.subcategories || [] }] }));
  };
  
  const updateCategory = (id: string, details: Partial<Category>) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...details } : c)
    }));
  };

  const deleteCategory = (id: string) => {
    setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  };
  const addSubcategory = (categoryId: string, sub: string) => {
    setData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === categoryId ? { ...c, subcategories: [...(c.subcategories || []), sub] } : c) }));
  };
  
  const addGoal = (g: Omit<Goal, 'id'>) => setData(prev => ({ ...prev, goals: [...prev.goals, { ...g, id: crypto.randomUUID() }] }));
  const updateGoal = (id: string, currentAmount: number) => setData(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, currentAmount } : g) }));
  const deleteGoal = (id: string) => setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));

  const addInvestment = (investment: Omit<InvestmentAsset, 'id'>) => setData(prev => ({
    ...prev,
    investments: [...(prev.investments || []), { ...investment, id: crypto.randomUUID() }]
  }));

  const updateInvestment = (id: string, details: Partial<InvestmentAsset>) => setData(prev => ({
    ...prev,
    investments: (prev.investments || []).map(i => i.id === id ? { ...i, ...details } : i)
  }));

  const deleteInvestment = (id: string) => setData(prev => ({
    ...prev,
    investments: (prev.investments || []).filter(i => i.id !== id)
  }));

  const importData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as AppData;
      if (parsed.transactions) {
        setData({ ...parsed, goals: parsed.goals || [], investments: parsed.investments || [] });
        return true;
      }
      return false;
    } catch (e) { return false; }
  };

  const importOFX = (ofxString: string, accountId: string): number => {
    try {
      const parsed = parseOFX(ofxString);
      if (parsed.length === 0) return 0;
      const newTransactions: Transaction[] = parsed.map(t => ({
        id: crypto.randomUUID(),
        description: t.description || 'OFX',
        amount: t.amount || 0,
        type: t.type as any,
        status: 'COMPLETED',
        date: t.date || new Date().toISOString().split('T')[0],
        accountId: accountId,
      }));
      let updatedAccounts = [...data.accounts];
      newTransactions.forEach(t => updatedAccounts = applyBalanceEffect(updatedAccounts, t, false));
      setData(prev => ({ ...prev, accounts: updatedAccounts, transactions: [...newTransactions, ...prev.transactions] }));
      return newTransactions.length;
    } catch (e) { return 0; }
  };

  const importCSV = (csvString: string, accountId: string, separator: string): number => {
    try {
      const sep = separator || ';';
      const lines = csvString.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return 0;
      const header = lines[0].split(sep).map(v => v.trim().toLowerCase());

      const getIdx = (...names: string[]) => names.map(n => header.indexOf(n)).find(i => i !== -1) ?? -1;
      const idxDate = getIdx('data', 'date');
      const idxDesc = getIdx('descricao', 'descrição', 'historico', 'histórico', 'description');
      const idxAmount = getIdx('valor', 'amount');
      const idxType = getIdx('tipo', 'type');

      const rows = lines.slice(1);
      const newTransactions: Transaction[] = [];

      rows.forEach(row => {
        const cols = row.split(sep).map(v => v.trim());
        const dateRaw = idxDate >= 0 ? cols[idxDate] : '';
        const desc = idxDesc >= 0 ? cols[idxDesc] : 'CSV';
        const amountRaw = (idxAmount >= 0 ? cols[idxAmount] : '0').replace(/\./g, '').replace(',', '.');
        const amount = Math.abs(parseFloat(amountRaw));
        if (!amount || Number.isNaN(amount)) return;

        const isoDate = dateRaw.includes('/')
          ? dateRaw.split('/').reverse().join('-')
          : (dateRaw || new Date().toISOString().split('T')[0]);

        const typeRaw = idxType >= 0 ? (cols[idxType] || '').toLowerCase() : '';
        const type = typeRaw.includes('receita') || typeRaw.includes('credito') || typeRaw.includes('income')
          ? 'INCOME'
          : 'EXPENSE';

        newTransactions.push({
          id: crypto.randomUUID(),
          description: desc || 'CSV',
          amount,
          type: type as any,
          status: 'COMPLETED',
          date: isoDate,
          accountId,
        });
      });

      if (!newTransactions.length) return 0;
      let updatedAccounts = [...data.accounts];
      newTransactions.forEach(t => updatedAccounts = applyBalanceEffect(updatedAccounts, t, false));
      setData(prev => ({ ...prev, accounts: updatedAccounts, transactions: [...newTransactions, ...prev.transactions] }));
      return newTransactions.length;
    } catch (e) {
      return 0;
    }
  };

  const exportData = () => JSON.stringify(data, null, 2);

  const getCategoryStats = (categoryId: string): CategoryStats => {
    const ts = data.transactions.filter(t => t.categoryId === categoryId);
    if (ts.length === 0) return { average: 0, count: 0, max: 0 };
    const total = ts.reduce((sum, t) => sum + t.amount, 0);
    const max = Math.max(...ts.map(t => t.amount));
    return { average: total / ts.length, count: ts.length, max };
  };

  // --- Lembretes de Contas (Próximos 7 dias) ---
  const getUpcomingBills = (): Transaction[] => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const limit = new Date(today);
    limit.setDate(today.getDate() + 7);

    return data.transactions.filter(t => {
      if (t.type !== 'EXPENSE' || t.status === 'COMPLETED') return false;
      const tDate = new Date(t.date + 'T00:00:00');
      return tDate >= today && tDate <= limit;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <FinanceContext.Provider value={{ 
      data, currentDate, changeMonth, 
      searchQuery, setSearchQuery,
      addTransaction, editTransaction, deleteTransaction, toggleTransactionStatus, 
      updateAccountBalance, updateAccountDetails,
      addCategory, updateCategory, deleteCategory, addSubcategory,
      addGoal, updateGoal, deleteGoal,
      addInvestment, updateInvestment, deleteInvestment,
      importData, importOFX, importCSV, exportData, getCategoryStats, getUpcomingBills,
      filteredTransactions, advancedFilters, setAdvancedFilters
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
