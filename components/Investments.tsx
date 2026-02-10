import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { WalletCards, TrendingUp, PiggyBank, Landmark, BadgeDollarSign } from 'lucide-react';

const Investments: React.FC = () => {
  const { data } = useFinance();

  const investmentAccounts = data.accounts.filter(a => a.type === 'INVESTMENT' || a.type === 'SAVINGS');
  const investmentIds = new Set(investmentAccounts.map(a => a.id));

  const investmentTx = data.transactions.filter(t => investmentIds.has(t.accountId) && t.type !== 'TRANSFER');

  const applied = investmentTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const redeemed = investmentTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const net = applied - redeemed;

  const classify = (text: string) => {
    const v = (text || '').toLowerCase();
    if (v.includes('cdb')) return 'CDB';
    if (v.includes('cdi')) return 'CDI';
    if (v.includes('fundo')) return 'FUNDOS';
    return 'OUTROS';
  };

  const allocation = investmentTx.reduce<Record<string, number>>((acc, t) => {
    const source = `${t.description} ${(t.tags || []).join(' ')} ${t.subCategory || ''}`;
    const key = classify(source);
    const signed = t.type === 'INCOME' ? t.amount : -t.amount;
    acc[key] = (acc[key] || 0) + signed;
    return acc;
  }, {});

  const rows = Object.entries(allocation).sort((a, b) => b[1] - a[1]);
  const format = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
        <p className="text-gray-500">Controle dedicado para CDB, CDI e fundos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-bold">Aportes</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{format(applied)}</p>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1"><BadgeDollarSign size={14}/> Entradas em investimentos</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-bold">Resgates/Saídas</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{format(redeemed)}</p>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1"><WalletCards size={14}/> Saídas registradas</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-bold">Saldo Líquido Investido</p>
          <p className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{format(net)}</p>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1"><TrendingUp size={14}/> Aportes - resgates</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Landmark size={18}/> Alocação por classe</h3>
        <div className="space-y-3">
          {rows.length === 0 && <p className="text-sm text-gray-400">Sem movimentações de investimento registradas.</p>}
          {rows.map(([name, value]) => (
            <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="font-medium text-gray-700 flex items-center gap-2"><PiggyBank size={16}/> {name}</span>
              <span className={`font-bold ${value >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{format(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Investments;
