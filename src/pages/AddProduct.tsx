import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Camera, ImagePlus, Search } from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { toast } from 'sonner';
import { toInputDate, toIsoFromInputDate } from '../lib/dates';
import { DEFAULT_CATEGORY, STANDARD_CATEGORIES } from '../lib/categories';
import { fileToDataUrl, lookupBarcode } from '../lib/barcodeLookup';

const initialFormData = {
  barcode: '',
  barcodeImage: '',
  name: '',
  brand: '',
  category: DEFAULT_CATEGORY,
  inBrigade: false,
  expirationDate: '',
  quantity: ''
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function AddProduct() {
  const { addProduct, updateProduct, products } = useStore();
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleBarcodeLookup = async (barcodeValue = formData.barcode) => {
    const barcode = barcodeValue.trim();
    if (!barcode) {
      toast.error('Informe ou escaneie um código de barras.');
      return;
    }

    setIsLookingUp(true);
    const result = await lookupBarcode(barcode, products);
    setIsLookingUp(false);

    if (result.source === 'not_found') {
      setFormData(prev => ({ ...prev, barcode: result.barcode || barcode }));
      toast.info('Produto não encontrado. Preencha nome e categoria manualmente.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      barcode: result.barcode,
      name: result.name || prev.name,
      brand: result.brand || prev.brand,
      category: result.category || prev.category || DEFAULT_CATEGORY,
    }));

    toast.success(result.source === 'local' ? 'Produto encontrado localmente.' : 'Produto encontrado na web.');
  };

  const handleBarcodeImage = async (file?: File) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setFormData(prev => ({ ...prev, barcodeImage: dataUrl }));
    toast.success('Imagem do código de barras anexada.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const expirationDate = formData.expirationDate;
    const quantity = Number(formData.quantity || 1);

    if (!name || !expirationDate) {
      toast.error('Preencha o nome e a data de validade.');
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      toast.error('Quantidade precisa ser zero ou maior.');
      return;
    }

    const barcode = formData.barcode.trim();
    const normalizedName = normalize(name);
    const sameProduct = products.filter(product => {
      const sameBarcode = barcode && product.barcode === barcode;
      const sameNameAndBrand = normalize(product.name) === normalizedName && normalize(product.brand || '') === normalize(formData.brand || '');
      return sameBarcode || sameNameAndBrand;
    });

    const existingSameValidity = sameProduct.find(product => toInputDate(product.expirationDate) === expirationDate);

    if (existingSameValidity) {
      updateProduct(existingSameValidity.id, {
        quantity: (existingSameValidity.quantity || 0) + quantity,
        brand: formData.brand.trim() || existingSameValidity.brand,
        category: formData.category.trim() || existingSameValidity.category,
        inBrigade: formData.inBrigade || existingSameValidity.inBrigade,
        barcodeImage: formData.barcodeImage || existingSameValidity.barcodeImage,
      });
      toast.success('Quantidade somada ao lote existente.');
    } else {
      addProduct({
        name,
        barcode,
        barcodeImage: formData.barcodeImage || undefined,
        brand: formData.brand.trim(),
        category: formData.category.trim() || DEFAULT_CATEGORY,
        inBrigade: formData.inBrigade,
        expirationDate: toIsoFromInputDate(expirationDate),
        quantity: formData.quantity ? quantity : undefined
      });
      toast.success(sameProduct.length > 0 ? 'Novo lote criado para outra validade.' : 'Produto adicionado com sucesso!');
    }

    setFormData(initialFormData);
  };

  return (
    <div className="space-y-6 pb-6 w-full">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">ADICIONAR</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Busque por código ou preencha manualmente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
        {showScanner && (
          <BarcodeScanner onScan={(result) => { setFormData(prev => ({ ...prev, barcode: result })); setShowScanner(false); toast.success('Código capturado.'); void handleBarcodeLookup(result); }} onClose={() => setShowScanner(false)} />
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Código de Barras</label>
          <button onClick={() => setShowScanner(true)} type="button" className="w-full flex items-center justify-center gap-2 bg-indigo-50 border-2 border-indigo-100 py-3 rounded-2xl font-black text-indigo-600 uppercase text-[10px] tracking-widest hover:bg-indigo-100 transition-colors"><Camera size={18} strokeWidth={2.5} /> Escanear com câmera</button>
          <div className="flex gap-2">
            <input type="text" placeholder="Digite o código" className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
            <button type="button" onClick={() => void handleBarcodeLookup()} disabled={isLookingUp} className="bg-slate-100 border-2 border-slate-200 aspect-square w-16 rounded-[20px] flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"><Search size={24} strokeWidth={2.5} /></button>
          </div>
          <p className="text-xs text-slate-400 font-bold">A busca consulta primeiro os produtos salvos localmente. Se não encontrar, tenta buscar na web.</p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Imagem do código de barras</label>
          <label className="flex items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] p-4 cursor-pointer hover:bg-slate-100 transition-colors">
            <ImagePlus size={22} className="text-indigo-600" />
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">Anexar foto do código</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={event => void handleBarcodeImage(event.target.files?.[0])} />
          </label>
          {formData.barcodeImage && <img src={formData.barcodeImage} alt="Código de barras anexado" className="w-full max-h-40 object-contain bg-slate-50 rounded-2xl border-2 border-slate-100 p-2" />}
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nome do Produto *</label>
          <input type="text" required placeholder="Ex: Leite desnatado 1L" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Marca</label>
            <input type="text" placeholder="Ex: Itambé" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categoria</label>
            <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 appearance-none transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              {STANDARD_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data de Validade *</label>
            <input type="date" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 transition-all uppercase tracking-widest" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quantidade</label>
            <input type="number" min="0" placeholder="Ex: 50" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
          </div>
        </div>

        <div className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-[24px] text-indigo-700 text-xs font-bold leading-relaxed">Lote automático: se este mesmo produto já existir com esta validade, a quantidade será somada. Se a validade for diferente, o sistema criará outro lote automaticamente.</div>

        <div className="flex items-center justify-between p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px]">
          <label className="text-xs font-black uppercase tracking-widest text-slate-700">Adicionar à Brigada</label>
          <button type="button" onClick={() => setFormData({ ...formData, inBrigade: !formData.inBrigade })} className={`w-14 h-8 rounded-full p-1 transition-colors border-2 ${formData.inBrigade ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-200 border-slate-300'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.inBrigade ? 'translate-x-6' : 'translate-x-0'}`} /></button>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-black text-[12px] uppercase tracking-widest py-5 rounded-[20px] mt-6 hover:bg-indigo-700 active:translate-y-1 shadow-xl shadow-indigo-100 border-b-4 border-indigo-800 active:border-b-0 transition-all">SALVAR PRODUTO</button>
      </form>
    </div>
  );
}
