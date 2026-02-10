import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Download, Upload, Trash2, Cloud, HardDrive, Plus } from 'lucide-react';
import { Account } from '../types';

const Settings: React.FC = () => {
  const { exportData, importData, importOFX, importCSV, data, addAccount, deleteAccount } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ofxInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const cloudHandleRef = useRef<any>(null);

  const [targetAccountForOFX, setTargetAccountForOFX] = useState(data.accounts[0]?.id || '');
  const [targetAccountForCSV, setTargetAccountForCSV] = useState(data.accounts[0]?.id || '');
  const [csvSeparator, setCsvSeparator] = useState(';');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastAutoBackup, setLastAutoBackup] = useState<string | null>(null);

  const [newAccount, setNewAccount] = useState<Omit<Account, 'id'>>({
    name: '', type: 'CHECKING', balance: 0,
  });

  const writeCloudBackup = async () => {
    if (!cloudHandleRef.current) return false;
    try {
      const writable = await cloudHandleRef.current.createWritable();
      await writable.write(exportData());
      await writable.close();
      setLastAutoBackup(new Date().toLocaleTimeString('pt-BR'));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleCloudSync = async () => {
    try {
      // @ts-ignore File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: 'meu_financeiro.json',
        types: [{ description: 'Banco de Dados JSON', accept: { 'application/json': ['.json'] } }],
      });
      cloudHandleRef.current = handle;
      setAutoBackupEnabled(true);
      await writeCloudBackup();
      alert('Arquivo vinculado! O app fará backup automático a cada 5 minutos e em mudanças de dados.');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!autoBackupEnabled || !cloudHandleRef.current) return;
    writeCloudBackup().catch(console.error);
  }, [autoBackupEnabled, data]);

  useEffect(() => {
    if (!autoBackupEnabled || !cloudHandleRef.current) return;
    const id = setInterval(() => { writeCloudBackup().catch(console.error); }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoBackupEnabled]);

  const handleExport = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_financeiro_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) { alert('Backup restaurado com sucesso!'); window.location.reload(); }
      else alert('Arquivo de backup inválido.');
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleOFXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const count = importOFX(content, targetAccountForOFX);
      alert(count > 0 ? `${count} transações importadas com sucesso!` : 'Nenhuma transação encontrada ou erro ao ler OFX.');
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const count = importCSV(content, targetAccountForCSV, csvSeparator);
      alert(count > 0 ? `${count} transações CSV importadas com sucesso!` : 'Nenhuma transação importada. Verifique o separador e os campos.');
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleAddAccount = () => {
    if (!newAccount.name.trim()) return;
    addAccount({ ...newAccount, name: newAccount.name.trim() });
    setNewAccount({ name: '', type: 'CHECKING', balance: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-lg text-white"><Cloud size={20} /></div><div><h2 className="text-lg font-bold text-gray-900">Sincronização em Nuvem</h2><p className="text-sm text-blue-700">Backup automático funcional (mudança + 5 minutos).</p></div></div>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={handleCloudSync} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"><HardDrive size={20} /> Vincular arquivo de banco de dados</button>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <p><strong>Backup automático:</strong> {autoBackupEnabled ? 'ativo' : 'inativo'}</p>
            <p>{lastAutoBackup ? `Último backup: ${lastAutoBackup}` : 'Ainda sem backup nesta sessão.'}</p>
            <button onClick={() => setAutoBackupEnabled(v => !v)} className="mt-1 px-2 py-1 rounded bg-white border border-blue-200 font-semibold">{autoBackupEnabled ? 'Pausar' : 'Ativar'}</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-800">Contas</h2><p className="text-sm text-gray-500">Adicionar/remover contas (incluindo cartão de crédito).</p></div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="Nome da conta" className="p-2 bg-gray-50 border rounded-lg text-sm" />
            <select value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value as any })} className="p-2 bg-gray-50 border rounded-lg text-sm">
              <option value="CHECKING">Conta Corrente</option><option value="WALLET">Carteira</option><option value="SAVINGS">Poupança</option><option value="INVESTMENT">Investimento</option><option value="CREDIT_CARD">Cartão de Crédito</option>
            </select>
            <input type="number" value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value || '0') })} placeholder="Saldo inicial" className="p-2 bg-gray-50 border rounded-lg text-sm" />
            <button onClick={handleAddAccount} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1"><Plus size={14}/>Adicionar</button>
          </div>

          <div className="space-y-2">
            {data.accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div><p className="font-medium text-gray-800">{acc.name}</p><p className="text-xs text-gray-500">{acc.type}</p></div>
                <button onClick={() => { if (confirm('Excluir conta e lançamentos vinculados?')) deleteAccount(acc.id); }} className="text-rose-600 text-sm font-semibold">Excluir</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-800">Backup Manual & Importação</h2></div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"><div className="flex items-center gap-4"><div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Download size={20} /></div><div><p className="font-medium text-gray-900">Exportar Backup</p></div></div><button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">Baixar</button></div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><Upload size={20} /></div><div><p className="font-medium text-gray-900">Restaurar Backup</p></div></div><button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">Selecionar</button><input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} /></div>

          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 space-y-3">
            <p className="font-medium text-gray-900">Importar OFX</p>
            <div className="flex items-center gap-2"><select value={targetAccountForOFX} onChange={e => setTargetAccountForOFX(e.target.value)} className="flex-1 p-2 bg-white border border-indigo-200 rounded-lg text-sm">{data.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select><button onClick={() => ofxInputRef.current?.click()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Importar OFX</button></div>
            <input type="file" ref={ofxInputRef} className="hidden" accept=".ofx" onChange={handleOFXChange} />
          </div>

          <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 space-y-3">
            <p className="font-medium text-gray-900">Importar CSV (com separador)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2"><select value={targetAccountForCSV} onChange={e => setTargetAccountForCSV(e.target.value)} className="p-2 bg-white border border-teal-200 rounded-lg text-sm">{data.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select><select value={csvSeparator} onChange={e => setCsvSeparator(e.target.value)} className="p-2 bg-white border border-teal-200 rounded-lg text-sm"><option value=";">;</option><option value=",">,</option><option value="|">|</option><option value={"\t"}>TAB</option></select><button onClick={() => csvInputRef.current?.click()} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">Importar CSV</button></div>
            <input type="file" ref={csvInputRef} className="hidden" accept=".csv,.txt" onChange={handleCSVChange} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-800">Zona de Perigo</h2></div>
        <div className="p-6"><button onClick={() => { if (confirm('Tem certeza que deseja apagar todos os dados?')) { localStorage.clear(); window.location.reload(); } }} className="flex items-center gap-2 text-rose-600 hover:text-rose-700 text-sm font-medium"><Trash2 size={16} /> Resetar Todos os Dados</button></div>
      </div>
    </div>
  );
};

export default Settings;
