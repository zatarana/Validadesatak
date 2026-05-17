import React from 'react';
import { useStore } from '../store/StoreContext';
import { Search, ChevronRight, AlertTriangle, Clock, Box } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export function Dashboard() {
  const { products, settings } = useStore();

  const getDaysDiff = (dateStr: string) => differenceInDays(parseISO(dateStr), new Date());

  const expiringSoon = products
    .filter(p => !p.inBrigade)
    .sort((a, b) => getDaysDiff(a.expirationDate) - getDaysDiff(b.expirationDate))
    .slice(0, 5); // top 5 suggestions

  const countStatus = (days: number, maxDays?: number) => products.filter(p => {
    const diff = getDaysDiff(p.expirationDate);
    if (maxDays !== undefined) {
      return diff <= maxDays && diff > days;
    }
    return diff <= days && diff >= 0;
  }).length;

  const expiredCount = products.filter(p => getDaysDiff(p.expirationDate) < 0).length;
  const criticalCount = countStatus(settings.alertCritical);
  const highCount = countStatus(settings.alertHigh, settings.alertCritical);
  const medCount = countStatus(settings.alertMedium, settings.alertHigh);
  const lowCount = countStatus(settings.alertLow, settings.alertMedium);

  return (
    <div className="space-y-8 flex flex-col">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{products.length} itens cadastrados</p>
        </div>
        <div className="flex bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Online
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, marca ou código"
          className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-sm flex flex-col p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-slate-900">
              <span className="w-2 h-6 bg-red-500 rounded-full"></span>Sugestões Brigada
            </h2>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.1em] mt-1">
              &le; {settings.brigadeAutoSuggest} dias pro vencimento
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {expiringSoon.map((product) => {
            const days = getDaysDiff(product.expirationDate);
            return (
              <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[28px] border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 shadow-sm font-black">
                     <AlertTriangle size={20} className={days <= 3 ? "text-red-500" : "text-amber-500"} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 leading-none">{product.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1.5">{product.brand}</p>
                  </div>
                </div>
                <div className="text-right bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center min-w-[3rem]">
                  <p className="text-red-600 font-black text-lg leading-none">{days}d</p>
                </div>
              </div>
            )
          })}
          {expiringSoon.length === 0 && (
             <div className="text-center py-6 text-slate-500 font-bold bg-slate-50 rounded-[24px]">Nenhuma sugestão no momento.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatusCard title="Vencidos" count={expiredCount} color="red" />
        <StatusCard title="Crítico" subtitle={`< ${settings.alertCritical} dias`} count={criticalCount} color="orange" />
        <StatusCard title="Alto" subtitle={`< ${settings.alertHigh} dias`} count={highCount} color="yellow" />
        <StatusCard title="Saudável" subtitle={`> ${settings.alertMedium} dias`} count={lowCount + medCount} color="green" />
      </div>
      
      <div className="bg-indigo-600 rounded-[32px] p-6 text-white flex flex-col justify-between shadow-xl shadow-indigo-100/50">
        <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Inventário Total</p>
        <div className="flex items-end justify-between">
          <span className="text-6xl font-black leading-none tracking-tighter">{products.length}</span>
          <span className="text-sm font-bold bg-white/20 px-3 py-1.5 rounded-xl italic tracking-tighter">+2 hoje</span>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, subtitle, count, color }: { title: string, subtitle?: string, count: number, color: 'red' | 'orange' | 'yellow' | 'blue' | 'green' }) {
  const colorMap = {
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-amber-50 text-amber-600 border-amber-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    blue: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className={`p-6 rounded-[32px] border-2 shadow-sm flex flex-col gap-1 ${colorMap[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.1em] opacity-80">{title}</div>
      {subtitle && <div className="text-[9px] font-bold opacity-60 uppercase">{subtitle}</div>}
      <div className="flex items-end gap-2 font-black text-4xl mt-3 tracking-tighter">
        {count}
      </div>
    </div>
  );
}
