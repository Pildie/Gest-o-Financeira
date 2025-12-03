
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Save, AlertTriangle } from 'lucide-react';

const Budgets: React.FC = () => {
  const { data, updateCategory, filteredTransactions } = useFinance();
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState('');

  // Filtra apenas categorias de despesa
  const expenseCategories = data.categories.filter(c => c.type === 'EXPENSE');

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
         <h1 className="text-2xl font-bold text-gray-900">Orçamentos Mensais</h1>
         <p className="text-gray-500 text-sm">Defina limites para não estourar o orçamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {expenseCategories.map(cat => {
            const limit = cat.budgetLimit || 0;
            // Calcula gasto no mês atual (baseado nos filtros atuais do context)
            const spent = filteredTransactions
              .filter(t => t.categoryId === cat.id && t.type === 'EXPENSE')
              .reduce((sum, t) => sum + t.amount, 0);
            
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            
            // Cores do progresso
            let progressColor = 'bg-emerald-500';
            if (percent > 50) progressColor = 'bg-yellow-400';
            if (percent > 80) progressColor = 'bg-orange-500';
            if (percent >= 100) progressColor = 'bg-rose-600';

            return (
               <div key={cat.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{backgroundColor: cat.color}}>
                           {cat.name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-gray-800">{cat.name}</h3>
                     </div>
                     {percent >= 100 && (
                        <div className="bg-rose-100 text-rose-600 p-1.5 rounded-lg animate-pulse" title="Orçamento Estourado">
                           <AlertTriangle size={18} />
                        </div>
                     )}
                  </div>

                  {editingCatId === cat.id ? (
                     <div className="flex gap-2 mb-2 animate-fade-in">
                        <input 
                          type="number" 
                          autoFocus
                          placeholder="Novo Limite"
                          className="w-full p-2 border rounded-lg bg-gray-50"
                          value={tempLimit}
                          onChange={e => setTempLimit(e.target.value)}
                        />
                        <button 
                          onClick={() => {
                             updateCategory(cat.id, { budgetLimit: parseFloat(tempLimit) });
                             setEditingCatId(null);
                          }}
                          className="bg-blue-600 text-white p-2 rounded-lg"
                        >
                           <Save size={18} />
                        </button>
                     </div>
                  ) : (
                     <div className="flex items-end justify-between mb-2">
                        <div>
                           <span className="text-2xl font-bold text-gray-900">{formatCurrency(spent)}</span>
                           <span className="text-sm text-gray-400 font-medium"> de {limit > 0 ? formatCurrency(limit) : 'R$ --'}</span>
                        </div>
                        <button onClick={() => { setTempLimit(limit.toString()); setEditingCatId(cat.id); }} className="text-xs text-blue-600 font-bold hover:underline">
                           Definir Limite
                        </button>
                     </div>
                  )}

                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} 
                        style={{ width: `${Math.min(percent, 100)}%` }}
                     ></div>
                  </div>
                  
                  {limit > 0 && (
                     <p className="text-xs text-gray-400 mt-2 text-right">{Math.round(percent)}% utilizado</p>
                  )}
               </div>
            );
         })}
      </div>
    </div>
  );
};

export default Budgets;
