import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';

const CategoryManager: React.FC = () => {
  const { data, addCategory, deleteCategory, addSubcategory } = useFinance();
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [subInputByCategory, setSubInputByCategory] = useState<Record<string, string>>({});

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatType === 'EXPENSE' ? '#ef4444' : '#10b981',
        icon: 'Tag',
        subcategories: []
      });
      setNewCatName('');
    }
  };

  const handleAddSub = (catId: string) => {
    const value = (subInputByCategory[catId] || '').trim();
    if (!value) return;
    addSubcategory(catId, value);
    setSubInputByCategory(prev => ({ ...prev, [catId]: '' }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
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
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Excluir?')) deleteCategory(cat.id); }} className="text-gray-300 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>

                {expandedCat === cat.id && (
                  <div className="bg-gray-50 p-4 border-t border-gray-100 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {cat.subcategories.map(sub => (
                        <span key={sub} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 shadow-sm">
                          {sub}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={subInputByCategory[cat.id] || ''}
                        onChange={e => setSubInputByCategory(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        placeholder="Nova subcategoria..."
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      />
                      <button onClick={() => handleAddSub(cat.id)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
                        <FolderPlus size={14} /> Adicionar
                      </button>
                    </div>
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
