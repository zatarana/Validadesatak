import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { CheckCircle2, ClipboardCheck, RotateCcw, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../types';
import { formatPtDate, getDaysUntil, getExpirationLabel } from '../lib/dates';
import { cn } from '../lib/utils';

type CheckMap = Record<string, string>;
const KEY = 'conferenceChecks';
const today = () => new Date().toISOString().slice(0, 10);
const loadChecks = (): CheckMap => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const saveChecks = (checks: CheckMap) => localStorage.setItem(KEY, JSON.stringify(checks));
const checkedAt = (product: Product, checks: CheckMap) => checks[product.id] || product.lastCheckedAt || '';
const isCheckedToday = (product: Product, checks: CheckMap) => checkedAt(product, checks).slice(0, 10) === today();

export function Conference() {
  const { products, updateProduct, settings } = useStore();
  const [search, setSearch] = useState('');
  const [onlyPending, setOnlyPending] = useState(true);
  const [checks, setChecks] = useState<CheckMap>({});

  useEffect(() => setChecks(loadChecks()), []);

  const persist = (next: CheckMap) => { setChecks(next); saveChecks(next); };

  const orderedProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter(product => {
        const matchesSearch = !term || product.name.toLowerCase().includes(term) || product.brand.toLowerCase().includes(term) || product.category.toLowerCase().includes(term) || product.barcode.toLowerCase().includes(term);
        const matchesPending = !onlyPending || !isCheckedToday(product, checks);
        return matchesSearch && matchesPending;
      })
      .sort((a, b) => Number(isCheckedToday(a, checks)) - Number(isCheckedToday(b, checks)) || getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));
  }, [products, search, onlyPending, checks]);

  const checkedCount = products.filter(product => isCheckedToday(product, checks)).length;
  const pendingCount = Math.max(0, products.length - checkedCount);
  const progress = products.length > 0 ? Math.round((checkedCount / products.length) * 100) : 0;

  const markChecked = (product: Product) => {
    const timestamp = new Date().toISOString();
    persist({ ...checks, [product.id]: timestamp });
    updateProduct(product.id, { lastCheckedAt: timestamp });
    toast.success('Lote conferido.');
  };

  const unmarkChecked = (product: Product) => {
    const next = { ...checks };
    delete next[product.id];
    persist(next);
    updateProduct(product.id, { lastCheckedAt: undefined });
    toast.success('Conferência desfeita.');
  };

  const markAllVisible = () => {
    const timestamp = new Date().toISOString();
    const next = { ...checks };
    orderedProducts.forEach(product => { next[product.id] = timestamp; updateProduct(product.id, { lastCheckedAt: timestamp }); });
    persist(next);
    toast.success('Itens visíveis marcados como conferidos.');
  };

  const clearToday = () => {
    const next = { ...checks };
    products.forEach(product => { delete next[product.id]; if (product.lastCheckedAt?.slice(0, 10) === today()) updateProduct(product.id, { lastCheckedAt: undefined }); });
    persist(next);
    toast.success('Conferência reiniciada.');
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div className="flex items-end justify-between gap-4">
          <div><h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">CONFERÊNCIA</h1><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Inventário diário dos lotes</p></div>
          <div className="text-right"><p className="text-3xl font-black text-indigo-600 leading-none">{progress}%</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">conferido</p></div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mt-5"><div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-3"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Conferidos</p><p className="text-2xl font-black text-emerald-700">{checkedCount}</p></div>
          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3"><p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pendentes</p><p className="text-2xl font-black text-amber-700">{pendingCount}</p></div>
        </div>
      </div>

      <div className="relative"><Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar item para conferir" className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-sm" /></div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setOnlyPending(prev => !prev)} className={cn('rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest border-2', onlyPending ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-white border-slate-100 text-slate-600')}>{onlyPending ? 'Só pendentes' : 'Todos os lotes'}</button>
        <button onClick={markAllVisible} className="rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest border-2 bg-indigo-50 border-indigo-100 text-indigo-700">Conferir visíveis</button>
        <button onClick={clearToday} className="col-span-2 rounded-2xl py-4 px-3 font-black text-[10px] uppercase tracking-widest border-2 bg-white border-slate-100 text-slate-500">Reiniciar conferência do dia</button>
      </div>

      <div className="space-y-3">
        {orderedProducts.map(product => {
          const checked = isCheckedToday(product, checks);
          const time = checkedAt(product, checks);
          const days = getDaysUntil(product.expirationDate);
          return (
            <div key={product.id} className={cn('bg-white p-4 rounded-[24px] border-2 shadow-sm', checked ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100')}>
              <div className="flex justify-between gap-3">
                <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-black text-slate-900 text-lg leading-tight truncate">{product.name}</h3>{product.inBrigade && <ShieldAlert size={16} className="text-indigo-500" />}</div><p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1 truncate">{product.brand || 'Sem marca'} • {product.category}</p><div className="flex flex-wrap gap-2 mt-3"><span className="bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Vence {formatPtDate(product.expirationDate)}</span><span className={cn('px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest', days <= settings.alertCritical ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500')}>{getExpirationLabel(days)}</span><span className="bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Qtd {product.quantity ?? '-'}</span></div></div>
                <button onClick={() => checked ? unmarkChecked(product) : markChecked(product)} className={cn('shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2', checked ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 text-slate-400 border-slate-200')}>{checked ? <CheckCircle2 size={24} /> : <ClipboardCheck size={24} />}</button>
              </div>
              {checked && time && <button onClick={() => unmarkChecked(product)} className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><RotateCcw size={13} /> Desfazer conferência de {new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</button>}
            </div>
          );
        })}
        {orderedProducts.length === 0 && <div className="text-center py-10 text-slate-500 font-bold bg-white rounded-[32px] border-2 border-slate-100 shadow-sm">Nenhum lote pendente para este filtro.</div>}
      </div>
    </div>
  );
}
