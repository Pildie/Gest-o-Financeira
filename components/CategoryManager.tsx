
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';

const CategoryManager: React.FC = () => {
  const { data, addCategory, deleteCategory, addSubcategory } = useFinance();
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName) {
      addCategory({
        name: newCatName,
        type: newCatType,
        color: newCatType === 'EXPENSE' ? '#ef4444' : '#10b981',
        icon: 'Tag',
        subcategories: []
      });
      setNewCatName('');
    }
  };

  const handleAddSub = (catId: string) => {
    const sub = prompt('Nome da Subcategoria:');
    if (sub) addSubcategory(catId, sub);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Adicionar Nova Categoria</h2>
          <form onSubmit={handleAddCategory} className="flex gap-4">
             <input 
               type="text" 
               placeholder="Nome da categoria..." 
               className="flex-1 p-3 border rounded-xl bg-gray-50"
               value={newCatName}
               onChange={e => setNewCatName(e.target.value)}
             />
             <select 
               className="p-3 border rounded-xl bg-gray-50"
               value={newCatType}
               onChange={e => setNewCatType(e.target.value as any)}
             >
               <option value="EXPENSE">Despesa</option>
               <option value="INCOME">Receita</option>
             </select>
             <button type="submit" className="bg-gray-900 text-white px-6 rounded-xl font-bold hover:bg-gray-800">
               <Plus size={20} />
             </button>
          </form>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['EXPENSE', 'INCOME'].map(type => (
            <div key={type} className="space-y-3">
               <h3 className={`font-bold text-sm uppercase tracking-wide ${type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                 {type === 'EXPENSE' ? 'Categorias de Despesa' : 'Categorias de Receita'}
               </h3>
               {data.categories.filter(c => c.type === type).map(cat => (
                 <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                    >
                       <div className="flex items-center gap-3">
                          {expandedCat === cat.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                          <span className="font-bold text-gray-700">{cat.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cat.subcategories.length} sub</span>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); if(confirm('Excluir?')) deleteCategory(cat.id) }} className="text-gray-300 hover:text-rose-500">
                         <Trash2 size={16} />
                       </button>
                    </div>
                    
                    {expandedCat === cat.id && (
                      <div className="bg-gray-50 p-4 border-t border-gray-100">
                         <div className="flex flex-wrap gap-2 mb-3">
                           {cat.subcategories.map(sub => (
                             <span key={sub} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 shadow-sm">
                               {sub}
                             </span>
                           ))}
                         </div>
                         <button onClick={() => handleAddSub(cat.id)} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                           <FolderPlus size={16} /> Adicionar Subcategoria
                         </button>
                      </div>
                    )}
                 </div>
               ))}
            </div>
          ))}
       </div>
    </div>
  );
};

export default CategoryManager;
