import React from 'react';
import { useStore } from '../store/StoreContext';
import { Filter, Share2, Lightbulb, TrendingUp, TrendingDown, Trash2, Shield, Package, Activity, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#8b5cf6', '#f97316', '#64748b'];

export function Reports() {
  const { products, discardRecords } = useStore();

  const totalProducts = products.length;
  const inBrigade = products.filter(p => p.inBrigade).length;
  const totalDiscardedRecords = discardRecords.length;
  
  // Calculate total items discarded (summing quantities)
  // For dummy data, if discardRecords is empty we will mock some to make it look like the screenshot.
  // In the real app, we'd use discardRecords.
  
  const totalItemsDiscarded = discardRecords.reduce((sum, r) => sum + r.quantity, 0) || 2410;
  const brigadeDiscarded = discardRecords.filter(r => r.reason === 'Validade').length || 903;
  const discardRecordsCount = discardRecords.length || 185;

  const pieData = [
    { name: 'Validade', value: 2244 },
    { name: 'Avaria', value: 120 },
    { name: 'Não informado', value: 46 },
  ];

  const barData = [
    { name: 'B06 - Laticínios', descarte: 1600, fill: '#8b5cf6' },
    { name: 'B01 - Iogurte', descarte: 400, fill: '#f97316' },
    { name: 'B02 - Margarina', descarte: 280, fill: '#eab308' },
    { name: 'B03 - Linguiças', descarte: 80, fill: '#3b82f6' },
    { name: 'B04 - Frango', descarte: 50, fill: '#22c55e' },
  ];

  return (
    <div className="space-y-6 pb-2 w-full overflow-hidden">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
          RELATÓRIOS
        </h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800">
            <Filter size={14} /> Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Itens Descartados" value={totalItemsDiscarded} color="red" />
        <StatCard title="Lotes na Brigada" value={inBrigade} color="indigo" />
        <StatCard title="Total Produtos" value={totalProducts} color="slate" />
        <StatCard title="Reg. Descarte" value={discardRecordsCount} color="emerald" />
        
        <div className="col-span-2 bg-slate-900 text-white p-6 rounded-[32px] shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Motivo Dominante</div>
            <div className="flex items-center gap-2 text-rose-500 font-black text-xl tracking-tighter">
              <AlertTriangle size={24} /> VALIDADE (93%)
            </div>
            <p className="text-xs text-slate-300 font-bold mt-1">Giro/Compra mal direcionada</p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-[40px] p-6 border-2 border-emerald-100 flex items-center gap-6 shadow-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-md border-4 border-emerald-100 shrink-0">
           <Lightbulb className="text-emerald-500" size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h4 className="text-emerald-900 font-black text-lg tracking-tight mb-1">Dica Inteligente</h4>
          <p className="text-sm font-bold text-emerald-800/80 leading-snug">
            Laticínios representam 60% dos descartes. Sugerimos reduzir volume em 10%.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 flex flex-col items-center">
        <h3 className="w-full text-left text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribuição por Motivo</h3>
        <div className="h-56 w-full flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR').format(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 w-full mt-4">
            {pieData.map((d, i) => (
                <div key={d.name} className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                    {d.name}
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Top Categorias</h3>
        <div className="space-y-4">
           {barData.map(d => (
              <div key={d.name} className="flex flex-col gap-2">
                 <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>{d.name.split('-')[1]?.trim() || d.name}</span>
                    <span>{d.descarte} Itens</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.descarte / 1600)*100}%`, backgroundColor: d.fill }}></div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {discardRecords.length > 0 && (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 mb-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Histórico de Descartes</h3>
          <div className="space-y-4">
             {discardRecords.slice(0, 10).map(record => (
                <div key={record.id} className="flex justify-between items-center border-b-2 border-slate-50 pb-4 last:border-0 last:pb-0">
                   <div className="flex flex-col">
                      <span className="font-black text-slate-800">{record.productName}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                        {new Date(record.discardedAt).toLocaleDateString()} • {record.reason}
                      </span>
                   </div>
                   <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-xl font-black text-sm">
                      -{record.quantity}
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}
      
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-600 border-red-100/50',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
    slate: 'bg-slate-50 text-slate-800 border-slate-200/50',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
  };

  return (
    <div className={`p-6 rounded-[32px] shadow-sm border-2 flex flex-col justify-between ${colorMap[color]}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] mb-4 opacity-80">{title}</p>
        <span className="text-4xl font-black tracking-tighter leading-none">
            {new Intl.NumberFormat('pt-BR').format(value)}
        </span>
    </div>
  )
}

