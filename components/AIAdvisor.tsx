import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getFinancialAdvice } from '../services/geminiService';
import { Calculator, Send, Loader2, BarChart3 } from 'lucide-react';

const AIAdvisor: React.FC = () => {
  const { data } = useFinance();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Olá! Eu sou seu Analista Financeiro Local. Me peça para analisar seus gastos e eu calcularei um resumo matemático para você.' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mesmo sem usar a query para IA externa, mantemos o fluxo de chat para UX
    const userMessage = query.trim() || "Gerar análise geral";
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    setLoading(true);

    // Chama o serviço local
    const response = await getFinancialAdvice(userMessage, data);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      <div className="bg-emerald-600 p-4 text-white flex items-center gap-2">
        <Calculator size={24} />
        <div>
           <h2 className="font-bold">Analista Local</h2>
           <p className="text-xs text-emerald-100">100% Offline & Gratuito</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 shadow-sm rounded-bl-none border border-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-500">
               <Loader2 className="animate-spin" size={16} />
               <span className="text-xs">Calculando estatísticas...</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite 'Analisar' ou clique no botão..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {query ? <Send size={18} /> : <BarChart3 size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAdvisor;