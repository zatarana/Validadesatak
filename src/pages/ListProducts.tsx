import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Search, Camera, Filter, FileText, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { cn } from '../lib/utils';

export function ListProducts() {
  const { products, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search)) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">PRODUTOS</h1>
        <div className="flex gap-2">
           <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-700 tracking-widest hover:bg-slate-200 transition-colors">
             <Filter size={14} /> Filtros
           </button>
        </div>
      </div>

      <button onClick={() => setShowScanner(true)} className="w-full flex items-center justify-center gap-3 bg-indigo-600 border-b-4 border-indigo-800 py-4 rounded-2xl shadow-xl shadow-indigo-100 font-black text-white uppercase text-[10px] tracking-widest hover:bg-indigo-700 active:translate-y-1 active:border-b-0 transition-all">
        <Camera size={18} /> Escanear Código
      </button>

      {showScanner && (
        <BarcodeScanner 
          onScan={(result) => {
            setSearch(result);
            setShowScanner(false);
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3 pb-8">
        {filteredProducts.map(product => {
          const days = differenceInDays(parseISO(product.expirationDate), new Date());
          return (
            <div key={product.id} className="bg-white p-5 rounded-[28px] border-2 border-slate-100 shadow-sm relative group hover:bg-slate-50 transition-colors">
              <div className="pr-16">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-900 text-xl leading-tight">{product.name}</h3>
                  {product.inBrigade && <ShieldAlert size={18} className="text-indigo-500 fill-indigo-50" />}
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3 truncate">
                  {product.brand} • {product.category.split('-')[1]?.trim() || product.category}
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    VENCE {format(parseISO(product.expirationDate), 'dd/MM/yy')}
                  </div>
                </div>
              </div>
              
              <div className="absolute top-5 right-4 flex flex-col items-end gap-3">
                <div className={cn(
                    "px-3 py-1.5 rounded-xl font-black text-lg min-w-[3rem] text-center",
                    days < 0 ? "bg-red-100 text-red-600" : (days <= 3 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-700")
                )}>
                  {days}d
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <button className="hover:text-amber-500 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => {
                        if (confirm('Tem certeza que deseja excluir?')) {
                            deleteProduct(product.id)
                        }
                    }} 
                    className="hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-slate-500 font-bold bg-white rounded-[32px] border-2 border-slate-100 shadow-sm">
            Nenhum produto encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
