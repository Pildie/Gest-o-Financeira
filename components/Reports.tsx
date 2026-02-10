import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#6366f1'];

const Reports: React.FC = () => {
  const { data } = useFinance();

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

  const getLast6MonthsData = () => {
    const result = [] as any[];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthNames[d.getMonth()];

      const income = data.transactions.filter(t => t.date.startsWith(monthKey) && t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      const expense = data.transactions.filter(t => t.date.startsWith(monthKey) && t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
      result.push({ name: monthLabel, Receitas: income, Despesas: expense, Saldo: income - expense });
    }
    return result;
  };

  const monthlyData = getLast6MonthsData();
  const totalIncome = monthlyData.reduce((s, m) => s + m.Receitas, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.Despesas, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const commitments = data.transactions.filter(t => t.status === 'PENDING' && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const healthScore = Math.max(0, Math.min(100, Math.round((savingsRate * 1.2) + (commitments === 0 ? 25 : Math.max(0, 25 - commitments / 500)))));

  const opportunities = [
    savingsRate < 10 ? 'Taxa de poupança abaixo de 10%: tente reduzir despesas discricionárias.' : 'Taxa de poupança saudável.',
    commitments > totalIncome * 0.5 ? 'Compromissos pendentes elevados: priorize renegociação/antecipação.' : 'Compromissos em nível controlado.',
    expensesByCategory[0] ? `Maior centro de custo: ${expensesByCategory[0].name}. Há oportunidade de otimização.` : 'Sem despesas relevantes registradas.'
  ];

  const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs uppercase font-bold text-gray-400">Score de Saúde Financeira</p>
          <p className={`text-3xl font-bold mt-1 ${healthScore >= 70 ? 'text-emerald-600' : healthScore >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>{healthScore}/100</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs uppercase font-bold text-gray-400">Taxa de Poupança (6m)</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">{savingsRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs uppercase font-bold text-gray-400">Compromissos Pendentes</p>
          <p className="text-3xl font-bold mt-1 text-rose-600">{formatBRL(commitments)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Oportunidades sugeridas</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          {opportunities.map((item, i) => (
            <li key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-2">• {item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
          {expensesByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {expensesByCategory.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatBRL(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Sem dados de despesas disponíveis.</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fluxo de Caixa (6 Meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip formatter={(value: number) => formatBRL(value)} cursor={{ fill: '#f9fafb' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução de Saldo (6 Meses)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(value: number) => formatBRL(value)} />
              <Line type="monotone" dataKey="Saldo" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
