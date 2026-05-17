import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro capturado pela interface:', error, info);
  }

  private clearLocalData = () => {
    localStorage.removeItem('products');
    localStorage.removeItem('discardRecords');
    localStorage.removeItem('settings');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white border-2 border-slate-100 rounded-[28px] p-6 max-w-md w-full shadow-sm space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Falha na interface</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Não foi possível carregar o app</h1>
          </div>
          <p className="text-sm font-bold text-slate-500 leading-relaxed">
            Isso pode acontecer quando dados antigos salvos no navegador ficam incompatíveis com uma versão nova do app.
          </p>
          {this.state.message && <pre className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-500 whitespace-pre-wrap overflow-auto max-h-36">{this.state.message}</pre>}
          <div className="grid gap-3">
            <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-2xl">
              Tentar novamente
            </button>
            <button onClick={this.clearLocalData} className="w-full bg-white text-red-600 border-2 border-red-100 font-black text-[11px] uppercase tracking-widest py-3 rounded-2xl">
              Limpar dados locais e reiniciar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
