import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Search, Camera, Filter, Trash2, ShieldAlert, X } from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { EditProductModal } from '../components/EditProductModal';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Product } from '../types';
import { ProductListFilter, productListFilterLabels } from '../types/filters';
import { formatPtDate, getDaysUntil, getExpirationLabel } from '../lib/dates';
import { STANDARD_CATEGORIES } from '../lib/categories';

interface ListProductsProps {
  initialFilter?: ProductListFilter;
  onFilterChange?: (filter: ProductListFilter) => void;
}

export function ListProducts({ initialFilter = 'all', onFilterChange }: ListProductsProps) {
  const { products, deleteProduct, settings } = useStore();
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [filter, setFilter] = useState<ProductListFilter>(initialFilter);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const categories = useMemo(() => {
    const dynamicCategories = products.map(product => product.category).filter(Boolean);
    return Array.from(new Set([...STANDARD_CATEGORIES, ...dynamicCategories]));
  }, [products]);

  const applyFilter = (nextFilter: ProductListFilter) => {
    setFilter(nextFilter);
    onFilterChange?.(nextFilter);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    applyFilter('all');
  };

  const filteredProducts = products
    .filter(product => {
      const term = search.trim().toLowerCase();
      const days = getDaysUntil(product.expirationDate);
      const matchesSearch = !term
        || product.name.toLowerCase().includes(term)
        || product.brand.toLowerCase().includes(term)
        || product.category.toLowerCase().includes(term)
        || product.barcode.includes(term);

      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = filter === 'all'
        || (filter === 'expired' && days < 0)
        || (filter === 'critical' && days >= 0 && days <= settings.alertCritical)
        || (filter === 'attention' && days > settings.alertCritical && days <= settings.alertMedium)
        || (filter === 'healthy' && days > settings.alertMedium);

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));

  const hasFilters = filter !== 'all' || categoryFilter !== 'all' || search.trim().length > 0;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">PRODUTOS</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">{filteredProducts.length} de {products.length} lotes</p>
        </div>
        <button onClick={hasFilters ? clearFilters : () => toast.info('Use os filtros abaixo para refinar a lista.')} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-700 tracking-widest hover:bg-slate-200 transition-colors">
          {hasFilters ? <X size={14} /> : <Filter size={14} />} {hasFilters ? 'Limpar' : 'Filtros'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(productListFilterLabels) as ProductListFilter[]).map(item => (
          <button key={item} onClick={() => applyFilter(item)} className={cn('px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap transition-all', filter === item ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-100')}>
            {productListFilterLabels[item]}
          </button>
        ))}
      </div>

      <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-black text-slate-700 text-xs uppercase tracking-widest shadow-sm">
        <option value="all">Todas as categorias</option>
        {categories.map(category => <option key={category} value={category}>{category}</option>)}
      </select>

      <button onClick={() => setShowScanner(true)} className="w-full flex items-center justify-center gap-3 bg-indigo-600 border-b-4 border-indigo-800 py-4 rounded-2xl shadow-xl shadow-indigo-100 font-black text-white uppercase text-[10px] tracking-widest hover:bg-indigo-700 active:translate-y-1 active:border-b-0 transition-all">
        <Camera size={18} /> Escanear Código
      </button>

      {showScanner && <BarcodeScanner onScan={(result) => { setSearch(result); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="h-6 w-6 text-slate-400" /></div>
        <input type="text" placeholder="Buscar nome, marca, código ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-sm" />
      </div>

      <div className="space-y-3 pb-8">
        {filteredProducts.map(product => {
          const days = getDaysUntil(product.expirationDate);
          return (
            <div key={product.id} onClick={() => setEditingProduct(product)} className="bg-white p-5 rounded-[28px] border-2 border-slate-100 shadow-sm relative group hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="pr-16">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-900 text-xl leading-tight">{product.name}</h3>
                  {product.inBrigade && <ShieldAlert size={18} className="text-indigo-500 fill-indigo-50" />}
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3 truncate">
                  {(product.brand || 'Sem marca')} • {product.category.split('-')[1]?.trim() || product.category || 'Sem categoria'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">VENCE {formatPtDate(product.expirationDate)}</div>
                  <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">LOTE AUTO</div>
                  {product.quantity !== undefined && <div className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">QTD {product.quantity}</div>}
                </div>
              </div>
              <div className="absolute top-5 right-4 flex flex-col items-end gap-3" onClick={e => e.stopPropagation()}>
                <div className={cn('px-3 py-1.5 rounded-xl font-black text-sm min-w-[4rem] text-center', days < 0 ? 'bg-red-100 text-red-600' : (days <= settings.alertCritical ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-700'))}>{getExpirationLabel(days)}</div>
                <button onClick={(e) => { e.stopPropagation(); toast('Confirmar exclusão?', { action: { label: 'Excluir', onClick: () => { deleteProduct(product.id); toast.success('Excluído'); } }, cancel: { label: 'Cancelar', onClick: () => undefined } }); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && <div className="text-center py-10 text-slate-500 font-bold bg-white rounded-[32px] border-2 border-slate-100 shadow-sm">Nenhum produto encontrado para este filtro.</div>}
      </div>

      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  );
}
