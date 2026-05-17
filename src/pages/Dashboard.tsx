import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Search, AlertTriangle } from 'lucide-react';
import { getDaysUntil, getExpirationLabel } from '../lib/dates';
import { ProductListFilter } from '../types/filters';
import { Product } from '../types';
import { EditProductModal } from '../components/EditProductModal';

interface DashboardProps {
  onOpenListFilter: (filter: ProductListFilter) => void;
}

export function Dashboard({ onOpenListFilter }: DashboardProps) {
  const { products, settings } = useStore();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const expiringSoon = products
    .filter(product => !product.inBrigade)
    .filter(product => getDaysUntil(product.expirationDate) <= settings.brigadeAutoSuggest)
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate))
    .slice(0, 5);

  const searchResults = search.trim()
    ? products
      .filter(product => {
        const term = search.trim().toLowerCase();
        return product.name.toLowerCase().includes(term)
          || product.brand.toLowerCase().includes(term)
          || product.category.toLowerCase().includes(term)
          || product.barcode.includes(term);
      })
      .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate))
      .slice(0, 4)
    : [];

  const expiredCount = products.filter(product => getDaysUntil(product.expirationDate) < 0).length;
  const criticalCount = products.filter(product => {
    const days = getDaysUntil(product.expirationDate);
    return days >= 0 && days <= settings.alertCritical;
  }).length;
  const attentionCount = products.filter(product => {
    const days = getDaysUntil(product.expirationDate);
    return days > settings.alertCritical && days <= settings.alertMedium;
  }).length;
  const healthyCount = products.filter(product => getDaysUntil(product.expirationDate) > settings.alertMedium).length;
  const addedToday = products.filter(product => getDaysUntil(product.addedAt) === 0).length;

  return (
    <div className="space-y-8 flex flex-col">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{products.length} itens cadastrados</p>
        </div>
        <div className="flex bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider items-center gap-2 border-2 border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Local
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400" />
        </div>
        <input type="text" placeholder="Buscar por nome, marca ou código" value={search} onChange={event => setSearch(event.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-sm" />
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white rounded-[32px] border-2 border-slate-100 shadow-sm p-4 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Resultados rápidos</p>
          {searchResults.map(product => {
            const days = getDaysUntil(product.expirationDate);
            return (
              <button key={product.id} onClick={() => setEditingProduct(product)} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-[20px] text-left hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-black text-slate-800 leading-none">{product.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1.5">{product.brand || 'Sem marca'}</p>
                </div>
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-black text-slate-700 border border-slate-200">{getExpirationLabel(days)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-sm flex flex-col p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-slate-900">
              <span className="w-2 h-6 bg-red-500 rounded-full"></span>Sugestões Brigada
            </h2>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.1em] mt-1">até {settings.brigadeAutoSuggest} dias para vencer</p>
          </div>
        </div>
        <div className="space-y-3">
          {expiringSoon.map((product) => {
            const days = getDaysUntil(product.expirationDate);
            return (
              <button key={product.id} onClick={() => setEditingProduct(product)} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-[28px] border border-slate-100 hover:bg-slate-100 transition-colors text-left">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 shadow-sm font-black shrink-0">
                    <AlertTriangle size={20} className={days <= settings.alertCritical ? 'text-red-500' : 'text-amber-500'} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 leading-none truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1.5 truncate">{product.brand || 'Sem marca'}</p>
                  </div>
                </div>
                <div className="text-right bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center min-w-[4rem]">
                  <p className="text-red-600 font-black text-sm leading-none">{getExpirationLabel(days)}</p>
                </div>
              </button>
            );
          })}
          {expiringSoon.length === 0 && <div className="text-center py-6 text-slate-500 font-bold bg-slate-50 rounded-[24px]">Nenhuma sugestão no momento.</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatusCard title="Vencidos" count={expiredCount} color="red" onClick={() => onOpenListFilter('expired')} />
        <StatusCard title="Crítico" subtitle={`até ${settings.alertCritical} dias`} count={criticalCount} color="orange" onClick={() => onOpenListFilter('critical')} />
        <StatusCard title="Atenção" subtitle={`até ${settings.alertMedium} dias`} count={attentionCount} color="yellow" onClick={() => onOpenListFilter('attention')} />
        <StatusCard title="Saudável" subtitle={`+${settings.alertMedium} dias`} count={healthyCount} color="green" onClick={() => onOpenListFilter('healthy')} />
      </div>

      <button onClick={() => onOpenListFilter('all')} className="bg-indigo-600 rounded-[32px] p-6 text-white flex flex-col justify-between shadow-xl shadow-indigo-100/50 text-left hover:bg-indigo-700 transition-colors">
        <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Inventário Total</p>
        <div className="flex items-end justify-between">
          <span className="text-6xl font-black leading-none tracking-tighter">{products.length}</span>
          <span className="text-sm font-bold bg-white/20 px-3 py-1.5 rounded-xl italic tracking-tighter">+{addedToday} hoje</span>
        </div>
      </button>

      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  );
}

function StatusCard({ title, subtitle, count, color, onClick }: { title: string, subtitle?: string, count: number, color: 'red' | 'orange' | 'yellow' | 'green', onClick: () => void }) {
  const colorMap = {
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-amber-50 text-amber-600 border-amber-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <button onClick={onClick} className={`p-6 rounded-[32px] border-2 shadow-sm flex flex-col gap-1 text-left active:scale-[0.99] transition-all ${colorMap[color]}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.1em] opacity-80">{title}</div>
      {subtitle && <div className="text-[9px] font-bold opacity-60 uppercase">{subtitle}</div>}
      <div className="flex items-end gap-2 font-black text-4xl mt-3 tracking-tighter">{count}</div>
      <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-2">Ver lista</div>
    </button>
  );
}
