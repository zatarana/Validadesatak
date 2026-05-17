import React, { useState } from 'react';
import { StoreProvider } from './store/StoreContext';
import { ScanBarcode, Bell, LayoutDashboard, PlusSquare, List as ListIcon, ShieldAlert, BarChart3, Settings } from 'lucide-react';
import { cn } from './lib/utils';
import { Dashboard } from './pages/Dashboard';
import { AddProduct } from './pages/AddProduct';
import { ListProducts } from './pages/ListProducts';
import { Brigade } from './pages/Brigade';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { Toaster } from 'sonner';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Adicionar', icon: PlusSquare },
    { id: 'list', label: 'Listas', icon: ListIcon },
    { id: 'brigade', label: 'Brigada', icon: ShieldAlert },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfdfd] text-slate-900 font-sans pb-20 selection:bg-indigo-100">
      <Toaster position="top-center" richColors />
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">SATAK.IO</span>
            <span className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.3em] leading-none mt-1">Gestão de Validades</span>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="text-right hidden sm:flex flex-col mr-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
            <p className="text-emerald-500 font-bold text-xs uppercase leading-none mt-1 mt-1">Sincronizado</p>
          </div>
          <div className="relative bg-slate-50 p-2 rounded-xl border border-slate-100">
             <Bell size={20} className="text-slate-600" />
             <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">2</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 relative gap-6 flex flex-col">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'add' && <AddProduct />}
        {activeTab === 'list' && <ListProducts />}
        {activeTab === 'brigade' && <Brigade />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'config' && <SettingsPage />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-100 safe-area-bottom z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center max-w-2xl mx-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-3 gap-1 rounded-2xl transition-all",
                  isActive ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[9px] uppercase tracking-widest font-black transition-colors mt-0.5", isActive ? "text-indigo-600" : "text-slate-400")}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
      
      {/* Floating Action Button */}
      {(activeTab === 'dashboard' || activeTab === 'list' || activeTab === 'brigade' || activeTab === 'reports') && (
        <button onClick={() => setActiveTab('add')} className="fixed bottom-28 right-6 bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 flex items-center justify-center rounded-2xl shadow-xl shadow-indigo-100 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all z-40">
           <ScanBarcode size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
