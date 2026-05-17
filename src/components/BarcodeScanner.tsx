import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            onScan(decodedText);
          }).catch(err => {
            console.error(err);
            onScan(decodedText);
          });
        }
      },
      (errorMessage) => {
        // Only log specific errors if needed. Frequent parse errors are expected when scanning.
      }
    ).catch(err => {
      console.error(err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col pt-12 p-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-t-3xl shadow-lg border-2 border-slate-100 max-w-lg mx-auto w-full">
        <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Escanear Código de Barras</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 bg-slate-100 p-2 rounded-full transition-colors">
          <X size={20} className="w-5 h-5"/>
        </button>
      </div>

      <div className="bg-white p-6 max-w-lg mx-auto w-full rounded-b-3xl border-2 border-t-0 border-slate-100 shadow-xl flex flex-col justify-center items-center h-[70vh]">
        {error ? (
           <div className="text-red-500 font-bold text-center px-4">
             {error}
           </div>
        ) : (
          <div className="w-full relative rounded-2xl overflow-hidden border-4 border-indigo-100">
             <div id="reader" className="w-full"></div>
          </div>
        )}
        <p className="text-slate-500 font-bold text-xs mt-6 text-center">Posicione a linha do código de barras dentro da área demarcada.</p>
      </div>
    </div>
  );
}
