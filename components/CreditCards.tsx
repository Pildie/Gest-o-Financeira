
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CreditCard, Settings as SettingsIcon, Save, Plus } from 'lucide-react';
import { Account } from '../types';

const CreditCards: React.FC = () => {
  const { data, updateAccountDetails, addAccount } = useFinance();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCard, setNewCard] = useState({ name: '', creditLimit: '0', closingDay: '1', dueDay: '10' });
  
  // Filtra apenas contas do tipo CREDIT_CARD
  const cards = data.accounts.filter(a => a.type === 'CREDIT_CARD');


  const cardIds = new Set(cards.map(c => c.id));
  const pendingCardExpenses = data.transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING' && cardIds.has(t.accountId));
  const outstandingInstallments = pendingCardExpenses.filter(t => !!t.installment);
  const renegotiations = pendingCardExpenses.filter(t => (t.description || '').toLowerCase().includes('renegoc') || (t.tags || []).some(tag => tag.toLowerCase().includes('renegoc')));

  const pendingByMonth = pendingCardExpenses.reduce<Record<string, number>>((acc, t) => {
    const month = t.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + t.amount;
    return acc;
  }, {});

  const nextMonths = Object.entries(pendingByMonth).sort((a,b) => a[0].localeCompare(b[0])).slice(0, 6);
  const totalOutstanding = pendingCardExpenses.reduce((s, t) => s + t.amount, 0);
  const installmentsOutstanding = outstandingInstallments.reduce((s, t) => s + t.amount, 0);
  const renegotiationOutstanding = renegotiations.reduce((s, t) => s + t.amount, 0);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSave = (id: string, form: any) => {
    updateAccountDetails(id, {
      name: form.name,
      creditLimit: parseFloat(form.limit),
      closingDay: parseInt(form.closing),
      dueDay: parseInt(form.due),
      // O balance em cartão geralmente representa o "gasto atual" (negativo) ou "fatura"
    });
    setEditingId(null);
  };

  const handleCreateCard = () => {
    if (!newCard.name.trim()) {
      alert('Informe o nome do cartão.');
      return;
    }

    addAccount({
      name: newCard.name.trim(),
      type: 'CREDIT_CARD',
      balance: 0,
      creditLimit: parseFloat(newCard.creditLimit || '0'),
      closingDay: parseInt(newCard.closingDay || '1', 10),
      dueDay: parseInt(newCard.dueDay || '10', 10),
    });

    setShowCreateCard(false);
    setNewCard({ name: '', creditLimit: '0', closingDay: '1', dueDay: '10' });
  };

  const CardEditor = ({ card, onCancel }: { card: Account, onCancel: () => void }) => {
    const [form, setForm] = useState({ 
      name: card.name, 
      limit: card.creditLimit?.toString() || '0',
      closing: card.closingDay?.toString() || '1',
      due: card.dueDay?.toString() || '10'
    });

    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm animate-fade-in space-y-4">
         <h3 className="font-bold text-gray-800">Editar Cartão</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-3 bg-gray-50 rounded-xl border" />
            <input type="number" placeholder="Limite" value={form.limit} onChange={e => setForm({...form, limit: e.target.value})} className="p-3 bg-gray-50 rounded-xl border" />
            <div className="flex gap-2 items-center">
               <span className="text-xs font-bold text-gray-500 w-24">Dia Fechamento:</span>
               <input type="number" min="1" max="31" value={form.closing} onChange={e => setForm({...form, closing: e.target.value})} className="p-3 bg-gray-50 rounded-xl border flex-1" />
            </div>
            <div className="flex gap-2 items-center">
               <span className="text-xs font-bold text-gray-500 w-24">Dia Vencimento:</span>
               <input type="number" min="1" max="31" value={form.due} onChange={e => setForm({...form, due: e.target.value})} className="p-3 bg-gray-50 rounded-xl border flex-1" />
            </div>
         </div>
         <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={() => handleSave(card.id, form)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
               <Save size={16} /> Salvar
            </button>
         </div>
      </div>
    )
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Cartões</h1>
            <p className="text-gray-500">Gerencie limites e datas de fechamento.</p>
          </div>
          <button
            onClick={() => setShowCreateCard((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold flex items-center gap-2"
          >
            <Plus size={16} /> Novo cartão
          </button>
       </div>

       {showCreateCard && (
         <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800">Adicionar cartão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Nome do cartão"
                value={newCard.name}
                onChange={(e) => setNewCard((prev) => ({ ...prev, name: e.target.value }))}
                className="p-3 bg-gray-50 rounded-xl border"
              />
              <input
                type="number"
                placeholder="Limite"
                value={newCard.creditLimit}
                onChange={(e) => setNewCard((prev) => ({ ...prev, creditLimit: e.target.value }))}
                className="p-3 bg-gray-50 rounded-xl border"
              />
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Dia de fechamento"
                value={newCard.closingDay}
                onChange={(e) => setNewCard((prev) => ({ ...prev, closingDay: e.target.value }))}
                className="p-3 bg-gray-50 rounded-xl border"
              />
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Dia de vencimento"
                value={newCard.dueDay}
                onChange={(e) => setNewCard((prev) => ({ ...prev, dueDay: e.target.value }))}
                className="p-3 bg-gray-50 rounded-xl border"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateCard(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
              <button onClick={handleCreateCard} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold">Salvar cartão</button>
            </div>
         </div>
       )}

       {cards.length === 0 && (
         <div className="text-center p-12 bg-gray-100 rounded-3xl border border-dashed border-gray-300">
           <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
           <p className="text-gray-500 font-medium">Você ainda não tem cartões cadastrados.</p>
           <p className="text-sm text-gray-400">Adicione uma nova conta do tipo "Cartão de Crédito" nas configurações.</p>
         </div>
       )}


       <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
         <h3 className="font-bold text-gray-900 mb-4">Indicadores de quitação antecipada</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
           <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
             <p className="text-xs font-bold text-gray-400 uppercase">Total pendente</p>
             <p className="text-xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p>
           </div>
           <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
             <p className="text-xs font-bold text-amber-600 uppercase">Parcelas a vencer</p>
             <p className="text-xl font-bold text-amber-700">{formatCurrency(installmentsOutstanding)}</p>
             <p className="text-xs text-amber-600">{outstandingInstallments.length} lançamentos parcelados</p>
           </div>
           <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
             <p className="text-xs font-bold text-indigo-600 uppercase">Renegociações</p>
             <p className="text-xl font-bold text-indigo-700">{formatCurrency(renegotiationOutstanding)}</p>
             <p className="text-xs text-indigo-600">{renegotiations.length} lançamentos identificados</p>
           </div>
         </div>

         <div className="space-y-2">
           <p className="text-xs font-bold text-gray-400 uppercase">Comprometimento projetado (6 meses)</p>
           {nextMonths.length === 0 && <p className="text-sm text-gray-400">Sem despesas pendentes de cartão.</p>}
           {nextMonths.map(([month, value]) => (
             <div key={month} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
               <span className="text-sm font-medium text-gray-700">{new Date(month + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
               <span className="font-bold text-gray-900">{formatCurrency(value)}</span>
             </div>
           ))}
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => {
             if (editingId === card.id) return <div className="col-span-full"><CardEditor key={card.id} card={card} onCancel={() => setEditingId(null)} /></div>;

             const limit = card.creditLimit || 0;
             // Balance é negativo quando gasto. Ex: -500.
             const currentInvoice = Math.abs(card.balance); 
             const available = limit - currentInvoice;
             const progress = limit > 0 ? (currentInvoice / limit) * 100 : 0;

             return (
               <div key={card.id} className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
                  
                  <div className="flex justify-between items-start z-10">
                     <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                        <CreditCard size={24} />
                     </div>
                     <button onClick={() => setEditingId(card.id)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <SettingsIcon size={18} />
                     </button>
                  </div>

                  <div className="z-10 space-y-1">
                     <h3 className="text-lg font-medium tracking-wide opacity-90">{card.name}</h3>
                     <p className="text-3xl font-bold">{formatCurrency(currentInvoice)}</p>
                     <p className="text-xs text-gray-400 uppercase tracking-widest">Fatura Atual</p>
                  </div>

                  <div className="z-10 mt-4">
                     <div className="flex justify-between text-xs text-gray-300 mb-1">
                        <span>Disponível: {formatCurrency(available)}</span>
                        <span>Limite: {formatCurrency(limit)}</span>
                     </div>
                     <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                           className={`h-full rounded-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : 'bg-blue-400'}`} 
                           style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                     </div>
                  </div>

                  {/* Detalhes de Data */}
                  <div className="z-10 mt-4 flex gap-4 text-xs text-gray-400">
                     {card.closingDay && <span>Fecha dia: <strong className="text-white">{card.closingDay}</strong></span>}
                     {card.dueDay && <span>Vence dia: <strong className="text-white">{card.dueDay}</strong></span>}
                  </div>

                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500 opacity-10 rounded-full blur-2xl"></div>
               </div>
             )
          })}
       </div>
    </div>
  );
};

export default CreditCards;
