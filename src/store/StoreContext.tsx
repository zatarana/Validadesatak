import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product, DiscardRecord, Settings, AppBackup } from '../types';
import { generateBarcodeImageDataUrl, normalizeBarcodeValue } from '../lib/barcodeImage';
import { buildBackup, loadFallbackState, loadLocalState, saveLocalState } from '../lib/database';
import { StoreLoginScreen } from '../components/StoreLoginScreen';
import { bootstrapAdmin, deleteRemoteProduct, insertRemoteDiscard, loadRemoteState, loginStore, StoreSession, upsertRemoteProduct, upsertRemoteSettings } from '../lib/remoteDatabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';

interface StoreContextType {
  products: Product[];
  discardRecords: DiscardRecord[];
  settings: Settings;
  session: StoreSession | null;
  isCloudMode: boolean;
  addProduct: (product: Omit<Product, 'id' | 'addedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  discardProduct: (productId: string, quantity: number, reason: DiscardRecord['reason']) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  logout: () => void;
  exportBackup: () => AppBackup;
  importBackup: (backup: unknown) => void;
}

const SESSION_KEY = 'satak-io-store-session';

const defaultSettings: Settings = {
  storeName: 'Supermercado Central',
  teamName: 'Equipe Matutina',
  alertCritical: 5,
  alertHigh: 10,
  alertMedium: 15,
  alertLow: 30,
  brigadeAutoSuggest: 30,
  notificationTime: '08:00',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function safelyParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function validIso(value: unknown, fallback = new Date().toISOString()) {
  if (typeof value !== 'string') return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function sanitizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((item: any): Product => {
    const barcode = normalizeBarcodeValue(String(item.barcode || item.codigo || item.code || ''));
    return {
      id: String(item.id || uuidv4()),
      barcode,
      barcodeImage: item.barcodeImage || generateBarcodeImageDataUrl(barcode) || undefined,
      name: String(item.name || item.nome || item.productName || 'Produto sem nome'),
      brand: String(item.brand || item.marca || ''),
      category: String(item.category || item.categoria || 'Sem categoria'),
      expirationDate: validIso(item.expirationDate || item.validade || item.expiresAt || item.expiryDate),
      inBrigade: Boolean(item.inBrigade ?? item.brigade ?? item.naBrigada ?? false),
      addedAt: validIso(item.addedAt || item.createdAt || item.dataCadastro),
      batch: item.batch || item.lote ? String(item.batch || item.lote) : undefined,
    };
  });
}

function sanitizeRecords(raw: unknown): DiscardRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((item: any): DiscardRecord => ({
    id: String(item.id || uuidv4()),
    productId: String(item.productId || item.produtoId || ''),
    productName: String(item.productName || item.name || item.nome || 'Produto sem nome'),
    productBrand: String(item.productBrand || item.brand || item.marca || ''),
    productCategory: String(item.productCategory || item.category || item.categoria || 'Sem categoria'),
    productBarcode: normalizeBarcodeValue(String(item.productBarcode || item.barcode || item.codigo || '')),
    quantity: asNumber(item.quantity ?? item.quantidade ?? item.qtd) || 1,
    reason: item.reason === 'Avaria' || item.reason === 'Não informado' ? item.reason : 'Validade',
    discardedAt: validIso(item.discardedAt || item.data || item.createdAt),
  }));
}

function sanitizeSettings(raw: unknown): Settings {
  const data = typeof raw === 'object' && raw !== null ? raw as Partial<Settings> : {};
  return { ...defaultSettings, ...data };
}

function saveSession(session: StoreSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [discardRecords, setDiscardRecords] = useState<DiscardRecord[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [session, setSession] = useState<StoreSession | null>(() => safelyParse<StoreSession | null>(localStorage.getItem(SESSION_KEY), null));
  const [isLoaded, setIsLoaded] = useState(false);

  async function loadLocalCacheOnly() {
    const indexedState = await loadLocalState();
    const fallbackState = loadFallbackState();
    const source = indexedState || fallbackState;
    if (!source) return;
    setProducts(sanitizeProducts(source.products));
    setDiscardRecords(sanitizeRecords(source.discardRecords));
    setSettings(sanitizeSettings(source.settings));
  }

  async function loadCloudStore(activeSession: StoreSession) {
    const remote = await loadRemoteState(activeSession.storeId, defaultSettings);
    setProducts(sanitizeProducts(remote.products));
    setDiscardRecords(sanitizeRecords(remote.discardRecords));
    setSettings(sanitizeSettings(remote.settings));
    await saveLocalState(remote);
  }

  useEffect(() => {
    async function loadState() {
      try {
        if (!isSupabaseConfigured) {
          setSession(null);
          saveSession(null);
          setProducts([]);
          setDiscardRecords([]);
          setSettings(defaultSettings);
          return;
        }

        if (session) {
          await loadCloudStore(session);
        }
      } catch (error) {
        console.error(error);
        setSession(null);
        saveSession(null);
        setProducts([]);
        setDiscardRecords([]);
        setSettings(defaultSettings);
        toast.error('Sessão expirada ou inválida. Entre novamente.');
      } finally {
        setIsLoaded(true);
      }
    }
    void loadState();
  }, []);

  useEffect(() => {
    if (isLoaded && session) void saveLocalState({ products, discardRecords, settings });
  }, [products, discardRecords, settings, isLoaded, session]);

  const handleLogin = async (pin: string, storeNumber: number) => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase não configurado no build. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return;
    }

    try {
      let logged: StoreSession;
      try {
        logged = await loginStore(pin, storeNumber);
      } catch {
        logged = await bootstrapAdmin(pin, storeNumber);
      }
      setSession(logged);
      saveSession(logged);
      await loadCloudStore(logged);
      setIsLoaded(true);
      toast.success(`${logged.storeName} carregada.`);
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível entrar.');
      throw error;
    }
  };

  const runCloud = (operation: () => Promise<void>) => {
    if (!session || !isSupabaseConfigured) return;
    operation().catch(error => {
      console.error(error);
      toast.error('Alteração salva localmente, mas ainda não sincronizou na nuvem.');
    });
  };

  const addProduct = (product: Omit<Product, 'id' | 'addedAt'>) => {
    const newProduct: Product = { ...product, id: uuidv4(), addedAt: new Date().toISOString() };
    setProducts((prev) => [newProduct, ...prev]);
    runCloud(() => upsertRemoteProduct(newProduct, session!.storeId));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((product) => (product.id === id ? { ...product, ...updates } : product));
      const updated = next.find(product => product.id === id);
      if (updated) runCloud(() => upsertRemoteProduct(updated, session!.storeId));
      return next;
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
    runCloud(() => deleteRemoteProduct(id, session!.storeId));
  };

  const discardProduct = (productId: string, quantity: number, reason: DiscardRecord['reason']) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const newRecord: DiscardRecord = {
      id: uuidv4(),
      productId,
      productName: product.name,
      productBrand: product.brand,
      productCategory: product.category,
      productBarcode: product.barcode || '',
      quantity: Math.max(1, quantity),
      reason,
      discardedAt: new Date().toISOString(),
    };
    setDiscardRecords((prev) => [newRecord, ...prev]);
    setProducts((prev) => prev.filter((item) => item.id !== productId));
    runCloud(async () => {
      await insertRemoteDiscard(newRecord, session!.storeId);
      await deleteRemoteProduct(productId, session!.storeId);
    });
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      runCloud(() => upsertRemoteSettings(next, session!.storeId));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    runCloud(() => upsertRemoteSettings(defaultSettings, session!.storeId));
  };

  const logout = () => {
    setSession(null);
    saveSession(null);
    setProducts([]);
    setDiscardRecords([]);
    setSettings(defaultSettings);
    toast.success('Sessão encerrada.');
  };

  const exportBackup = (): AppBackup => buildBackup({ products, discardRecords, settings });

  const importBackup = (backup: unknown) => {
    const data = backup as Partial<AppBackup>;
    if (!data || data.app !== 'SATAK.IO') throw new Error('Arquivo de backup inválido.');
    const nextProducts = sanitizeProducts(data.products);
    const nextRecords = sanitizeRecords(data.discardRecords);
    const nextSettings = sanitizeSettings(data.settings);
    setProducts(nextProducts);
    setDiscardRecords(nextRecords);
    setSettings(nextSettings);
    runCloud(async () => {
      await Promise.all(nextProducts.map(product => upsertRemoteProduct(product, session!.storeId)));
      await upsertRemoteSettings(nextSettings, session!.storeId);
    });
  };

  if (!isLoaded) return <StoreLoginScreen onLogin={handleLogin} />;

  if (!session) return <StoreLoginScreen onLogin={handleLogin} />;

  return (
    <StoreContext.Provider value={{ products, discardRecords, settings, session, isCloudMode: Boolean(session && isSupabaseConfigured), addProduct, updateProduct, deleteProduct, discardProduct, updateSettings, resetSettings, logout, exportBackup, importBackup }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
