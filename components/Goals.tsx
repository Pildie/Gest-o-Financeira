
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, Plus, Trash2, Shield, Car, Home, Plane, Gift } from 'lucide-react';

const Goals: React.FC = () => {
  const { data, addGoal, deleteGoal, updateGoal } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', deadline: '', icon: 'Target', color: '#10b981' });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.name && newGoal.targetAmount) {
      addGoal({
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        deadline: newGoal.deadline,
        color: newGoal.color,
        icon: newGoal.icon
      });
      setShowForm(false);
      setNewGoal({ name: '', targetAmount: '', deadline: '', icon: 'Target', color: '#10b981' });
    }
  };

  const getProgress = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const icons: {[key: string]: any} = { Target, Shield, Car, Home, Plane, Gift };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Metas & Objetivos</h1>
           <p className="text-gray-500 text-sm">Defina para onde seu dinheiro vai.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Nova Meta
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
           <h3 className="font-bold text-lg mb-4">Criar Novo Objetivo</h3>
           <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="text" placeholder="Nome do Objetivo (ex: Carro Novo)" required className="p-3 border rounded-xl w-full" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
                 <input type="number" placeholder="Valor Alvo (R$)" required className="p-3 border rounded-xl w-full" value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} />
                 <input type="date" className="p-3 border rounded-xl w-full" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} />
                 <select className="p-3 border rounded-xl w-full" value={newGoal.icon} onChange={e => setNewGoal({...newGoal, icon: e.target.value})}>
                    <option value="Target">Geral</option>
                    <option value="Shield">Reserva / Segurança</option>
                    <option value="Car">Veículo</option>
                    <option value="Home">Casa</option>
                    <option value="Plane">Viagem</option>
                 </select>
              </div>
              <div className="flex justify-end gap-2">
                 <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                 <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">Salvar</button>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.goals.map(goal => {
           const Icon = icons[goal.icon] || Target;
           const progress = getProgress(goal.currentAmount, goal.targetAmount);
           
           return (
             <div key={goal.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{backgroundColor: goal.color}}>
                         <Icon size={24} />
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-800">{goal.name}</h3>
                         {goal.deadline && <p className="text-xs text-gray-400">Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>}
                      </div>
                   </div>
                   <button onClick={() => { if(confirm('Apagar meta?')) deleteGoal(goal.id) }} className="text-gray-300 hover:text-rose-500">
                     <Trash2 size={18} />
                   </button>
                </div>

                <div className="mb-2 flex justify-between items-end">
                   <span className="text-2xl font-bold text-gray-900">{formatCurrency(goal.currentAmount)}</span>
                   <span className="text-sm text-gray-500 font-medium">de {formatCurrency(goal.targetAmount)}</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                   <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: goal.color }}></div>
                </div>

                <div className="flex gap-2">
                   <button 
                     onClick={() => {
                       const val = prompt('Quanto você guardou hoje para essa meta?');
                       if (val) updateGoal(goal.id, goal.currentAmount + parseFloat(val));
                     }}
                     className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm rounded-lg border border-gray-200"
                   >
                     + Adicionar R$
                   </button>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default Goals;
