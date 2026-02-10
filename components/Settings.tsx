import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Download, Upload, Trash2, Cloud, HardDrive, FileText } from 'lucide-react';

const AUTO_BACKUP_KEY = 'financas_auto_backup_handle_supported';

const Settings: React.FC = () => {
  const { exportData, importData, importOFX, importCSV, data } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ofxInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const cloudHandleRef = useRef<any>(null);

  const [targetAccountForOFX, setTargetAccountForOFX] = useState(data.accounts[0]?.id || '');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(localStorage.getItem(AUTO_BACKUP_KEY) === 'true');
  const [lastAutoBackup, setLastAutoBackup] = useState<string | null>(null);
  const [csvSeparator, setCsvSeparator] = useState(';');
  const [targetAccountForCSV, setTargetAccountForCSV] = useState(data.accounts[0]?.id || '');

  const writeCloudBackup = async () => {
    if (!cloudHandleRef.current) return;
    const writable = await cloudHandleRef.current.createWritable();
    await writable.write(exportData());
    await writable.close();
    setLastAutoBackup(new Date().toLocaleTimeString('pt-BR'));
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
      localStorage.setItem(AUTO_BACKUP_KEY, 'true');
      await writeCloudBackup();
      alert('Arquivo vinculado! O app fará backup automático a cada 5 minutos neste mesmo arquivo enquanto estiver aberto.');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (autoBackupEnabled && !cloudHandleRef.current) {
      setAutoBackupEnabled(false);
      localStorage.setItem(AUTO_BACKUP_KEY, 'false');
    }
  }, []);

  useEffect(() => {
    if (!autoBackupEnabled || !cloudHandleRef.current) return;
    const id = setInterval(() => {
      writeCloudBackup().catch(console.error);
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoBackupEnabled, data]);

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

  const handleOFXClick = () => {
    if (!targetAccountForOFX) {
      alert('Selecione uma conta para vincular o extrato.');
      return;
    }
    ofxInputRef.current?.click();
  };

  const handleOFXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const count = importOFX(content, targetAccountForOFX);
      alert(count > 0 ? `${count} transações importadas com sucesso!` : 'Nenhuma transação encontrada ou erro ao ler OFX.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCSVClick = () => {
    if (!targetAccountForCSV) {
      alert('Selecione uma conta para importar o CSV.');
      return;
    }
    csvInputRef.current?.click();
  };

  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const count = importCSV(content, targetAccountForCSV, csvSeparator);
      alert(count > 0 ? `${count} transações CSV importadas com sucesso!` : 'Nenhuma transação importada. Verifique o separador e os campos do arquivo.');
    };
    reader.readAsText(file);
    e.target.value = '';
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
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Backup em Nuvem (Arquivo Vinculado)</h2>
              <p className="text-sm text-gray-600">Mantenha um arquivo JSON sincronizado automaticamente.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <button onClick={handleCloudSync} className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Vincular Arquivo de Backup
          </button>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <HardDrive size={20} className="text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Backup Automático</p>
                <p className="text-sm text-gray-500">
                  Status: {autoBackupEnabled ? 'Ativado' : 'Desativado'}
                  {lastAutoBackup ? ` • Último: ${lastAutoBackup}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !autoBackupEnabled;
                setAutoBackupEnabled(next);
                localStorage.setItem(AUTO_BACKUP_KEY, String(next));
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                autoBackupEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {autoBackupEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Backup Manual & Importação</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Download size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Exportar Backup</p>
              </div>
            </div>
            <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
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
              </div>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
              Selecionar
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
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
              <select value={targetAccountForOFX} onChange={(e) => setTargetAccountForOFX(e.target.value)} className="flex-1 p-2 bg-white border border-indigo-200 rounded-lg text-sm">
                <option value="">Selecione a conta destino...</option>
                {data.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <button onClick={handleOFXClick} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">
                Importar OFX
              </button>
            </div>
            <input type="file" ref={ofxInputRef} className="hidden" accept=".ofx" onChange={handleOFXChange} />
          </div>

          <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Importar Extrato (CSV)</p>
                <p className="text-xs text-gray-500">Informe o separador usado pelo banco (; , | ou TAB).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select value={targetAccountForCSV} onChange={(e) => setTargetAccountForCSV(e.target.value)} className="p-2 bg-white border border-teal-200 rounded-lg text-sm">
                <option value="">Conta destino...</option>
                {data.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <select value={csvSeparator} onChange={(e) => setCsvSeparator(e.target.value)} className="p-2 bg-white border border-teal-200 rounded-lg text-sm">
                <option value=";">Ponto e vírgula (;)</option>
                <option value=",">Vírgula (,)</option>
                <option value="|">Pipe (|)</option>
                <option value={'\t'}>TAB</option>
              </select>
              <button onClick={handleCSVClick} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-teal-700">
                Importar CSV
              </button>
            </div>
            <input type="file" ref={csvInputRef} className="hidden" accept=".csv,.txt" onChange={handleCSVChange} />
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
              if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 text-rose-600 hover:text-rose-700 text-sm font-medium"
          >
            <Trash2 size={16} /> Resetar Todos os Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
