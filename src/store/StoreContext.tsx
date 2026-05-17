import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product, DiscardRecord, Settings } from '../types';
import { addDays, subDays } from 'date-fns';

interface StoreContextType {
  products: Product[];
  discardRecords: DiscardRecord[];
  settings: Settings;
  addProduct: (product: Omit<Product, 'id' | 'addedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  discardProduct: (productId: string, quantity: number, reason: DiscardRecord['reason']) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  storeName: 'Supermercado Central',
  teamName: 'Equipe Matutina',
  alertCritical: 5,
  alertHigh: 10,
  alertMedium: 15,
  alertLow: 30,
  brigadeAutoSuggest: 30,
};

// Generate some initial mock data to match screenshots feeling
const today = new Date();
const initialProducts: Product[] = [
  { id: uuidv4(), name: 'Mussarela bufala', brand: 'Bom Destino', category: 'B06 - Laticínios', barcode: '789100010001', expirationDate: addDays(today, 2).toISOString(), inBrigade: true, addedAt: subDays(today, 10).toISOString() },
  { id: uuidv4(), name: 'Presunto Parma Fatiado', brand: 'Sadia', category: 'B06 - Laticínios', barcode: '789100010002', expirationDate: addDays(today, 2).toISOString(), inBrigade: true, addedAt: subDays(today, 15).toISOString() },
  { id: uuidv4(), name: 'Manteiga tourinho pt 200g', brand: 'Tourinho', category: 'B02 - Margarina', barcode: '789100010003', expirationDate: addDays(today, 3).toISOString(), inBrigade: true, addedAt: subDays(today, 20).toISOString() },
  { id: uuidv4(), name: 'Queijo mussarela fatiado', brand: 'Piracanjuba', category: 'B06 - Laticínios', barcode: '789100010004', expirationDate: addDays(today, 3).toISOString(), inBrigade: true, addedAt: subDays(today, 5).toISOString() },
  { id: uuidv4(), name: 'Doriana Cremosa com sal', brand: 'Doriana', category: 'B02 - Margarina', barcode: '789100010005', expirationDate: addDays(today, 4).toISOString(), inBrigade: true, addedAt: subDays(today, 2).toISOString() },
  { id: uuidv4(), name: 'Iogurte Natural Integral', brand: 'Itambé', category: 'B01 - Iogurte', barcode: '7896051164609', expirationDate: addDays(today, 10).toISOString(), inBrigade: false, addedAt: subDays(today, 10).toISOString() },
  { id: uuidv4(), name: 'Creme de Ricota', brand: 'Regina', category: 'B06 - Laticínios', barcode: '7896010400311', expirationDate: addDays(today, 12).toISOString(), inBrigade: false, addedAt: subDays(today, 10).toISOString() },
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [discardRecords, setDiscardRecords] = useState<DiscardRecord[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    const savedRecords = localStorage.getItem('discardRecords');
    const savedSettings = localStorage.getItem('settings');

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    else setProducts(initialProducts);

    if (savedRecords) setDiscardRecords(JSON.parse(savedRecords));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    setIsLoaded(true);
  }, []);

  // Save to local storage
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
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const discardProduct = (productId: string, quantity: number, reason: DiscardRecord['reason']) => {
    const product = products.find(p => p.id === productId);
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

    setDiscardRecords(prev => [newRecord, ...prev]);
    deleteProduct(productId);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  if (!isLoaded) return null;

  return (
    <StoreContext.Provider value={{
      products,
      discardRecords,
      settings,
      addProduct,
      updateProduct,
      deleteProduct,
      discardProduct,
      updateSettings
    }}>
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
