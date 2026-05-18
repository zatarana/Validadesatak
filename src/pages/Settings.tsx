import React, { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Store, Bell, Clock, ShieldAlert, Save, RefreshCw, Download, Upload, Send, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { getNotificationPermissionState, requestNotificationPermission, sendTestNotification } from '../lib/notifications';
import { createRemoteOperator } from '../lib/remoteDatabase';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function SettingsPage() {
  const { settings, updateSettings, resetSettings, exportBackup, importBackup, products, session, isCloudMode, logout } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [permission, setPermission] = useState(getNotificationPermissionState());
  const [operatorName, setOperatorName] = useState('');
  const [operatorPin, setOperatorPin] = useState('');
  const [operatorStores, setOperatorStores] = useState('');
  const [creatingOperator, setCreatingOperator] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('Configurações salvas!');
  };

  const handleReset = () => {
    resetSettings();
    toast.success('Padrões restaurados.');
  };

  const handleExportBackup = () => {
    const backup = exportBackup();
    downloadJson(`satak-backup-${new Date().toISOString().slice(0, 10)}.json`, backup);
    toast.success('Backup exportado.');
  };

  const handleImportBackup = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importBackup(data);
      toast.success('Backup importado com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível importar o backup.');
    }
  };

  const handleCreateOperator = async () => {
    const pin = operatorPin.replace(/\D/g, '').slice(0, 6);
    const stores = operatorStores.split(/[;,\s]+/).map(item => Number(item.trim())).filter(item => Number.isInteger(item) && item >= 1 && item <= 80);

    if (pin.length !== 6) {
      toast.error('O PIN do operador precisa ter 6 números.');
      return;
    }
    if (stores.length === 0) {
      toast.error('Informe pelo menos uma loja de 1 até 80.');
      return;
    }

    setCreatingOperator(true);
    try {
      await createRemoteOperator(operatorName, pin, Array.from(new Set(stores)));
      setOperatorName('');
      setOperatorPin('');
      setOperatorStores('');
      toast.success('Operador criado e vinculado às lojas.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar operador.');
    } finally {
      setCreatingOperator(false);
    }
  };

  const handleRequestNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') toast.success('Notificações permitidas.');
    else if (result === 'unsupported') toast.error('Este navegador não suporta notificações.');
    else toast.error('Notificações não foram permitidas.');
  };

  const handleTestNotification = () => {
    try {
      sendTestNotification(products, localSettings);
      toast.success('Notificação de teste enviada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a notificação.');
    }
  };

  const handleInput = (key: keyof typeof settings, value: string | number) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 mb-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">CONFIGS</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">{isCloudMode && session ? `Nuvem • Loja ${session.storeNumber} • ${session.role === 'admin' ? 'Admin' : 'Operador'}` : 'Modo local'}</p>
      </div>

      {isCloudMode && session && (
        <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-4">
          <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight"><Store className="text-indigo-600" size={24} /> Sessão</h2>
          <p className="text-slate-500 font-bold text-sm">Você está conectado na Loja {session.storeNumber}. Os dados desta loja sincronizam entre dispositivos.</p>
          <button onClick={logout} className="bg-slate-900 text-white rounded-2xl py-4 px-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><LogOut size={17} /> Sair da loja</button>
        </section>
      )}

      {isCloudMode && session?.role === 'admin' && (
        <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-indigo-100 space-y-5">
          <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight"><UserPlus className="text-indigo-600" size={24} /> Admin: criar operador</h2>
          <p className="text-slate-500 font-bold text-sm">Crie um PIN de 6 números e informe quais lojas o operador poderá acessar. Separe várias lojas por vírgula, espaço ou ponto e vírgula.</p>
          <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome do operador</label><input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800" value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="Ex: João - Perecíveis" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PIN</label><input inputMode="numeric" maxLength={6} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-black text-slate-800 text-center tracking-[0.25em]" value={operatorPin} onChange={e => setOperatorPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></div>
            <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lojas</label><input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800" value={operatorStores} onChange={e => setOperatorStores(e.target.value)} placeholder="1, 2, 15" /></div>
          </div>
          <button disabled={creatingOperator} onClick={handleCreateOperator} className="w-full bg-indigo-600 text-white rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"><UserPlus size={17} /> {creatingOperator ? 'Criando...' : 'Criar operador'}</button>
        </section>
      )}

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-6">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight"><Store className="text-indigo-600" size={24} /> Identificação</h2>
        <p className="text-slate-500 font-bold text-sm">Aparece nos relatórios exportados.</p>
        <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome da Loja</label><input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 transition-all font-sans" value={localSettings.storeName} onChange={e => handleInput('storeName', e.target.value)} /></div>
        <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome da Equipe</label><input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 transition-all font-sans" value={localSettings.teamName} onChange={e => handleInput('teamName', e.target.value)} /></div>
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-6">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight"><Bell className="text-rose-500" size={24} /> Alertas de Validade</h2>
        <p className="text-slate-500 font-bold text-sm">Defina os dias de antecedência para cada nível de alerta.</p>
        <div className="grid grid-cols-2 gap-4">
          <AlertInput label="Crítico" color="red" value={localSettings.alertCritical} onChange={value => handleInput('alertCritical', value)} />
          <AlertInput label="Alto" color="amber" value={localSettings.alertHigh} onChange={value => handleInput('alertHigh', value)} />
          <AlertInput label="Médio" color="indigo" value={localSettings.alertMedium} onChange={value => handleInput('alertMedium', value)} />
          <AlertInput label="Baixo" color="emerald" value={localSettings.alertLow} onChange={value => handleInput('alertLow', value)} />
        </div>
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-6">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight"><Clock className="text-indigo-600" size={24} /> Notificações Push</h2>
        <p className="text-slate-500 font-bold text-sm">Horário preferido para receber alertas de validade.</p>
        <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Horário de notificação</label><input type="time" className="w-full max-w-[220px] bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-black text-slate-800 transition-all" value={localSettings.notificationTime} onChange={e => handleInput('notificationTime', e.target.value)} /><p className="text-xs text-slate-400 font-bold">Status: {permission === 'granted' ? 'permitidas' : permission === 'denied' ? 'bloqueadas' : permission === 'unsupported' ? 'não suportadas' : 'não solicitadas'}.</p></div>
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={handleRequestNotifications} className="bg-indigo-50 border-2 border-indigo-100 text-indigo-700 rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Bell size={17} /> Permitir</button><button type="button" onClick={handleTestNotification} className="bg-slate-50 border-2 border-slate-100 text-slate-700 rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Send size={17} /> Testar</button></div>
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-6">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight"><ShieldAlert className="text-indigo-600" size={24} /> Brigada</h2>
        <p className="text-slate-500 font-bold text-sm">Sugerir mover lotes para a brigada quando faltarem menos de X dias para vencer.</p>
        <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Antecedência para sugestão automática</label><div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 p-3 rounded-[24px]"><input type="number" min="0" className="w-24 bg-white border border-slate-200 rounded-[16px] px-3 py-3 text-xl font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" value={localSettings.brigadeAutoSuggest} onChange={e => handleInput('brigadeAutoSuggest', Number(e.target.value))} /><span className="text-slate-500 font-bold text-xs uppercase tracking-widest">dias antes do vencimento</span></div></div>
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-4">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight"><Download className="text-emerald-600" size={24} /> Backup e restauração</h2>
        <p className="text-slate-500 font-bold text-sm">Salve seus dados em JSON para recuperar em outro navegador ou celular.</p>
        <div className="grid grid-cols-2 gap-3"><button onClick={handleExportBackup} className="bg-emerald-50 border-2 border-emerald-100 text-emerald-700 rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Download size={17} /> Exportar</button><label className="bg-indigo-50 border-2 border-indigo-100 text-indigo-700 rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"><Upload size={17} /> Importar<input type="file" accept="application/json,.json" className="hidden" onChange={event => void handleImportBackup(event.target.files?.[0])} /></label></div>
      </section>

      <div className="fixed bottom-[92px] left-0 right-0 bg-[#fdfdfd]/80 backdrop-blur-md p-4 border-t-2 border-slate-100 flex gap-4 max-w-2xl mx-auto z-40">
        <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 transition-colors border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"><Save size={18} strokeWidth={2.5} /> SALVAR</button>
        <button onClick={handleReset} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-colors border-2 border-slate-100 shadow-sm active:translate-y-1"><RefreshCw size={18} strokeWidth={2.5} /> RESTAURAR PADRÃO</button>
      </div>
    </div>
  );
}

function AlertInput({ label, color, value, onChange }: { label: string; color: 'red' | 'amber' | 'indigo' | 'emerald'; value: number; onChange: (value: number) => void }) {
  const colorMap = { red: 'text-red-600 bg-red-500', amber: 'text-amber-500 bg-amber-500', indigo: 'text-indigo-500 bg-indigo-500', emerald: 'text-emerald-500 bg-emerald-500' };
  return <div className="space-y-3 bg-slate-50 p-4 rounded-[24px] border-2 border-slate-100"><label className={`text-xs font-black flex items-center gap-2 uppercase tracking-widest ${colorMap[color].split(' ')[0]}`}><div className={`w-2 h-2 rounded-full ${colorMap[color].split(' ')[1]}`}></div> Alerta {label}</label><div className="flex items-center gap-2"><input type="number" min="0" className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={value} onChange={e => onChange(Number(e.target.value))} /><span className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">dias</span></div></div>;
}
