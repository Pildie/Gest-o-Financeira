import React, { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, TransactionStatus, Transaction } from '../types';
import { X, AlertTriangle, CheckCircle2, Circle, ArrowRightLeft, Repeat, DollarSign, Wand2, Zap } from 'lucide-react';
import { inferCategoryFromDescription } from '../services/rulesEngine';

interface Props {
  onClose: () => void;
  initialType?: TransactionType;
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<Props> = ({ onClose, initialType = 'EXPENSE', initialData }) => {
  const { data, addTransaction, editTransaction, getCategoryStats, addSubcategory } = useFinance();

  const [type, setType] = useState<TransactionType>(initialData?.type || initialType);
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'COMPLETED');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [accountId, setAccountId] = useState(initialData?.accountId || data.accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(initialData?.toAccountId || data.accounts[1]?.id || '');

  const isEditing = !!initialData;
  const [mode, setMode] = useState<'SINGLE' | 'INSTALLMENT' | 'RECURRING'>('SINGLE');
  const [installments, setInstallments] = useState(2);
  const [repeatCount, setRepeatCount] = useState(12);
  const [quickMode, setQuickMode] = useState(!isEditing);

  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);
  const [autoCategoryHint, setAutoCategoryHint] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => data.categories.find((c) => c.id === categoryId),
    [data.categories, categoryId]
  );
  const selectedAccount = useMemo(() => data.accounts.find((a) => a.id === accountId), [data.accounts, accountId]);
  const [investmentClass, setInvestmentClass] = useState<'CDB' | 'CDI' | 'FUNDO'>('CDB');
  const [investmentOperation, setInvestmentOperation] = useState<'APORTE' | 'RESGATE'>('APORTE');

  useEffect(() => {
    if (type === 'EXPENSE' && amount && categoryId && mode === 'SINGLE') {
      const numAmount = parseFloat(amount);
      const stats = getCategoryStats(categoryId);

      if (stats.count >= 2 && numAmount > stats.average * 1.3) {
        const percentAbove = Math.round(((numAmount - stats.average) / stats.average) * 100);
        setAnomalyWarning(
          `Valor ${percentAbove}% acima da média (${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(stats.average)}).`
        );
      } else {
        setAnomalyWarning(null);
      }
    } else {
      setAnomalyWarning(null);
    }
  }, [amount, categoryId, type, getCategoryStats, mode]);

  useEffect(() => {
    if (isEditing || type === 'TRANSFER' || !description.trim()) {
      setAutoCategoryHint(null);
      return;
    }

    const inference = inferCategoryFromDescription(description, data.categories, type);
    if (inference.categoryId && !categoryId) {
      setCategoryId(inference.categoryId);
      if (inference.subCategory) setSubCategory(inference.subCategory);

      const inferredName = data.categories.find((c) => c.id === inference.categoryId)?.name;
      if (inferredName) {
        setAutoCategoryHint(`Categoria sugerida automaticamente: ${inferredName}`);
      }
    }
  }, [description, type, data.categories, isEditing, categoryId]);

  useEffect(() => {
    if (selectedAccount?.type === 'INVESTMENT' || selectedAccount?.type === 'SAVINGS') {
      setInvestmentOperation(type === 'INCOME' ? 'APORTE' : 'RESGATE');
    }
  }, [type, selectedAccount]);

  useEffect(() => {
    if (type === 'TRANSFER') {
      setQuickMode(false);
      if (!toAccountId && data.accounts.length > 1) {
        const fallback = data.accounts.find((acc) => acc.id !== accountId)?.id || '';
        setToAccountId(fallback);
      }
    }
  }, [type, toAccountId, data.accounts, accountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId) return;
    if (type !== 'TRANSFER' && !categoryId && !isEditing && !quickMode) return;

    const investmentTags = (selectedAccount?.type === 'INVESTMENT' || selectedAccount?.type === 'SAVINGS') && type !== 'TRANSFER'
      ? ['INVESTIMENTO', investmentClass, investmentOperation]
      : [];

    const transactionData = {
      type,
      status,
      amount: parseFloat(amount),
      description,
      date,
      categoryId: type === 'TRANSFER' ? undefined : (categoryId || undefined),
      subCategory: type === 'TRANSFER' ? undefined : (subCategory || undefined),
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
      tags: investmentTags.length ? investmentTags : undefined,
    };

    if (isEditing && initialData) {
      editTransaction(initialData.id, transactionData);
    } else {
      addTransaction(transactionData, {
        installments: mode === 'INSTALLMENT' ? installments : 1,
        isRecurring: mode === 'RECURRING',
        repeatCount: mode === 'RECURRING' ? repeatCount : 1,
      });
    }
    onClose();
  };

  const handleAddSubcategory = () => {
    if (!selectedCategory) return;
    const normalized = newSubCategory.trim();
    if (!normalized) return;
    if (selectedCategory.subcategories.includes(normalized)) {
      setSubCategory(normalized);
      setNewSubCategory('');
      return;
    }
    addSubcategory(selectedCategory.id, normalized);
    setSubCategory(normalized);
    setNewSubCategory('');
  };

  const getTheme = () => {
    if (type === 'EXPENSE') return { bg: 'bg-rose-600', text: 'text-rose-600', hover: 'hover:bg-rose-700' };
    if (type === 'INCOME') return { bg: 'bg-emerald-600', text: 'text-emerald-600', hover: 'hover:bg-emerald-700' };
    return { bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:bg-blue-700' };
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setType('EXPENSE')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}>Despesa</button>
            <button onClick={() => setType('INCOME')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Receita</button>
            <button onClick={() => setType('TRANSFER')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${type === 'TRANSFER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Transf.</button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400">{isEditing ? 'Editar Transação' : 'Novo Lançamento'}</h2>
            {!isEditing && type !== 'TRANSFER' && (
              <button
                type="button"
                onClick={() => setQuickMode((prev) => !prev)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 ${quickMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
              >
                <Zap size={14} /> {quickMode ? 'Rápido' : 'Completo'}
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Valor</label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none"
              placeholder="Ex: Supermercado, Salário..."
            />
            {autoCategoryHint && (
              <p className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                <Wand2 size={12} /> {autoCategoryHint}
              </p>
            )}
          </div>

          {(!quickMode || type === 'TRANSFER') && (
            <>
              <div className="space-y-3">
                {!isEditing && type !== 'TRANSFER' && (
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setMode('SINGLE')} className={`p-2 rounded-xl text-xs font-bold border ${mode === 'SINGLE' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}>Única</button>
                    <button type="button" onClick={() => setMode('INSTALLMENT')} className={`p-2 rounded-xl text-xs font-bold border ${mode === 'INSTALLMENT' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}>Parcelada</button>
                    <button type="button" onClick={() => setMode('RECURRING')} className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 ${mode === 'RECURRING' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
                      <Repeat size={14} /> Recorrente
                    </button>
                  </div>
                )}

                {mode === 'INSTALLMENT' && !isEditing && type !== 'TRANSFER' && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 mb-2">Número de Parcelas</label>
                    <input type="number" min="2" max="36" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value || '2', 10))} className="w-24 p-2 border rounded-lg" />
                  </div>
                )}

                {mode === 'RECURRING' && !isEditing && type !== 'TRANSFER' && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 mb-2">Repetir por quantos meses?</label>
                    <input type="number" min="2" max="120" value={repeatCount} onChange={(e) => setRepeatCount(parseInt(e.target.value || '12', 10))} className="w-24 p-2 border rounded-lg" />
                  </div>
                )}

                <div
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border ${status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}
                  onClick={() => setStatus((s) => (s === 'COMPLETED' ? 'PENDING' : 'COMPLETED'))}
                >
                  <div className="flex items-center gap-3">
                    {status === 'COMPLETED' ? <CheckCircle2 className="text-emerald-600" size={24} /> : <Circle className="text-gray-400" size={24} />}
                    <div>
                      <span className="block text-sm font-bold text-gray-900">{status === 'COMPLETED' ? 'Já foi pago/recebido' : 'Pendente / Agendar'}</span>
                      <span className="text-xs text-gray-400">{status === 'COMPLETED' ? 'O saldo será atualizado agora.' : 'Não afeta o saldo atual.'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Data</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" />
                </div>

                {type === 'TRANSFER' ? (
                  <div className="col-span-1 md:col-span-2 space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                      <label className="block text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Sai de</label>
                      <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm">
                        {data.accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-center text-blue-300"><ArrowRightLeft size={16} /></div>
                    <div>
                      <label className="block text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Entra em</label>
                      <select required value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm">
                        {data.accounts.filter((a) => a.id !== accountId).map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Conta</label>
                    <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm">
                      {data.accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {(selectedAccount?.type === 'INVESTMENT' || selectedAccount?.type === 'SAVINGS') && type !== 'TRANSFER' && (
                <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-cyan-700 uppercase">Lançamento de Investimento</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={investmentClass} onChange={(e) => setInvestmentClass(e.target.value as any)} className="px-3 py-2 bg-white border border-cyan-200 rounded-lg text-sm">
                      <option value="CDB">CDB</option>
                      <option value="CDI">CDI</option>
                      <option value="FUNDO">Fundo de Investimento</option>
                    </select>
                    <select value={investmentOperation} onChange={(e) => setInvestmentOperation(e.target.value as any)} className="px-3 py-2 bg-white border border-cyan-200 rounded-lg text-sm">
                      <option value="APORTE">Aporte</option>
                      <option value="RESGATE">Resgate</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-cyan-700">Use INCOME para aporte e EXPENSE para resgate/saída. O sistema adiciona tags de investimento automaticamente.</p>
                </div>
              )}

              {type !== 'TRANSFER' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Categoria</label>
                      <select
                        value={categoryId}
                        onChange={(e) => {
                          setCategoryId(e.target.value);
                          setSubCategory('');
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
                      >
                        <option value="">Selecione...</option>
                        {data.categories.filter((c) => c.type === type).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Subcategoria</label>
                      <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm disabled:opacity-50"
                      >
                        <option value="">{selectedCategory?.subcategories.length ? 'Opcional' : 'Sem subcategorias'}</option>
                        {selectedCategory?.subcategories.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                      {selectedCategory && (
                        <div className="flex gap-2 mt-2">
                          <input
                            value={newSubCategory}
                            onChange={(e) => setNewSubCategory(e.target.value)}
                            placeholder="Nova subcategoria"
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddSubcategory}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                          >
                            Adicionar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {anomalyWarning && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-amber-800">Valor incomum detectado</p>
                <p className="text-xs text-amber-700 mt-1">{anomalyWarning}</p>
              </div>
            </div>
          )}
        </form>

        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={handleSubmit}
            className={`w-full py-4 rounded-xl text-white font-bold transition-all transform active:scale-[0.98] ${theme.bg} ${theme.hover} flex items-center justify-center gap-2`}
          >
            <CheckCircle2 size={20} />
            {isEditing ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
