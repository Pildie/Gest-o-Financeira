
import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#6366f1'];

const Reports: React.FC = () => {
  const { data } = useFinance();

  // 1. Expense by Category Data
  const expensesByCategory = data.categories
    .filter(c => c.type === 'EXPENSE')
    .map(cat => {
      const total = data.transactions
        .filter(t => t.categoryId === cat.id && t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, value: total };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // 2. Monthly Flow Data (Last 6 months)
  const getLast6MonthsData = () => {
    const result = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const monthLabel = monthNames[d.getMonth()];

      const income = data.transactions
        .filter(t => t.date.startsWith(monthKey) && t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = data.transactions
        .filter(t => t.date.startsWith(monthKey) && t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({ name: monthLabel, Receitas: income, Despesas: expense });
    }
    return result;
  };

  const monthlyData = getLast6MonthsData();

  const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
       <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
             {expensesByCategory.length > 0 ? (
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={expensesByCategory}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {expensesByCategory.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip formatter={(value: number) => formatBRL(value)} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {expensesByCategory.map((entry, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        {entry.name}
                      </div>
                    ))}
                 </div>
               </div>
             ) : (
               <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                 Sem dados de despesas disponíveis.
               </div>
             )}
          </div>

          {/* Monthly Bar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Fluxo de Caixa (6 Meses)</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                    <Tooltip formatter={(value: number) => formatBRL(value)} cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '10px'}} />
                    <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Reports;
