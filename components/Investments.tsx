codex/compare-code-with-mobills-pro-for-improvements-oda9ki
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { WalletCards, TrendingUp, PiggyBank, Landmark, BadgeDollarSign, Plus, Trash2, Save } from 'lucide-react';
import { InvestmentAsset, InvestmentType } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

const typeOptions: { value: InvestmentType; label: string }[] = [
  { value: 'CDB', label: 'CDB' },
  { value: 'CDI', label: 'CDI' },
  { value: 'FUNDO_RF', label: 'Fundo Renda Fixa' },
  { value: 'FUNDO_MULT', label: 'Fundo Multimercado' },
  { value: 'TESOURO', label: 'Tesouro Direto' },
  { value: 'OUTRO', label: 'Outro' },
];

const initialForm: Omit<InvestmentAsset, 'id'> = {
  name: '',
  type: 'CDB',
  institution: '',
  principal: 0,
  annualRate: 12,
  benchmark: 'CDI',
  benchmarkPercent: 100,
  liquidityDays: 1,
  startDate: new Date().toISOString().split('T')[0],
  expectedWithdrawalDate: '',
  iofRetroactive: false,
  iofRate: 0,
  irRate: 15,
  irRetroactiveBase: '',
  notes: '',
};

const Investments: React.FC = () => {
  const { data, addInvestment, updateInvestment, deleteInvestment } = useFinance();
  const [form, setForm] = useState<Omit<InvestmentAsset, 'id'>>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const assets = data.investments || [];

  const format = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const simulate = (asset: Omit<InvestmentAsset, 'id'> | InvestmentAsset) => {
    const start = new Date(asset.startDate + 'T00:00:00');
    const end = asset.expectedWithdrawalDate ? new Date(asset.expectedWithdrawalDate + 'T00:00:00') : new Date();
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_MS));
    const gross = asset.principal * Math.pow(1 + (asset.annualRate / 100), days / 365);
    const grossYield = gross - asset.principal;
    const iof = Math.max(0, grossYield * ((asset.iofRate || 0) / 100));
    const ir = Math.max(0, (grossYield - iof) * ((asset.irRate || 0) / 100));
    const net = gross - iof - ir;
    const netYield = net - asset.principal;
    return { days, gross, net, grossYield, netYield, iof, ir };
  };

  const totals = useMemo(() => {
    const applied = assets.reduce((s, a) => s + a.principal, 0);
    const sim = assets.reduce((acc, a) => {
      const s = simulate(a);
      return {
        gross: acc.gross + s.gross,
        net: acc.net + s.net,
      };
    }, { gross: 0, net: 0 });
    return { applied, gross: sim.gross, net: sim.net };
  }, [assets]);

  const opportunities = useMemo(() => {
    const list: string[] = [];
    assets.forEach(a => {
      const sim = simulate(a);
      if (a.liquidityDays > 30) list.push(`${a.name}: liquidez de ${a.liquidityDays} dias, planeje caixa.`);
      if (sim.netYield < 0) list.push(`${a.name}: rendimento líquido projetado negativo.`);
      if ((a.annualRate || 0) < 100 && a.benchmark === 'CDI') list.push(`${a.name}: abaixo de 100% CDI, avalie alternativas.`);
    });
    return list.slice(0, 5);
  }, [assets]);

  const allocation = useMemo(() => {
    const agg = assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + a.principal;
      return acc;
    }, {});
    return Object.entries(agg).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  const handleSave = () => {
    if (!form.name || !form.institution || form.principal <= 0) {
      alert('Preencha nome, instituição e valor de aporte.');
      return;
    }
    if (editingId) {
      updateInvestment(editingId, form);
      setEditingId(null);
    } else {
      addInvestment(form);
    }
    setForm(initialForm);
  };

  const handleEdit = (asset: InvestmentAsset) => {
    setEditingId(asset.id);
    setForm({ ...asset });
  };
=======
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
main

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
codex/compare-code-with-mobills-pro-for-improvements-oda9ki
        <p className="text-gray-500">Cadastro editável com simulação de rendimento bruto/líquido e impostos.</p>
        <p className="text-gray-500">Controle dedicado para CDB, CDI e fundos.</p>
main
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
codex/compare-code-with-mobills-pro-for-improvements-oda9ki
          <p className="text-xs text-gray-400 uppercase font-bold">Total aportado</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{format(totals.applied)}</p>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1"><BadgeDollarSign size={14}/> Principal investido</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-bold">Projeção bruta</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{format(totals.gross)}</p>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1"><TrendingUp size={14}/> Sem descontos</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-bold">Projeção líquida</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{format(totals.net)}</p>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1"><WalletCards size={14}/> Com IOF/IR</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Plus size={18}/> {editingId ? 'Editar investimento' : 'Novo investimento'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do investimento" className="p-3 bg-gray-50 rounded-xl border" />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as InvestmentType })} className="p-3 bg-gray-50 rounded-xl border">
            {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder="Banco/Fundo" className="p-3 bg-gray-50 rounded-xl border" />
          <input type="number" value={form.principal} onChange={e => setForm({ ...form, principal: parseFloat(e.target.value || '0') })} placeholder="Aporte" className="p-3 bg-gray-50 rounded-xl border" />
          <input type="number" step="0.01" value={form.annualRate} onChange={e => setForm({ ...form, annualRate: parseFloat(e.target.value || '0') })} placeholder="Taxa anual %" className="p-3 bg-gray-50 rounded-xl border" />
          <input type="number" value={form.liquidityDays} onChange={e => setForm({ ...form, liquidityDays: parseInt(e.target.value || '0', 10) })} placeholder="Liquidez (dias)" className="p-3 bg-gray-50 rounded-xl border" />
          <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="p-3 bg-gray-50 rounded-xl border" />
          <input type="date" value={form.expectedWithdrawalDate || ''} onChange={e => setForm({ ...form, expectedWithdrawalDate: e.target.value })} className="p-3 bg-gray-50 rounded-xl border" />
          <select value={form.benchmark || 'CDI'} onChange={e => setForm({ ...form, benchmark: e.target.value as any })} className="p-3 bg-gray-50 rounded-xl border">
            <option value="CDI">Base CDI</option>
            <option value="IPCA">Base IPCA</option>
            <option value="PRE">Pré-fixado</option>
          </select>
          <input type="number" step="0.01" value={form.benchmarkPercent || 0} onChange={e => setForm({ ...form, benchmarkPercent: parseFloat(e.target.value || '0') })} placeholder="% da base (ex: 110 CDI)" className="p-3 bg-gray-50 rounded-xl border" />
          <input type="number" step="0.01" value={form.iofRate} onChange={e => setForm({ ...form, iofRate: parseFloat(e.target.value || '0') })} placeholder="IOF (%)" className="p-3 bg-gray-50 rounded-xl border" />
          <input type="number" step="0.01" value={form.irRate} onChange={e => setForm({ ...form, irRate: parseFloat(e.target.value || '0') })} placeholder="IR (%)" className="p-3 bg-gray-50 rounded-xl border" />
          <input value={form.irRetroactiveBase || ''} onChange={e => setForm({ ...form, irRetroactiveBase: e.target.value })} placeholder="IR retroativo - base" className="p-3 bg-gray-50 rounded-xl border" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.iofRetroactive} onChange={e => setForm({ ...form, iofRetroactive: e.target.checked })} /> IOF retroativo
        </label>
        <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações" className="w-full p-3 bg-gray-50 rounded-xl border" />
        <div className="flex gap-2 justify-end">
          {editingId && <button onClick={() => { setEditingId(null); setForm(initialForm); }} className="px-4 py-2 rounded-lg border">Cancelar</button>}
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-2"><Save size={16}/>Salvar</button>
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
main
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
codex/compare-code-with-mobills-pro-for-improvements-oda9ki
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Landmark size={18}/> Alocação por tipo</h3>
        <div className="space-y-2">
          {allocation.length === 0 && <p className="text-sm text-gray-400">Sem investimentos cadastrados.</p>}
          {allocation.map(([type, value]) => (
            <div key={type} className="flex justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-medium text-gray-700">{type}</span>
              <span className="font-bold text-gray-900">{format(value)}</span>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Landmark size={18}/> Alocação por classe</h3>
        <div className="space-y-3">
          {rows.length === 0 && <p className="text-sm text-gray-400">Sem movimentações de investimento registradas.</p>}
          {rows.map(([name, value]) => (
            <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="font-medium text-gray-700 flex items-center gap-2"><PiggyBank size={16}/> {name}</span>
              <span className={`font-bold ${value >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{format(value)}</span>
main
            </div>
          ))}
        </div>
      </div>
codex/compare-code-with-mobills-pro-for-improvements-oda9ki

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Carteira cadastrada</h3>
          <div className="space-y-3">
            {assets.length === 0 && <p className="text-sm text-gray-400">Nenhum investimento cadastrado.</p>}
            {assets.map(asset => {
              const sim = simulate(asset);
              return (
                <div key={asset.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-500">{asset.type} • {asset.institution}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(asset)} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">Editar</button>
                      <button onClick={() => deleteInvestment(asset.id)} className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 flex items-center gap-1"><Trash2 size={12}/>Excluir</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p>Aporte: <strong>{format(asset.principal)}</strong></p>
                    <p>Liquidez: <strong>{asset.liquidityDays} dias</strong></p>
                    <p>Bruto: <strong>{format(sim.gross)}</strong></p>
                    <p>Líquido: <strong>{format(sim.net)}</strong></p>
                    <p>Rendimento bruto: <strong>{format(sim.grossYield)}</strong></p>
                    <p>Rendimento líquido: <strong>{format(sim.netYield)}</strong></p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><PiggyBank size={18}/> Saúde e oportunidades</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {opportunities.length === 0 && <li className="text-gray-400">Sem alertas no momento. Continue acompanhando prazos e rentabilidade.</li>}
            {opportunities.map((item, idx) => <li key={idx} className="p-2 bg-amber-50 border border-amber-100 rounded-lg">• {item}</li>)}
          </ul>
        </div>
      </div>
main
    </div>
  );
};

export default Investments;
