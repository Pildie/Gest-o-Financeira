
import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ChevronLeft, ChevronRight, ArrowRightLeft, Calendar } from 'lucide-react';
import { Transaction } from '../types';

interface Props {
  onEdit: (t: Transaction) => void;
}

const Transactions: React.FC<Props> = ({ onEdit }) => {
  const { filteredTransactions, data, advancedFilters, setAdvancedFilters, toggleTransactionStatus, deleteTransaction, currentDate, changeMonth } = useFinance();
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedData = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Extrato</h1>
            <p className="text-gray-500 text-sm">Gerencie todos os seus lançamentos.</p>
         </div>
         
         <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-2">
              <button onClick={() => changeMonth(-1)} className="p-1 rounded hover:bg-gray-100" title="Mês anterior"><ChevronLeft size={16} /></button>
              <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center flex items-center justify-center gap-1"><Calendar size={14} /> {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => changeMonth(1)} className="p-1 rounded hover:bg-gray-100" title="Próximo mês"><ChevronRight size={16} /></button>
            </div>
            <select 
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100"
              value={advancedFilters.type || ''}
              onChange={e => setAdvancedFilters({...advancedFilters, type: e.target.value as any || undefined})}
            >
               <option value="">Todos os Tipos</option>
               <option value="INCOME">Receitas</option>
               <option value="EXPENSE">Despesas</option>
               <option value="TRANSFER">Transferências</option>
            </select>
            <select 
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100"
              value={advancedFilters.status || ''}
              onChange={e => setAdvancedFilters({...advancedFilters, status: e.target.value as any || undefined})}
            >
               <option value="">Todos os Status</option>
               <option value="COMPLETED">Pagos / Recebidos</option>
               <option value="PENDING">Pendentes</option>
            </select>
         </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                     <th className="p-4 font-bold">Data</th>
                     <th className="p-4 font-bold">Descrição</th>
                     <th className="p-4 font-bold">Categoria</th>
                     <th className="p-4 font-bold">Conta</th>
                     <th className="p-4 font-bold text-right">Valor</th>
                     <th className="p-4 font-bold text-center">Status</th>
                     <th className="p-4 font-bold text-center">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {paginatedData.map(t => {
                     const category = data.categories.find(c => c.id === t.categoryId);
                     const account = data.accounts.find(a => a.id === t.accountId);
                     
                     return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                           <td className="p-4 text-sm text-gray-500 font-medium whitespace-nowrap">
                              {t.date.split('-').reverse().join('/')}
                           </td>
                           <td className="p-4">
                              <div className="font-bold text-gray-900">{t.description}</div>
                              {t.installment && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded ml-1 font-bold">x{t.installment.current}</span>}
                           </td>
                           <td className="p-4">
                              {t.type === 'TRANSFER' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                                   <ArrowRightLeft size={12} /> Transf.
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold" style={{backgroundColor: category ? `${category.color}15` : '#f3f4f6', color: category?.color}}>
                                   {category?.name || 'Sem Categoria'}
                                </span>
                              )}
                           </td>
                           <td className="p-4 text-sm text-gray-500">{account?.name}</td>
                           <td className={`p-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                              {t.type === 'EXPENSE' && '- '}{formatCurrency(t.amount)}
                           </td>
                           <td className="p-4 text-center">
                              <button 
                                onClick={() => toggleTransactionStatus(t.id)}
                                className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                              >
                                {t.status === 'COMPLETED' ? 'Pago' : 'Pendente'}
                              </button>
                           </td>
                           <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => onEdit(t)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg text-xs font-bold">Editar</button>
                                 <button onClick={() => { if(confirm('Excluir?')) deleteTransaction(t.id); }} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-bold">Excluir</button>
                              </div>
                           </td>
                        </tr>
                     )
                  })}
               </tbody>
            </table>
         </div>
         
         {/* Pagination */}
         <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
               <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
               <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={16} /></button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Transactions;
