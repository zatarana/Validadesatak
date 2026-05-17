import React, { useMemo, useState } from 'react';
import { X, CalendarPlus, Save, Trash2, ShieldAlert, PackageCheck, History, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store/StoreContext';
import { Product, DiscardRecord } from '../types';
import { formatPtDate, toInputDate, toIsoFromInputDate } from '../lib/dates';
import { DEFAULT_CATEGORY, STANDARD_CATEGORIES } from '../lib/categories';
import { generateBarcodeImageDataUrl, normalizeBarcodeValue } from '../lib/barcodeImage';
import { validateBarcode } from '../lib/barcodeValidation';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
}

const inputClass = 'w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-bold text-slate-800 placeholder:text-slate-400 transition-all';
const reasons: DiscardRecord['reason'][] = ['Validade', 'Avaria', 'Não informado'];

export function EditProductModal({ product, onClose }: EditProductModalProps) {
  const { updateProduct, deleteProduct, discardProduct, discardRecords } = useStore();
  const categoryValue = STANDARD_CATEGORIES.includes(product.category) ? product.category : DEFAULT_CATEGORY;
  const [formData, setFormData] = useState({
    barcode: normalizeBarcodeValue(product.barcode || ''),
    name: product.name || '',
    brand: product.brand || '',
    category: categoryValue,
    inBrigade: product.inBrigade,
    expirationDate: toInputDate(product.expirationDate),
  });
  const [discardQuantity, setDiscardQuantity] = useState('1');
  const [discardReason, setDiscardReason] = useState<DiscardRecord['reason']>('Validade');

  const barcodeImage = generateBarcodeImageDataUrl(formData.barcode);
  const validation = formData.barcode ? validateBarcode(formData.barcode) : null;
  const productHistory = useMemo(() => {
    const barcode = normalizeBarcodeValue(product.barcode || '');
    return discardRecords
      .filter(record => record.productId === product.id || (barcode && normalizeBarcodeValue(record.productBarcode || '') === barcode) || record.productName.toLowerCase() === product.name.toLowerCase())
      .sort((a, b) => new Date(b.discardedAt).getTime() - new Date(a.discardedAt).getTime())
      .slice(0, 6);
  }, [discardRecords, product.id, product.barcode, product.name]);

  const totalDiscarded = productHistory.reduce((sum, record) => sum + record.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationResult = validateBarcode(formData.barcode);
    const barcode = validationResult.normalized;
    const generatedBarcodeImage = generateBarcodeImageDataUrl(barcode);

    if (!formData.name.trim() || !formData.expirationDate) {
      toast.error('Preencha nome e validade.');
      return;
    }

    if (!validationResult.isValid || !generatedBarcodeImage) {
      toast.error(validationResult.message);
      return;
    }

    updateProduct(product.id, {
      barcode,
      barcodeImage: generatedBarcodeImage,
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      category: formData.category.trim() || DEFAULT_CATEGORY,
      inBrigade: formData.inBrigade,
      expirationDate: toIsoFromInputDate(formData.expirationDate),
    });

    toast.success('Produto atualizado!');
    onClose();
  };

  const handleDiscard = () => {
    const quantity = Math.max(1, Number(discardQuantity) || 1);
    discardProduct(product.id, quantity, discardReason);
    toast.success('Descarte registrado.');
    onClose();
  };

  const handleDelete = () => {
    toast('Excluir produto?', {
      description: 'Remove o lote do controle atual sem registrar descarte.',
      action: {
        label: 'Excluir',
        onClick: () => {
          deleteProduct(product.id);
          toast.success('Produto excluído.');
          onClose();
        },
      },
      cancel: { label: 'Cancelar', onClick: () => undefined },
    });
  };

  const handleSold = () => {
    toast('Produto vendido?', {
      description: 'Remove o lote da lista sem registrar descarte, pois saiu por venda.',
      action: {
        label: 'Vendido',
        onClick: () => {
          deleteProduct(product.id);
          toast.success('Produto removido como vendido.');
          onClose();
        },
      },
      cancel: { label: 'Cancelar', onClick: () => undefined },
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl border-2 border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 flex justify-between items-center p-6 border-b-2 border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">EDITAR LOTE</h2>
            <div className="flex items-center gap-1.5 text-slate-400 mt-2"><CalendarPlus size={12} /><span className="text-[10px] font-bold uppercase tracking-widest">Adicionado em {formatPtDate(product.addedAt, 'dd/MM/yyyy')}</span></div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <Field label="Nome *"><input type="text" required className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca"><input type="text" className={inputClass} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} /></Field>
            <Field label="Categoria"><select className={inputClass} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{STANDARD_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select></Field>
          </div>

          <Field label="Código de barras *">
            <input type="text" required className={inputClass} value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: normalizeBarcodeValue(e.target.value) })} />
            {validation && <p className={`text-xs font-bold mt-2 ${validation.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>{validation.message}</p>}
          </Field>

          {barcodeImage ? <Field label="Imagem gerada do código de barras"><img src={barcodeImage} alt="Código de barras gerado" className="w-full max-h-40 object-contain bg-white rounded-2xl border-2 border-slate-100 p-3" /></Field> : <div className="bg-rose-50 border-2 border-rose-100 rounded-[24px] p-4 text-rose-700 text-xs font-bold leading-relaxed">Informe o código de barras para o app gerar a imagem automaticamente.</div>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de validade *"><input type="date" required className={`${inputClass} uppercase tracking-widest`} value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} /></Field>
            <Field label="Na Brigada?"><button type="button" onClick={() => setFormData({ ...formData, inBrigade: !formData.inBrigade })} className={`w-full flex justify-center items-center gap-2 py-3 rounded-[20px] font-black uppercase tracking-widest text-[10px] transition-colors border-2 ${formData.inBrigade ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}><ShieldAlert size={16} />{formData.inBrigade ? 'SIM' : 'NÃO'}</button></Field>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-100 rounded-[24px] p-4 text-indigo-700 text-xs font-bold leading-relaxed">Quantidade não é controlada no cadastro. Informe quantidade apenas ao registrar descarte.</div>

          <div className="bg-rose-50 border-2 border-rose-100 rounded-[28px] p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-black uppercase tracking-widest text-[10px]"><PackageCheck size={16} /> Dar baixa / descarte</div>
            <div className="grid grid-cols-2 gap-3"><input type="number" min="1" className={`${inputClass} bg-white`} value={discardQuantity} onChange={e => setDiscardQuantity(e.target.value)} placeholder="Qtd" /><select className={`${inputClass} bg-white`} value={discardReason} onChange={e => setDiscardReason(e.target.value as DiscardRecord['reason'])}>{reasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}</select></div>
            <p className="text-xs font-bold text-rose-700/80">Use esta área somente para produtos descartados por validade, avaria ou motivo não informado.</p>
            <button type="button" onClick={handleDiscard} className="w-full py-3 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition-colors">Registrar descarte</button>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[28px] p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-black uppercase tracking-widest text-[10px]"><ShoppingCart size={16} /> Produto vendido</div>
            <p className="text-xs font-bold text-emerald-700/80">Use quando o item saiu da lista porque foi vendido. Não registra descarte.</p>
            <button type="button" onClick={handleSold} className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-colors">Remover como vendido</button>
          </div>

          <div className="bg-slate-50 border-2 border-slate-100 rounded-[28px] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-700 font-black uppercase tracking-widest text-[10px]"><History size={16} /> Histórico</div>
              <span className="bg-white border border-slate-200 text-slate-600 rounded-xl px-2 py-1 text-[10px] font-black">{totalDiscarded} un desc.</span>
            </div>
            {productHistory.length > 0 ? productHistory.map(record => (
              <div key={record.id} className="flex justify-between gap-3 border-t border-slate-200/70 pt-3 first:border-t-0 first:pt-0">
                <div>
                  <p className="font-black text-slate-800 text-sm">{record.reason}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(record.discardedAt).toLocaleString('pt-BR')}</p>
                </div>
                <span className="font-black text-rose-600 text-sm shrink-0">-{record.quantity}</span>
              </div>
            )) : <p className="text-xs font-bold text-slate-400">Nenhum descarte registrado para este produto.</p>}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3 pt-1">
            <button type="submit" className="w-full bg-indigo-600 text-white font-black text-[12px] uppercase tracking-widest py-4 rounded-[20px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2"><Save size={18} /> Salvar alterações</button>
            <button type="button" onClick={handleDelete} className="w-14 rounded-[20px] bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"><Trash2 size={20} /></button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</label>{children}</div>;
}
