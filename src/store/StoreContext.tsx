import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product, DiscardRecord, Settings, AppBackup } from '../types';
import { addDays, subDays } from 'date-fns';
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

const today = new Date();
const initialProducts: Product[] = [
  { id: uuidv4(), name: 'Mussarela bufala', brand: 'Bom Destino', category: 'B06 - Laticínios', barcode: '789100010001', barcodeImage: generateBarcodeImageDataUrl('789100010001'), expirationDate: addDays(today, 2).toISOString(), inBrigade: true, addedAt: subDays(today, 10).toISOString() },
  { id: uuidv4(), name: 'Presunto Parma Fatiado', brand: 'Sadia', category: 'B06 - Laticínios', barcode: '789100010002', barcodeImage: generateBarcodeImageDataUrl('789100010002'), expirationDate: addDays(today, 2).toISOString(), inBrigade: true, addedAt: subDays(today, 15).toISOString() },
  { id: uuidv4(), name: 'Manteiga tourinho pt 200g', brand: 'Tourinho', category: 'B02 - Margarina', barcode: '789100010003', barcodeImage: generateBarcodeImageDataUrl('789100010003'), expirationDate: addDays(today, 3).toISOString(), inBrigade: true, addedAt: subDays(today, 20).toISOString() },
  { id: uuidv4(), name: 'Queijo mussarela fatiado', brand: 'Piracanjuba', category: 'B06 - Laticínios', barcode: '789100010004', barcodeImage: generateBarcodeImageDataUrl('789100010004'), expirationDate: addDays(today, 3).toISOString(), inBrigade: true, addedAt: subDays(today, 5).toISOString() },
  { id: uuidv4(), name: 'Doriana Cremosa com sal', brand: 'Doriana', category: 'B02 - Margarina', barcode: '789100010005', barcodeImage: generateBarcodeImageDataUrl('789100010005'), expirationDate: addDays(today, 4).toISOString(), inBrigade: true, addedAt: subDays(today, 2).toISOString() },
  { id: uuidv4(), name: 'Iogurte Natural Integral', brand: 'Itambé', category: 'B01 - Iogurte', barcode: '7896051164609', barcodeImage: generateBarcodeImageDataUrl('7896051164609'), expirationDate: addDays(today, 10).toISOString(), inBrigade: false, addedAt: subDays(today, 10).toISOString() },
  { id: uuidv4(), name: 'Creme de Ricota', brand: 'Regina', category: 'B06 - Laticínios', barcode: '7896010400311', barcodeImage: generateBarcodeImageDataUrl('7896010400311'), expirationDate: addDays(today, 12).toISOString(), inBrigade: false, addedAt: subDays(today, 10).toISOString() },
];

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
  if (!Array.isArray(raw)) return initialProducts;
  const sanitized = raw.filter(Boolean).map((item: any): Product => {
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
  return sanitized.length ? sanitized : initialProducts;
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

  async function loadLocalFallback() {
    const indexedState = await loadLocalState();
    const fallbackState = loadFallbackState();
    const legacyProducts = safelyParse<unknown>(localStorage.getItem('products'), null);
    const legacyRecords = safelyParse<unknown>(localStorage.getItem('discardRecords'), null);
    const legacySettings = safelyParse<Partial<Settings> | null>(localStorage.getItem('settings'), null);
    const source = indexedState || fallbackState;

    if (source) {
      setProducts(sanitizeProducts(source.products));
      setDiscardRecords(sanitizeRecords(source.discardRecords));
      setSettings(sanitizeSettings(source.settings));
    } else if (legacyProducts || legacyRecords || legacySettings) {
      setProducts(sanitizeProducts(legacyProducts));
      setDiscardRecords(sanitizeRecords(legacyRecords));
      setSettings(sanitizeSettings(legacySettings));
    } else {
      setProducts(initialProducts);
      setDiscardRecords([]);
      setSettings(defaultSettings);
    }
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
        if (session && isSupabaseConfigured) await loadCloudStore(session);
        else await loadLocalFallback();
      } catch (error) {
        console.error(error);
        toast.error('Não foi possível carregar a nuvem. Usando cópia local.');
        await loadLocalFallback();
      } finally {
        setIsLoaded(true);
      }
    }
    void loadState();
  }, []);

  useEffect(() => {
    if (isLoaded) void saveLocalState({ products, discardRecords, settings });
  }, [products, discardRecords, settings, isLoaded]);

  const handleLogin = async (pin: string, storeNumber: number) => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase não configurado no ambiente do build.');
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

  if (!isLoaded && !session) {
    return <StoreLoginScreen onLogin={handleLogin} />;
  }

  if (!isLoaded) return null;

  if (!session && isSupabaseConfigured) {
    return <StoreLoginScreen onLogin={handleLogin} />;
  }

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
