import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Filter, CheckSquare, Shield, ShieldOff, Check } from 'lucide-react';
import { EditProductModal } from '../components/EditProductModal';
import { cn } from '../lib/utils';
import { Product } from '../types';
import { getDaysUntil, getExpirationLabel } from '../lib/dates';

export function Brigade() {
  const { products, settings } = useStore();
  const [tab, setTab] = useState<'in' | 'out'>('in');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const brigadeProducts = products
    .filter(product => product.inBrigade)
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));
  const outBrigadeProducts = products
    .filter(product => !product.inBrigade)
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));
  const displayList = tab === 'in' ? brigadeProducts : outBrigadeProducts;

  const checklistItems = brigadeProducts.filter(product => {
    const days = getDaysUntil(product.expirationDate);
    return days >= 0 && days <= settings.alertCritical;
  });

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = checklistItems.filter(product => checkedItems[product.id]).length;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">BRIGADA</h1>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{brigadeProducts.length} lotes listados</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">
          <Filter size={14} /> Validade
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[20px] shadow-inner">
        <button onClick={() => setTab('in')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all', tab === 'in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700')}>
          <Shield size={16} className={tab === 'in' ? 'text-indigo-600' : 'text-slate-400'} /> Na Brigada
          <span className={cn('px-2 py-0.5 rounded flex items-center justify-center', tab === 'in' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500')}>{brigadeProducts.length}</span>
        </button>
        <button onClick={() => setTab('out')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all', tab === 'out' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700')}>
          <ShieldOff size={16} className={tab === 'out' ? 'text-slate-800' : 'text-slate-400'} /> Demais
          <span className={cn('px-2 py-0.5 rounded flex items-center justify-center', tab === 'out' ? 'bg-slate-200 text-slate-800' : 'bg-transparent text-slate-500')}>{outBrigadeProducts.length}</span>
        </button>
      </div>

      {tab === 'in' && checklistItems.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3 font-black text-slate-800 tracking-tight text-xl">
              <CheckSquare className="text-orange-500" size={24} /> Checklist
              <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-xl uppercase tracking-widest mt-0.5">{checkedCount}/{checklistItems.length}</span>
            </div>
          </div>
          <div className="px-6 pb-4 text-xs text-orange-600/80 font-bold tracking-wide uppercase">Vencendo em até {settings.alertCritical} dias</div>
          <div className="p-4 space-y-2">
            {checklistItems.map(item => {
              const days = getDaysUntil(item.expirationDate);
              return (
                <div key={item.id} onClick={() => setEditingProduct(item)} className="bg-white p-4 rounded-[24px] border-2 border-orange-100 flex items-center gap-4 shadow-sm hover:bg-orange-50/50 transition-colors cursor-pointer group">
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleCheck(item.id); }} className={cn('w-6 h-6 rounded border-2 flex items-center justify-center transition-colors', checkedItems[item.id] ? 'bg-orange-500 border-orange-500' : 'border-orange-300 group-hover:border-orange-500')}>
                    {checkedItems[item.id] && <Check className="text-white" size={14} strokeWidth={3} />}
                  </button>
                  <div className={cn('flex-1 transition-all', checkedItems[item.id] ? 'opacity-50 line-through' : '')}>
                    <h4 className="font-black text-slate-800 leading-none">{item.name}</h4>
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 flex items-center gap-2">
                      {item.brand || 'Sem marca'}
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md">{getExpirationLabel(days)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 pb-8">
        {displayList.map(item => {
          const days = getDaysUntil(item.expirationDate);
          return (
            <div key={item.id} onClick={() => setEditingProduct(item)} className="bg-white p-5 rounded-[28px] border-2 border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <h4 className="font-black text-slate-800 leading-tight">{item.name}</h4>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">{item.brand || 'Sem marca'}</div>
              </div>
              <div className="text-right flex flex-col items-end min-w-[4rem]">
                <div className={cn('px-3 py-1.5 rounded-xl font-black text-sm inline-flex items-center justify-center leading-none', days < 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700')}>{getExpirationLabel(days)}</div>
                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Vence</div>
              </div>
            </div>
          );
        })}
        {displayList.length === 0 && <div className="text-center py-10 text-slate-500 font-bold bg-white rounded-[32px] border-2 border-slate-100 shadow-sm">Nenhum lote nesta aba.</div>}
      </div>

      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  );
}
