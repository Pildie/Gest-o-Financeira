
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, TransactionStatus, Transaction } from '../types';
import { X, AlertTriangle, CheckCircle2, Circle, ArrowRightLeft, CreditCard, Repeat, DollarSign } from 'lucide-react';

interface Props {
  onClose: () => void;
  initialType?: TransactionType;
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<Props> = ({ onClose, initialType = 'EXPENSE', initialData }) => {
  const { data, addTransaction, editTransaction, getCategoryStats } = useFinance();
  const [type, setType] = useState<TransactionType>(initialData?.type || initialType);
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'COMPLETED');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [accountId, setAccountId] = useState(initialData?.accountId || data.accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(initialData?.toAccountId || data.accounts[1]?.id || '');
  
  // Se for edição, desabilita modos complexos (parcelamento/recorrência em lote) para simplificar
  // A edição é focada em corrigir 1 lançamento.
  const isEditing = !!initialData;
  const [mode, setMode] = useState<'SINGLE' | 'INSTALLMENT' | 'RECURRING'>('SINGLE');
  const [installments, setInstallments] = useState(2);
  const [repeatCount, setRepeatCount] = useState(12);

  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);

  useEffect(() => {
    // Alerta de anomalia apenas para despesas únicas
    if (type === 'EXPENSE' && amount && categoryId && mode === 'SINGLE') {
      const numAmount = parseFloat(amount);
      const stats = getCategoryStats(categoryId);

      if (stats.count >= 2 && numAmount > stats.average * 1.3) {
        const percentAbove = Math.round(((numAmount - stats.average) / stats.average) * 100);
        setAnomalyWarning(`Valor ${percentAbove}% acima da média (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.average)}).`);
      } else {
        setAnomalyWarning(null);
      }
    } else {
      setAnomalyWarning(null);
    }
  }, [amount, categoryId, type, getCategoryStats, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId) return;
    if (type !== 'TRANSFER' && !categoryId && !isEditing) return; // Permitir sem categoria na edição caso tenha vindo de importação

    const transactionData = {
      type,
      status,
      amount: parseFloat(amount),
      description,
      date,
      categoryId: type === 'TRANSFER' ? undefined : categoryId,
      subCategory: type === 'TRANSFER' ? undefined : subCategory,
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
    };

    if (isEditing && initialData) {
      editTransaction(initialData.id, transactionData);
    } else {
      addTransaction(transactionData, {
        installments: mode === 'INSTALLMENT' ? installments : 1,
        isRecurring: mode === 'RECURRING',
        repeatCount: mode === 'RECURRING' ? repeatCount : 1
      });
    }
    onClose();
  };

  const getTheme = () => {
    if (type === 'EXPENSE') return { color: 'rose', bg: 'bg-rose-600', text: 'text-rose-600', hover: 'hover:bg-rose-700', ring: 'focus:ring-rose-500' };
    if (type === 'INCOME') return { color: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', hover: 'hover:bg-emerald-700', ring: 'focus:ring-emerald-500' };
    return { color: 'blue', bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-500' };
  };

  const theme = getTheme();
  const selectedCategory = data.categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[95vh]">
        
        {/* Header Compacto */}
        <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setType('EXPENSE')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Despesa</button>
             <button onClick={() => setType('INCOME')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Receita</button>
             <button onClick={() => setType('TRANSFER')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'TRANSFER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Transf.</button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
          
          <h2 className="text-center text-sm font-bold text-gray-400">{isEditing ? 'Editar Transação' : 'Novo Lançamento'}</h2>

          {/* Valor Principal */}
          <div className="text-center">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Valor Total</label>
            <div className="relative inline-block">
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold ${theme.text}`}>R$</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border-b-2 border-transparent focus:border-${theme.color}-500 outline-none text-5xl font-bold text-gray-800 bg-transparent text-center placeholder-gray-200`}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Seletor de Modo (Desabilitado na edição) */}
          {!isEditing && type !== 'TRANSFER' && (
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setMode('SINGLE')} className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${mode === 'SINGLE' ? `border-${theme.color}-500 bg-${theme.color}-50 ${theme.text}` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <DollarSign size={16} /> Única
              </button>
              <button type="button" onClick={() => setMode('INSTALLMENT')} className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${mode === 'INSTALLMENT' ? `border-${theme.color}-500 bg-${theme.color}-50 ${theme.text}` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <CreditCard size={16} /> Parcelada
              </button>
              <button type="button" onClick={() => setMode('RECURRING')} className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${mode === 'RECURRING' ? `border-${theme.color}-500 bg-${theme.color}-50 ${theme.text}` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Repeat size={16} /> Fixa/Mensal
              </button>
            </div>
          )}

          {/* Configuração dos Modos Extras */}
          {mode === 'INSTALLMENT' && type !== 'TRANSFER' && !isEditing && (
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
                <label className="block text-xs font-bold text-gray-500 mb-2">Número de Parcelas</label>
                <div className="flex items-center gap-4">
                   <input type="range" min="2" max="36" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))} className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-${theme.color}-600`} />
                   <span className="font-bold text-gray-800 w-12 text-center">{installments}x</span>
                </div>
             </div>
          )}

          {mode === 'RECURRING' && type !== 'TRANSFER' && !isEditing && (
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
                <label className="block text-xs font-bold text-gray-500 mb-2">Repetir por quantos meses?</label>
                <div className="flex items-center gap-2">
                   <input type="number" min="2" max="120" value={repeatCount} onChange={(e) => setRepeatCount(parseInt(e.target.value))} className="w-20 p-2 text-center border rounded-lg font-bold text-gray-800" />
                   <span className="text-sm text-gray-600">meses</span>
                </div>
             </div>
          )}

          {/* Descrição e Status */}
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-${theme.color}-100 focus:border-${theme.color}-400 outline-none text-gray-700 font-medium transition-all`}
                  placeholder="Ex: Supermercado, Salário..."
                />
             </div>

             <div 
               className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${status === 'COMPLETED' ? `bg-${theme.color}-50 border-${theme.color}-200` : 'bg-gray-50 border-gray-200'}`} 
               onClick={() => setStatus(s => s === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
             >
                <div className="flex items-center gap-3">
                   {status === 'COMPLETED' 
                     ? <CheckCircle2 className={`${theme.text}`} size={24} />
                     : <Circle className="text-gray-400" size={24} />
                   }
                   <div>
                     <span className={`block text-sm font-bold ${status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-500'}`}>
                       {status === 'COMPLETED' ? 'Já foi pago/recebido' : 'Pendente / Agendar'}
                     </span>
                     <span className="text-xs text-gray-400">{status === 'COMPLETED' ? 'O saldo será atualizado agora.' : 'Não afeta o saldo atual.'}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Data e Contas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none text-sm font-medium text-gray-700"
              />
             </div>

             {type === 'TRANSFER' ? (
               <div className="col-span-1 md:col-span-2 space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                 <div>
                   <label className="block text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Sai de</label>
                   <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-gray-700">
                     {data.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                   </select>
                 </div>
                 <div className="flex justify-center text-blue-300"><ArrowRightLeft size={16}/></div>
                 <div>
                   <label className="block text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Entra em</label>
                   <select required value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-gray-700">
                     {data.accounts.filter(a => a.id !== accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                   </select>
                 </div>
               </div>
             ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Conta</label>
                  <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-gray-200 outline-none">
                    {data.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
             )}
          </div>

          {/* Categorias */}
          {type !== 'TRANSFER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Categoria</label>
                  <select 
                    value={categoryId} 
                    onChange={(e) => { setCategoryId(e.target.value); setSubCategory(''); }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-gray-200 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {data.categories.filter(c => c.type === type).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Subcategoria</label>
                   <select 
                    value={subCategory} 
                    onChange={(e) => setSubCategory(e.target.value)}
                    disabled={!selectedCategory || selectedCategory.subcategories.length === 0}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-gray-200 outline-none disabled:opacity-50"
                  >
                    <option value="">{selectedCategory?.subcategories.length ? 'Opcional' : 'Sem subcategorias'}</option>
                    {selectedCategory?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {anomalyWarning && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 animate-fade-in items-start">
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
            className={`w-full py-4 rounded-xl text-white font-bold shadow-lg shadow-${theme.color}-200 transition-all transform active:scale-[0.98] ${theme.bg} ${theme.hover} flex items-center justify-center gap-2`}
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
