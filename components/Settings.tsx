
import React, { useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Download, Upload, Trash2, FileText, Cloud, HardDrive } from 'lucide-react';

const Settings: React.FC = () => {
  const { exportData, importData, importOFX, data } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ofxInputRef = useRef<HTMLInputElement>(null);
  const [targetAccountForOFX, setTargetAccountForOFX] = useState(data.accounts[0]?.id || '');

  // Simulação da API de File System Access para demonstração
  // No Electron real, isso abrirá o seletor nativo
  const handleCloudSync = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: 'meu_financeiro.json',
        types: [{
          description: 'Banco de Dados JSON',
          accept: { 'application/json': ['.json'] },
        }],
      });
      alert(`Arquivo vinculado com sucesso! \n\nPara usar o OneDrive:\n1. Salve este arquivo dentro da sua pasta do OneDrive.\n2. O OneDrive sincronizará o arquivo automaticamente.\n3. Em outro PC, abra o app e selecione este mesmo arquivo.`);
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleOFXClick = () => {
    if (!targetAccountForOFX) {
      alert("Selecione uma conta para vincular o extrato.");
      return;
    }
    ofxInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        alert('Backup restaurado com sucesso!');
        window.location.reload();
      } else {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleOFXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const count = importOFX(content, targetAccountForOFX);
      if (count > 0) {
        alert(`${count} transações importadas com sucesso!`);
      } else {
        alert('Nenhuma transação encontrada ou erro ao ler arquivo OFX.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* Seção de Nuvem / OneDrive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Cloud size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-900">Sincronização em Nuvem (OneDrive)</h2>
                <p className="text-sm text-blue-700">Mantenha seus dados seguros e acesse de qualquer PC.</p>
             </div>
          </div>
        </div>
        <div className="p-6">
           <p className="text-sm text-gray-600 mb-4">
             O app não possui servidor próprio. Para sincronizar, você deve salvar o banco de dados dentro da sua pasta do <strong>OneDrive, Google Drive ou Dropbox</strong> no seu computador.
           </p>
           
           <button 
             onClick={handleCloudSync}
             className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
           >
             <HardDrive size={20} />
             Criar/Selecionar Arquivo de Banco de Dados
           </button>
           <p className="text-xs text-center text-gray-400 mt-2">Isto abrirá o explorador de arquivos do Windows.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Backup Manual & Importação</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus arquivos manualmente se preferir não usar a nuvem.</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Download size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Exportar Backup</p>
                <p className="text-xs text-gray-500">Salvar JSON manualmente.</p>
              </div>
            </div>
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
            >
              Baixar
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                <Upload size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Restaurar Backup</p>
                <p className="text-xs text-gray-500">Carregar arquivo JSON.</p>
              </div>
            </div>
            <button 
              onClick={handleImportClick}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
            >
              Selecionar
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json"
              onChange={handleFileChange}
            />
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 space-y-3">
             <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Importar Extrato (OFX)</p>
                <p className="text-xs text-gray-500">Importar transações do seu banco.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <select 
                 value={targetAccountForOFX}
                 onChange={e => setTargetAccountForOFX(e.target.value)}
                 className="flex-1 p-2 bg-white border border-indigo-200 rounded-lg text-sm"
               >
                 <option value="">Selecione a conta destino...</option>
                 {data.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
               </select>
               <button 
                  onClick={handleOFXClick}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700"
                >
                  Importar OFX
                </button>
            </div>
            <input 
              type="file" 
              ref={ofxInputRef} 
              className="hidden" 
              accept=".ofx"
              onChange={handleOFXChange}
            />
          </div>

        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Zona de Perigo</h2>
        </div>
        <div className="p-6">
           <button 
              onClick={() => {
                if(confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 text-rose-600 hover:text-rose-700 text-sm font-medium"
            >
              <Trash2 size={16} />
              Resetar Todos os Dados
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;