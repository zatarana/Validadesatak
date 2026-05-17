import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { X, CalendarPlus, Info } from 'lucide-react';
import { Product } from '../types';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
}

export function EditProductModal({ product, onClose }: EditProductModalProps) {
  const { updateProduct } = useStore();
  const [formData, setFormData] = useState({
    barcode: product.barcode || '',
    name: product.name,
    brand: product.brand || '',
    category: product.category || '',
    inBrigade: product.inBrigade,
    expirationDate: product.expirationDate.split('T')[0], // rough format back to yyyy-MM-dd
    batch: product.batch || '',
    quantity: product.quantity || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expirationDate) {
      toast.error('Preencha os campos obrigatórios!');
      return;
    }
    
    updateProduct(product.id, {
      ...formData,
      expirationDate: new Date(formData.expirationDate).toISOString(),
      quantity: formData.quantity ? Number(formData.quantity) : undefined
    });
    
    toast.success('Produto atualizado!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[40px] p-6 shadow-2xl animate-in slide-in-from-bottom motion-reduce:animate-none">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">EDITAR</h2>
            <div className="flex items-center gap-1.5 text-slate-400 mt-1">
              <CalendarPlus size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Adicionado em {format(parseISO(product.addedAt), 'dd/MM/yyyy')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome *</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data de Validade *</label>
              <input 
                type="date"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 uppercase tracking-widest"
                value={formData.expirationDate}
                onChange={e => setFormData({...formData, expirationDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lote</label>
              <input 
                type="text"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 uppercase tracking-widest"
                value={formData.batch}
                onChange={e => setFormData({...formData, batch: e.target.value})}
                placeholder="Lote"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quantidade</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                placeholder="Qtd"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Na Brigada?</label>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, inBrigade: !formData.inBrigade})}
                className={`w-full flex justify-center py-3 rounded-[20px] font-black uppercase tracking-widest text-[10px] transition-colors border-2 ${formData.inBrigade ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
              >
                {formData.inBrigade ? 'SIM' : 'NÃO'}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-black text-[12px] uppercase tracking-widest py-4 rounded-[20px] mt-4 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0">
            SALVAR ALTERAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}
