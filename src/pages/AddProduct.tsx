import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Camera, Search } from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { toast } from 'sonner';
import { toIsoFromInputDate } from '../lib/dates';

const initialFormData = {
  barcode: '',
  name: '',
  brand: '',
  category: '',
  inBrigade: false,
  expirationDate: '',
  batch: '',
  quantity: ''
};

export function AddProduct() {
  const { addProduct, products } = useStore();
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const expirationDate = formData.expirationDate;
    const quantity = Number(formData.quantity);

    if (!name || !expirationDate) {
      toast.error('Preencha o nome e a data de validade.');
      return;
    }

    if (formData.quantity && (!Number.isFinite(quantity) || quantity < 0)) {
      toast.error('Quantidade precisa ser zero ou maior.');
      return;
    }

    const duplicatedBatch = products.some(product =>
      product.barcode &&
      formData.barcode &&
      product.barcode === formData.barcode.trim() &&
      product.batch &&
      formData.batch &&
      product.batch.toLowerCase() === formData.batch.trim().toLowerCase()
    );

    if (duplicatedBatch) {
      toast.error('Já existe um lote com esse código e lote cadastrado.');
      return;
    }

    addProduct({
      name,
      barcode: formData.barcode.trim(),
      brand: formData.brand.trim(),
      category: formData.category.trim() || 'Sem categoria',
      inBrigade: formData.inBrigade,
      expirationDate: toIsoFromInputDate(expirationDate),
      batch: formData.batch.trim(),
      quantity: formData.quantity ? quantity : undefined
    });

    setFormData(initialFormData);
    toast.success('Produto adicionado com sucesso!');
  };

  return (
    <div className="space-y-6 pb-6 w-full">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">ADICIONAR</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Cadastre lote, validade e quantidade</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
        {showScanner && (
          <BarcodeScanner
            onScan={(result) => {
              setFormData({ ...formData, barcode: result });
              setShowScanner(false);
              toast.success('Código capturado.');
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Código de Barras</label>
          <button onClick={() => setShowScanner(true)} type="button" className="w-full flex items-center justify-center gap-2 bg-indigo-50 border-2 border-indigo-100 py-3 rounded-2xl font-black text-indigo-600 uppercase text-[10px] tracking-widest hover:bg-indigo-100 transition-colors">
            <Camera size={18} strokeWidth={2.5} /> Escanear com câmera
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite o código"
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all"
              value={formData.barcode}
              onChange={e => setFormData({ ...formData, barcode: e.target.value })}
            />
            <button type="button" onClick={() => toast.info('Busca automática por código ainda não configurada.')} className="bg-slate-100 border-2 border-slate-200 aspect-square w-16 rounded-[20px] flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <Search size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome do Produto *</label>
          <input
            type="text"
            required
            placeholder="Ex: Leite desnatado 1L"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Marca</label>
            <input
              type="text"
              placeholder="Ex: Itambé"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all"
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categoria</label>
            <select
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NDEwOGIiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-[position:right_1.25rem_center] transition-all"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Sem categoria</option>
              <option value="B01 - Iogurte">Iogurte</option>
              <option value="B02 - Margarina">Margarina</option>
              <option value="B06 - Laticínios">Laticínios</option>
              <option value="B03 - Linguiças">Linguiças</option>
              <option value="B04 - Frango">Frango</option>
              <option value="B05 - Congelados">Congelados</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data de Validade *</label>
            <input
              type="date"
              required
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 transition-all uppercase tracking-widest"
              value={formData.expirationDate}
              onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lote</label>
            <input
              type="text"
              placeholder="Ex: L-1234"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all uppercase tracking-widest"
              value={formData.batch}
              onChange={e => setFormData({ ...formData, batch: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quantidade</label>
          <input
            type="number"
            min="0"
            placeholder="Ex: 50"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all"
            value={formData.quantity}
            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px]">
          <label className="text-xs font-black uppercase tracking-widest text-slate-700">Adicionar à Brigada</label>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, inBrigade: !formData.inBrigade })}
            className={`w-14 h-8 rounded-full p-1 transition-colors border-2 ${formData.inBrigade ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-200 border-slate-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.inBrigade ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-black text-[12px] uppercase tracking-widest py-5 rounded-[20px] mt-6 hover:bg-indigo-700 active:translate-y-1 shadow-xl shadow-indigo-100 border-b-4 border-indigo-800 active:border-b-0 transition-all">
          SALVAR PRODUTO
        </button>
      </form>
    </div>
  );
}
