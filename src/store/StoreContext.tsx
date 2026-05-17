import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product, DiscardRecord, Settings } from '../types';
import { addDays, subDays } from 'date-fns';
import { generateBarcodeImageDataUrl, normalizeBarcodeValue } from '../lib/barcodeImage';

interface StoreContextType {
  products: Product[];
  discardRecords: DiscardRecord[];
  settings: Settings;
  addProduct: (product: Omit<Product, 'id' | 'addedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  discardProduct: (productId: string, quantity: number, reason: DiscardRecord['reason']) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

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
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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

  const sanitized = raw
    .filter(Boolean)
    .map((item: any): Product => {
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
        quantity: asNumber(item.quantity ?? item.quantidade ?? item.qtd),
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [discardRecords, setDiscardRecords] = useState<DiscardRecord[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedProducts = safelyParse<unknown>(localStorage.getItem('products'), null);
    const savedRecords = safelyParse<unknown>(localStorage.getItem('discardRecords'), null);
    const savedSettings = safelyParse<Partial<Settings> | null>(localStorage.getItem('settings'), null);

    setProducts(sanitizeProducts(savedProducts));
    setDiscardRecords(sanitizeRecords(savedRecords));
    setSettings({ ...defaultSettings, ...(savedSettings || {}) });
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('products', JSON.stringify(products));
      localStorage.setItem('discardRecords', JSON.stringify(discardRecords));
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [products, discardRecords, settings, isLoaded]);

  const addProduct = (product: Omit<Product, 'id' | 'addedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      addedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, ...updates } : product)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
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
      quantity,
      reason,
      discardedAt: new Date().toISOString(),
    };

    setDiscardRecords((prev) => [newRecord, ...prev]);
    deleteProduct(productId);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  if (!isLoaded) return null;

  return (
    <StoreContext.Provider value={{ products, discardRecords, settings, addProduct, updateProduct, deleteProduct, discardProduct, updateSettings, resetSettings }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
