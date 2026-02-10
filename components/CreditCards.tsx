
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CreditCard, Settings as SettingsIcon, Save } from 'lucide-react';
import { Account } from '../types';

const CreditCards: React.FC = () => {
  const { data, updateAccountDetails } = useFinance();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filtra apenas contas do tipo CREDIT_CARD
  const cards = data.accounts.filter(a => a.type === 'CREDIT_CARD');

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
          {/* Botão de adicionar cartão seria implementado adicionando uma conta nova do tipo CREDIT_CARD */}
       </div>

       {cards.length === 0 && (
         <div className="text-center p-12 bg-gray-100 rounded-3xl border border-dashed border-gray-300">
           <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
           <p className="text-gray-500 font-medium">Você ainda não tem cartões cadastrados.</p>
           <p className="text-sm text-gray-400">Adicione uma nova conta do tipo "Cartão de Crédito" nas configurações.</p>
         </div>
       )}

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
