
import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, PiggyBank, Bell, ChevronRight, Calendar, CheckCircle } from 'lucide-react';
import { Transaction } from '../types';

interface Props {
  onEdit: (t: Transaction) => void;
  onViewAll: () => void;
}

const Dashboard: React.FC<Props> = ({ onEdit, onViewAll }) => {
  const { data, filteredTransactions, getUpcomingBills } = useFinance();

  // Cálculos Básicos
  const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const savingsBalance = data.accounts.filter(a => a.type === 'SAVINGS' || a.type === 'INVESTMENT').reduce((sum, a) => sum + a.balance, 0);
  const investedInAssets = (data.investments || []).reduce((sum, asset) => sum + asset.principal, 0);
  const investedDisplay = investedInAssets > 0 ? investedInAssets : savingsBalance;

  const incomeTotal = filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const monthlyResult = incomeTotal - expenseTotal;

  const upcomingBills = getUpcomingBills();

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div>
         <h1 className="text-3xl font-bold text-gray-900">Olá!</h1>
         <p className="text-gray-500">Aqui está o resumo financeiro deste mês.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Card Principal - Patrimônio */}
        <div className="lg:col-span-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2 opacity-80">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                      <Wallet size={20} />
                    </div>
                    <span className="text-sm font-medium tracking-wide">Patrimônio Total</span>
                </div>
                <p className="text-5xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-8">
                  <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <PiggyBank size={18} className="text-emerald-400" />
                      <span>Investido: <strong className="text-emerald-400">{formatCurrency(investedDisplay)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <TrendingUp size={18} className={monthlyResult >= 0 ? "text-blue-400" : "text-rose-400"} />
                      <span>Balanço Mês: <strong className={monthlyResult >= 0 ? "text-blue-400" : "text-rose-400"}>{formatCurrency(monthlyResult)}</strong></span>
                  </div>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
        </div>

        {/* Resumo Rápido */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           <div className="flex-1 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                 <p className="text-sm font-bold text-gray-400 uppercase mb-1">Entradas</p>
                 <p className="text-2xl font-bold text-gray-900">{formatCurrency(incomeTotal)}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                 <ArrowUpCircle size={28} />
              </div>
           </div>
           <div className="flex-1 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                 <p className="text-sm font-bold text-gray-400 uppercase mb-1">Saídas</p>
                 <p className="text-2xl font-bold text-gray-900">{formatCurrency(expenseTotal)}</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                 <ArrowDownCircle size={28} />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget de Lembretes */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex flex-col h-96">
           <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                 <Bell size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Contas a Pagar</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
             {upcomingBills.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                 <CheckCircle size={32} className="mb-2 text-emerald-200" />
                 <p className="text-sm">Tudo em dia!</p>
                 <p className="text-xs">Nenhuma conta para os próximos 7 dias.</p>
               </div>
             ) : (
               upcomingBills.map(t => (
                 <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="bg-white p-2 rounded-xl text-rose-500 font-bold text-xs shadow-sm border border-gray-100">
                          {new Date(t.date).getDate()}
                       </div>
                       <div>
                          <p className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{t.description}</p>
                          <p className="text-xs text-rose-600 font-medium">Vence em breve</p>
                       </div>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{formatCurrency(t.amount)}</span>
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Resumo de Atividades Recentes (Link para Extrato) */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex flex-col h-96">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar size={20} />
                 </div>
                 <h3 className="font-bold text-gray-900">Últimos Lançamentos</h3>
              </div>
              <button onClick={onViewAll} className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
                Ver Extrato <ChevronRight size={16} />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {filteredTransactions.slice(0, 5).map(t => (
                <div key={t.id} onClick={() => onEdit(t)} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors group border border-transparent hover:border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${t.type === 'INCOME' ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                         {t.description.charAt(0)}
                      </div>
                      <div>
                         <p className="font-bold text-gray-800 text-sm">{t.description}</p>
                         <p className="text-xs text-gray-400">{t.date.split('-').reverse().join('/')}</p>
                      </div>
                   </div>
                   <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {t.type === 'EXPENSE' && '- '}{formatCurrency(t.amount)}
                   </span>
                </div>
              ))}
              {filteredTransactions.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Nenhuma transação neste mês.</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
