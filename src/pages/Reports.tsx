import React from 'react';
import { useStore } from '../store/StoreContext';
import { Filter, Lightbulb, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#8b5cf6', '#f97316', '#64748b', '#22c55e', '#eab308'];

export function Reports() {
  const { products, discardRecords } = useStore();

  const totalProducts = products.length;
  const inBrigade = products.filter(product => product.inBrigade).length;
  const totalItemsDiscarded = discardRecords.reduce((sum, record) => sum + record.quantity, 0);
  const discardRecordsCount = discardRecords.length;

  const discardByReason = discardRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.reason] = (acc[record.reason] || 0) + record.quantity;
    return acc;
  }, {});

  const pieData = Object.entries(discardByReason).map(([name, value]) => ({ name, value }));

  const discardByCategory = discardRecords.reduce<Record<string, number>>((acc, record) => {
    const category = record.productCategory || 'Sem categoria';
    acc[category] = (acc[category] || 0) + record.quantity;
    return acc;
  }, {});

  const barData = Object.entries(discardByCategory)
    .map(([name, descarte]) => ({ name, descarte }))
    .sort((a, b) => b.descarte - a.descarte)
    .slice(0, 5);

  const dominantReason = pieData.sort((a, b) => b.value - a.value)[0];
  const dominantPercent = dominantReason && totalItemsDiscarded > 0
    ? Math.round((dominantReason.value / totalItemsDiscarded) * 100)
    : 0;
  const dominantCategory = barData[0];

  return (
    <div className="space-y-6 pb-2 w-full overflow-hidden">
      <div className="flex justify-between items-end bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">RELATÓRIOS</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Dados reais do navegador atual</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800">
          <Filter size={14} /> Local
        </button>
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
              <AlertTriangle size={24} /> {dominantReason ? `${dominantReason.name.toUpperCase()} (${dominantPercent}%)` : 'SEM DESCARTES'}
            </div>
            <p className="text-xs text-slate-300 font-bold mt-1">
              {dominantCategory ? `Categoria com maior perda: ${dominantCategory.name}` : 'Registre descartes para gerar análise.'}
            </p>
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
            {dominantCategory
              ? `${dominantCategory.name} lidera os descartes. Confira compra, exposição e giro desse setor.`
              : 'Quando houver descartes, esta área mostrará onde agir primeiro.'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 flex flex-col items-center">
        <h3 className="w-full text-left text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribuição por Motivo</h3>
        {pieData.length > 0 ? (
          <>
            <div className="h-56 w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR').format(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 w-full mt-4 flex-wrap">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {item.name}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-500 font-bold bg-slate-50 rounded-[24px] w-full">Nenhum descarte registrado ainda.</div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Top Categorias</h3>
        {barData.length > 0 ? (
          <div className="space-y-4">
            {barData.map((item, index) => {
              const percent = totalItemsDiscarded > 0 ? (item.descarte / totalItemsDiscarded) * 100 : 0;
              return (
                <div key={item.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>{item.name.split('-')[1]?.trim() || item.name}</span>
                    <span>{item.descarte} itens</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 font-bold bg-slate-50 rounded-[24px]">Sem categorias descartadas.</div>
        )}
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
                    {new Date(record.discardedAt).toLocaleDateString('pt-BR')} • {record.reason}
                  </span>
                </div>
                <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-xl font-black text-sm">-{record.quantity}</div>
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
      <span className="text-4xl font-black tracking-tighter leading-none">{new Intl.NumberFormat('pt-BR').format(value)}</span>
    </div>
  );
}
