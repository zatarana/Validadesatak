import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Filter, FileText, CheckSquare, Shield, ShieldOff, ChevronUp } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { cn } from '../lib/utils';

export function Brigade() {
  const { products } = useStore();
  const [tab, setTab] = useState<'in' | 'out'>('in');

  const brigadeProducts = products.filter(p => p.inBrigade);
  const outBrigadeProducts = products.filter(p => !p.inBrigade);

  const displayList = tab === 'in' ? brigadeProducts : outBrigadeProducts;

  // Let's assume checklist contains items that are < 3 days.
  const checklistItems = brigadeProducts.filter(p => {
    const days = differenceInDays(parseISO(p.expirationDate), new Date());
    return days <= 3 && days >= 0;
  });

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            BRIGADA
          </h1>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{brigadeProducts.length} lotes listados</p>
        </div>
        <div className="flex gap-2 text-sm mt-2">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
            <Filter size={14} /> Filtro
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[20px] shadow-inner">
        <button 
          onClick={() => setTab('in')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all",
            tab === 'in' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
          )}
        >
          <Shield size={16} className={tab === 'in' ? "text-indigo-600" : "text-slate-400"} /> Na Brigada
          <span className={cn("px-2 py-0.5 rounded flex items-center justify-center", tab === 'in' ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500")}>
            {brigadeProducts.length}
          </span>
        </button>
        <button 
          onClick={() => setTab('out')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all",
            tab === 'out' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
          )}
        >
          <ShieldOff size={16} className={tab === 'out' ? "text-slate-800" : "text-slate-400"} /> Demais
          <span className={cn("px-2 py-0.5 rounded flex items-center justify-center", tab === 'out' ? "bg-slate-200 text-slate-800" : "bg-transparent text-slate-500")}>
            {outBrigadeProducts.length}
          </span>
        </button>
      </div>

      {tab === 'in' && checklistItems.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3 font-black text-slate-800 tracking-tight text-xl">
              <CheckSquare className="text-orange-500" size={24} />
              Checklist 
              <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-xl uppercase tracking-widest mt-0.5">0/{checklistItems.length}</span>
            </div>
          </div>
          <div className="px-6 pb-4 text-xs text-orange-600/80 font-bold tracking-wide uppercase">
            Vencendo nos próximos 3 dias
          </div>
          <div className="p-4 space-y-2">
            {checklistItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-[24px] border-2 border-orange-100 flex items-center gap-4 shadow-sm hover:bg-orange-50/50 transition-colors cursor-pointer group">
                <div className="w-6 h-6 rounded border-2 border-orange-300 flex items-center justify-center group-hover:border-orange-500 transition-colors"></div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-800 leading-none">{item.name}</h4>
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 flex items-center gap-2">
                    {item.brand}
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md">
                      {differenceInDays(parseISO(item.expirationDate), new Date())}d
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 pb-8">
        {displayList.map(item => {
           const days = differenceInDays(parseISO(item.expirationDate), new Date());
           return (
            <div key={item.id} className="bg-white p-5 rounded-[28px] border-2 border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <h4 className="font-black text-slate-800 leading-tight">{item.name}</h4>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">
                  {item.brand}
                </div>
              </div>
              <div className="text-right flex flex-col items-end min-w-[3rem]">
                 <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-black text-lg inline-flex items-center justify-center leading-none">
                  {days}d
                 </div>
                 <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Vence</div>
              </div>
            </div>
           )
        })}
      </div>
    </div>
  );
}
