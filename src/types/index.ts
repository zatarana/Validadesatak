export type Product = {
  id: string;
  barcode: string;
  barcodeImage?: string;
  name: string;
  brand: string;
  category: string;
  expirationDate: string; // ISO string
  inBrigade: boolean;
  addedAt: string;
  lastCheckedAt?: string; // ISO string
  batch?: string;
  quantity?: number;
};

export type DiscardRecord = {
  id: string;
  productId: string;
  productName: string;
  productBrand: string;
  productCategory: string;
  productBarcode: string;
  quantity: number;
  reason: 'Validade' | 'Avaria' | 'Não informado';
  discardedAt: string; // ISO string
};

export type Settings = {
  storeName: string;
  teamName: string;
  alertCritical: number;
  alertHigh: number;
  alertMedium: number;
  alertLow: number;
  brigadeAutoSuggest: number;
  notificationTime: string;
};

export type AppBackup = {
  app: 'SATAK.IO';
  version: 1;
  exportedAt: string;
  products: Product[];
  discardRecords: DiscardRecord[];
  settings: Settings;
};
