import React, { useMemo, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Filter, Lightbulb, AlertTriangle, Download, Share2, Search, CalendarDays } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { exportDiscardsCsv, exportProductsCsv, printProductsReport, shareBrigadeChecklist, shareWhatsAppSummary } from '../lib/export';
import { formatPtDate } from '../lib/dates';
import { STANDARD_CATEGORIES } from '../lib/categories';
import { DiscardRecord } from '../types';

const COLORS = ['#8b5cf6', '#f97316', '#64748b', '#22c55e', '#eab308'];
const reasons: Array<DiscardRecord['reason'] | 'all'> = ['all', 'Validade', 'Avaria', 'Não informado'];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  if (!month) return 'Todos os meses';
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function Reports() {
  const { products, discardRecords, settings } = useStore();
  const [discardSearch, setDiscardSearch] = useState('');
  const [discardDate, setDiscardDate] = useState('');
  const [addedDate, setAddedDate] = useState('');
  const [reportMonth, setReportMonth] = useState(currentMonth());
  const [reasonFilter, setReasonFilter] = useState<DiscardRecord['reason'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const dynamicCategories = discardRecords.map(record => record.productCategory).filter(Boolean);
    return Array.from(new Set([...STANDARD_CATEGORIES, ...dynamicCategories]));
  }, [discardRecords]);

  const monthlyDiscards = discardRecords.filter(record => !reportMonth || record.discardedAt.slice(0, 7) === reportMonth);
  const previousMonth = useMemo(() => {
    if (!reportMonth) return '';
    const [year, month] = reportMonth.split('-').map(Number);
    return new Date(year, month - 2, 1).toISOString().slice(0, 7);
  }, [reportMonth]);
  const previousMonthDiscards = discardRecords.filter(record => previousMonth && record.discardedAt.slice(0, 7) === previousMonth);

  const totalItemsDiscarded = monthlyDiscards.reduce((sum, record) => sum + record.quantity, 0);
  const previousItemsDiscarded = previousMonthDiscards.reduce((sum, record) => sum + record.quantity, 0);
  const inBrigade = products.filter(product => product.inBrigade).length;

  const discardByReason = monthlyDiscards.reduce<Record<string, number>>((acc, record) => {
    acc[record.reason] = (acc[record.reason] || 0) + record.quantity;
    return acc;
  }, {});
  const pieData = Object.entries(discardByReason).map(([name, value]) => ({ name, value }));

  const discardByCategory = monthlyDiscards.reduce<Record<string, number>>((acc, record) => {
    const category = record.productCategory || 'Sem categoria';
    acc[category] = (acc[category] || 0) + record.quantity;
    return acc;
  }, {});
  const barData = Object.entries(discardByCategory).map(([name, descarte]) => ({ name, descarte })).sort((a, b) => b.descarte - a.descarte).slice(0, 5);

  const topProducts = useMemo(() => {
    const totals = monthlyDiscards.reduce<Record<string, { name: string; quantity: number }>>((acc, record) => {
      const key = record.productBarcode || record.productName;
      acc[key] = acc[key] || { name: record.productName, quantity: 0 };
      acc[key].quantity += record.quantity;
      return acc;
    }, {});
    return Object.values(totals).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [monthlyDiscards]);

  const addedProducts = products.filter(product => !addedDate || product.addedAt.slice(0, 10) === addedDate);
  const filteredDiscards = discardRecords.filter(record => {
    const term = discardSearch.trim().toLowerCase();
    const matchesSearch = !term || record.productName.toLowerCase().includes(term) || record.productBarcode.includes(term) || record.productBrand.toLowerCase().includes(term);
    const matchesDate = !discardDate || record.discardedAt.slice(0, 10) === discardDate;
    const matchesReason = reasonFilter === 'all' || record.reason === reasonFilter;
    const matchesCategory = categoryFilter === 'all' || record.productCategory === categoryFilter;
    const matchesMonth = !reportMonth || record.discardedAt.slice(0, 7) === reportMonth;
    return matchesSearch && matchesDate && matchesReason && matchesCategory && matchesMonth;
  });

  const dominantReason = pieData.slice().sort((a, b) => b.value - a.value)[0];
  const dominantCategory = barData[0];

  return (
    <div className="space-y-6 pb-2 w-full overflow-hidden">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">RELATÓRIOS</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">{monthLabel(reportMonth)}</p>
        </div>
        <button onClick={() => printProductsReport(products, discardRecords, settings)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800"><Filter size={14} /> PDF</button>
      </div>

      <div className="bg-white p-4 rounded-[28px] border-2 border-slate-100 shadow-sm space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mês do relatório</label>
        <input type="month" value={reportMonth} onChange={event => setReportMonth(event.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100" />
        <button onClick={() => setReportMonth('')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Ver todos os meses</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => exportProductsCsv(products)} className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-sm"><Download size={18} /> CSV produtos</button>
        <button onClick={() => exportDiscardsCsv(filteredDiscards)} className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-sm"><Download size={18} /> CSV filtrado</button>
        <button onClick={() => shareWhatsAppSummary(products, monthlyDiscards, settings)} className="bg-white border-2 border-emerald-100 rounded-2xl p-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest text-emerald-600 shadow-sm"><Share2 size={18} /> Resumo</button>
        <button onClick={() => shareBrigadeChecklist(products, settings)} className="bg-white border-2 border-indigo-100 rounded-2xl p-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest text-indigo-600 shadow-sm"><Share2 size={18} /> Brigada</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Itens Descartados" value={totalItemsDiscarded} color="red" />
        <StatCard title="Mês Anterior" value={previousItemsDiscarded} color="slate" />
        <StatCard title="Lotes na Brigada" value={inBrigade} color="indigo" />
        <StatCard title="Reg. Descarte" value={monthlyDiscards.length} color="emerald" />
        <div className="col-span-2 bg-slate-900 text-white p-6 rounded-[32px] shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-2"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Motivo Dominante</div><div className="flex items-center gap-2 text-rose-500 font-black text-xl tracking-tighter"><AlertTriangle size={24} /> {dominantReason ? dominantReason.name.toUpperCase() : 'SEM DESCARTES'}</div><p className="text-xs text-slate-300 font-bold mt-1">{dominantCategory ? `Categoria com maior perda: ${dominantCategory.name}` : 'Registre descartes para gerar análise.'}</p></div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-[40px] p-6 border-2 border-emerald-100 flex items-center gap-6 shadow-sm"><div className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-md border-4 border-emerald-100 shrink-0"><Lightbulb className="text-emerald-500" size={24} strokeWidth={2.5} /></div><div className="flex flex-col"><h4 className="text-emerald-900 font-black text-lg tracking-tight mb-1">Dica Inteligente</h4><p className="text-sm font-bold text-emerald-800/80 leading-snug">{dominantCategory ? `${dominantCategory.name} lidera os descartes do período. Confira compra, exposição e giro desse setor.` : 'Quando houver descartes, esta área mostrará onde agir primeiro.'}</p></div></div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 flex flex-col items-center"><h3 className="w-full text-left text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribuição por Motivo</h3>{pieData.length > 0 ? <><div className="h-56 w-full flex justify-center items-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">{pieData.map((entry, index) => <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR').format(value)} /></PieChart></ResponsiveContainer></div><div className="flex justify-center gap-6 w-full mt-4 flex-wrap">{pieData.map((item, index) => <div key={item.name} className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.name}</div>)}</div></> : <div className="text-center py-10 text-slate-500 font-bold bg-slate-50 rounded-[24px] w-full">Nenhum descarte registrado neste período.</div>}</div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100"><h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Top produtos descartados</h3>{topProducts.length > 0 ? <div className="space-y-3">{topProducts.map(item => <div key={item.name} className="flex justify-between gap-4 text-slate-900"><span className="font-bold truncate">{item.name}</span><span className="font-black text-red-600 shrink-0">{item.quantity} un</span></div>)}</div> : <div className="text-center py-8 text-slate-500 font-bold bg-slate-50 rounded-[24px]">Sem produtos descartados neste período.</div>}</div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100"><h3 className="text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2"><CalendarDays size={20} /> Itens adicionados por data</h3><input type="date" value={addedDate} onChange={event => setAddedDate(event.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100" /><div className="mt-4 space-y-3">{addedDate ? addedProducts.slice(0, 8).map(product => <div key={product.id} className="border-b border-slate-100 pb-3 last:border-0"><p className="font-black text-slate-800">{product.name}</p><p className="text-xs font-bold text-slate-400">{product.brand || 'Sem marca'} • vence {formatPtDate(product.expirationDate)}</p></div>) : <p className="text-slate-500 font-bold py-4">Selecione uma data para ver os itens adicionados.</p>}{addedDate && addedProducts.length === 0 && <p className="text-slate-500 font-bold py-4">Nenhum item adicionado nesta data.</p>}</div></div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 mb-8"><h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">Histórico de descartes <span className="text-slate-400">({filteredDiscards.length})</span></h3><div className="space-y-3 mb-4"><input type="date" value={discardDate} onChange={event => setDiscardDate(event.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100" /><select value={reasonFilter} onChange={event => setReasonFilter(event.target.value as DiscardRecord['reason'] | 'all')} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 font-black text-slate-700 text-xs uppercase tracking-widest"><option value="all">Todos os motivos</option>{reasons.filter(reason => reason !== 'all').map(reason => <option key={reason} value={reason}>{reason}</option>)}</select><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-5 py-4 font-black text-slate-700 text-xs uppercase tracking-widest"><option value="all">Todas as categorias</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select><div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={discardSearch} onChange={event => setDiscardSearch(event.target.value)} placeholder="Buscar por nome, marca ou código" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] pl-12 pr-5 py-4 font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div></div>{filteredDiscards.length > 0 ? <div className="space-y-4">{filteredDiscards.slice(0, 30).map(record => <div key={record.id} className="flex justify-between items-center border-b-2 border-slate-50 pb-4 last:border-0 last:pb-0"><div className="flex flex-col"><span className="font-black text-slate-800">{record.productName}</span><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{new Date(record.discardedAt).toLocaleString('pt-BR')} • {record.reason}</span><span className="text-xs font-bold text-slate-400 mt-1">{record.productBrand} • Cód: {record.productBarcode || '-'}</span></div><div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-xl font-black text-sm">-{record.quantity}</div></div>)}</div> : <div className="text-center py-8 text-slate-500 font-bold bg-slate-50 rounded-[24px]">Nenhum descarte encontrado.</div>}</div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  const colorMap: Record<string, string> = { red: 'bg-red-50 text-red-600 border-red-100/50', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50', slate: 'bg-slate-50 text-slate-800 border-slate-200/50', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50' };
  return <div className={`p-6 rounded-[32px] shadow-sm border-2 flex flex-col justify-between ${colorMap[color]}`}><p className="text-[10px] font-black uppercase tracking-[0.1em] mb-2 opacity-80">{title}</p><span className="text-4xl font-black tracking-tighter leading-none">{new Intl.NumberFormat('pt-BR').format(value)}</span></div>;
}
