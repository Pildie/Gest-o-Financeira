
import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import Reports from './components/Reports';
import AIAdvisor from './components/AIAdvisor';
import Settings from './components/Settings';
import Goals from './components/Goals';
import CategoryManager from './components/CategoryManager';
import CreditCards from './components/CreditCards';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import { LayoutDashboard, PieChart, Bot, Settings as SettingsIcon, Menu, X, ArrowUpCircle, ArrowDownCircle, Target, Tags, CreditCard, List, Calculator } from 'lucide-react';
import { TransactionType, Transaction } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'REPORTS' | 'GOALS' | 'CARDS' | 'BUDGETS' | 'CATEGORIES' | 'AI' | 'SETTINGS'>('DASHBOARD');
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('EXPENSE');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openModal = (type: TransactionType) => {
    setModalType(type);
    setEditingTransaction(null);
    setShowModal(true);
    setMobileMenuOpen(false);
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setModalType(t.type);
    setShowModal(true);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium text-sm group ${
        activeTab === id 
          ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
      <span>{label}</span>
    </button>
  );

  return (
    <FinanceProvider>
      <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
        
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 h-screen sticky top-0 z-20 overflow-y-auto scrollbar-thin">
          <div className="p-8 pb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2 select-none">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <LayoutDashboard size={20} />
              </div>
              Finanças<span className="text-blue-600">.</span>
            </h1>
          </div>
          
          <div className="px-6 py-2 space-y-3">
             <button
               onClick={() => openModal('INCOME')}
               className="w-full flex items-center justify-center gap-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 py-3.5 rounded-2xl transition-all font-bold text-sm group"
             >
               <div className="bg-white rounded-full p-1 text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                  <ArrowUpCircle size={18} />
               </div>
               Receita
             </button>
             <button
               onClick={() => openModal('EXPENSE')}
               className="w-full flex items-center justify-center gap-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 py-3.5 rounded-2xl transition-all font-bold text-sm group"
             >
               <div className="bg-white rounded-full p-1 text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
                  <ArrowDownCircle size={18} />
               </div>
               Despesa
             </button>
          </div>
          
          <nav className="flex-1 px-6 space-y-1.5 mt-6">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Principal</p>
            <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Visão Geral" />
            <NavItem id="TRANSACTIONS" icon={List} label="Extrato" />
            <NavItem id="CARDS" icon={CreditCard} label="Cartões" />
            <NavItem id="BUDGETS" icon={Calculator} label="Orçamentos" />
            <NavItem id="GOALS" icon={Target} label="Metas" />
            
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">Gestão</p>
            <NavItem id="REPORTS" icon={PieChart} label="Relatórios" />
            <NavItem id="CATEGORIES" icon={Tags} label="Categorias" />
            <NavItem id="AI" icon={Bot} label="Consultor" />
            <NavItem id="SETTINGS" icon={SettingsIcon} label="Ajustes" />
          </nav>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 flex items-center justify-between px-4 shadow-sm">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <LayoutDashboard size={18} />
             </div>
             <span className="font-bold text-lg text-gray-900 tracking-tight">Finanças.</span>
           </div>
           <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
             {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-white z-30 pt-20 px-6 space-y-4 md:hidden animate-fade-in overflow-y-auto">
             <nav className="space-y-2 pb-10">
                <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Visão Geral" />
                <NavItem id="TRANSACTIONS" icon={List} label="Extrato Completo" />
                <NavItem id="CARDS" icon={CreditCard} label="Cartões de Crédito" />
                <NavItem id="BUDGETS" icon={Calculator} label="Orçamentos" />
                <NavItem id="GOALS" icon={Target} label="Metas" />
                <NavItem id="REPORTS" icon={PieChart} label="Relatórios" />
                <NavItem id="CATEGORIES" icon={Tags} label="Categorias" />
                <NavItem id="AI" icon={Bot} label="Consultor IA" />
                <NavItem id="SETTINGS" icon={SettingsIcon} label="Configurações" />
             </nav>
          </div>
        )}

        {/* Main Content Scrollable Area */}
        <div className="flex-1 h-screen overflow-hidden flex flex-col relative">
           {/* Barra de Título Simulada para Desktop (Arrastável) */}
           <div className="h-8 bg-transparent w-full fixed top-0 left-0 z-50 pointer-events-none drag-region hidden md:block" style={{WebkitAppRegion: 'drag'} as any}></div>

           <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto scrollbar-thin mt-16 md:mt-0 w-full max-w-[1600px] mx-auto pb-24">
               {activeTab === 'DASHBOARD' && <Dashboard onEdit={handleEditTransaction} onViewAll={() => setActiveTab('TRANSACTIONS')} />}
               {activeTab === 'TRANSACTIONS' && <Transactions onEdit={handleEditTransaction} />}
               {activeTab === 'CARDS' && <CreditCards />}
               {activeTab === 'BUDGETS' && <Budgets />}
               {activeTab === 'REPORTS' && <Reports />}
               {activeTab === 'GOALS' && <Goals />}
               {activeTab === 'CATEGORIES' && <CategoryManager />}
               {activeTab === 'AI' && <AIAdvisor />}
               {activeTab === 'SETTINGS' && <Settings />}
           </main>
        </div>

        {/* Modal */}
        {showModal && (
          <TransactionForm 
            onClose={() => setShowModal(false)} 
            initialType={modalType}
            initialData={editingTransaction}
          />
        )}
      </div>
    </FinanceProvider>
  );
};

export default App;
