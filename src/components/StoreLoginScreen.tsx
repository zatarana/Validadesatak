import React, { useState } from 'react';
import { Building2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function StoreLoginScreen({ onLogin }: { onLogin: (pin: string, storeNumber: number) => Promise<void> }) {
  const [pin, setPin] = useState('');
  const [storeNumber, setStoreNumber] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    const parsedStore = Number(storeNumber);

    if (cleanPin.length !== 6) {
      toast.error('Digite um PIN com 6 números.');
      return;
    }

    if (!Number.isInteger(parsedStore) || parsedStore < 1 || parsedStore > 80) {
      toast.error('Digite uma loja de 1 até 80.');
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(cleanPin, parsedStore);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white border-2 border-slate-100 rounded-[36px] shadow-xl p-7 space-y-7">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <ShieldCheck size={30} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">SATAK.IO</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Entrar na loja</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PIN de acesso</label>
            <div className="relative">
              <LockKeyhole size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={pin}
                onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[22px] font-black text-slate-800 tracking-[0.35em] text-center focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Número da loja</label>
            <div className="relative">
              <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min={1}
                max={80}
                required
                value={storeNumber}
                onChange={event => setStoreNumber(event.target.value)}
                placeholder="1 até 80"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[22px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>
          </div>

          <button disabled={isLoading} className="w-full bg-indigo-600 text-white py-4 rounded-[22px] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-100 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-60">
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs font-bold text-slate-400 leading-relaxed text-center">
          Operadores veem apenas as lojas vinculadas. Admin pode entrar em qualquer loja.
        </p>
      </div>
    </div>
  );
}
