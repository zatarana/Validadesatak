import React, { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Store, Bell, Clock, ShieldAlert, Save, RefreshCw } from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSettings } = useStore();
  
  // Local state for editing before saving
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    alert('Configurações salvas!');
  };

  const handleInput = (key: keyof typeof settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 mb-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">CONFIGS</h1>
      </div>

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-6">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
          <Store className="text-indigo-600" size={24} /> Identificação
        </h2>
        
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome da Loja</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 transition-all font-sans"
            value={localSettings.storeName}
            onChange={e => handleInput('storeName', e.target.value)}
          />
        </div>
        
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome da Equipe</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 transition-all font-sans"
            value={localSettings.teamName}
            onChange={e => handleInput('teamName', e.target.value)}
          />
        </div>
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-6">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
          <Bell className="text-rose-500" size={24} /> Alertas de Validade
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3 bg-slate-50 p-4 rounded-[24px] border-2 border-slate-100">
            <label className="text-xs font-black text-red-600 flex items-center gap-2 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Crítico
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={localSettings.alertCritical}
                onChange={e => handleInput('alertCritical', Number(e.target.value))}
              />
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">dias</span>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-[24px] border-2 border-slate-100">
            <label className="text-xs font-black text-amber-500 flex items-center gap-2 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Alto
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={localSettings.alertHigh}
                onChange={e => handleInput('alertHigh', Number(e.target.value))}
              />
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">dias</span>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-[24px] border-2 border-slate-100">
            <label className="text-xs font-black text-indigo-500 flex items-center gap-2 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Médio
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={localSettings.alertMedium}
                onChange={e => handleInput('alertMedium', Number(e.target.value))}
              />
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">dias</span>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-[24px] border-2 border-slate-100">
            <label className="text-xs font-black text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Baixo
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-2 text-center text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={localSettings.alertLow}
                onChange={e => handleInput('alertLow', Number(e.target.value))}
              />
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">dias</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100 space-y-6">
        <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
          <ShieldAlert className="text-indigo-600" size={24} /> Brigada
        </h2>
        
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Automação de Sugestão</label>
          <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 p-3 rounded-[24px]">
              <input 
                type="number" 
                className="w-20 bg-white border border-slate-200 rounded-[16px] px-3 py-3 text-xl font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={localSettings.brigadeAutoSuggest}
                onChange={e => handleInput('brigadeAutoSuggest', Number(e.target.value))}
              />
              <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Dias Restantes</span>
          </div>
        </div>
      </section>

      <div className="fixed bottom-[92px] left-0 right-0 bg-[#fdfdfd]/80 backdrop-blur-md p-4 border-t-2 border-slate-100 flex gap-4 max-w-2xl mx-auto z-40">
        <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 transition-colors border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1">
            <Save size={18} strokeWidth={2.5} /> SALVAR
        </button>
        <button onClick={() => setLocalSettings(settings)} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-colors border-2 border-slate-100 shadow-sm active:translate-y-1">
            <RefreshCw size={18} strokeWidth={2.5} /> DESFAZER
        </button>
      </div>

    </div>
  );
}
