import { DiscardRecord, Product, Settings } from '../types';
import { supabase } from './supabase';

export type StoreSession = {
  storeId: string;
  storeName: string;
  storeNumber: number;
  appUserId: string;
  role: 'admin' | 'operator';
};

function productFromRow(row: any): Product {
  return {
    id: row.id,
    barcode: row.barcode || '',
    barcodeImage: row.barcode_image || undefined,
    name: row.name || 'Produto sem nome',
    brand: row.brand || '',
    category: row.category || 'Categoria padrão',
    expirationDate: row.expiration_date,
    inBrigade: Boolean(row.in_brigade),
    addedAt: row.added_at || row.created_at,
    batch: row.batch || undefined,
  };
}

function productToRow(product: Product, storeId: string) {
  return {
    id: product.id,
    store_id: storeId,
    barcode: product.barcode,
    barcode_image: product.barcodeImage || null,
    name: product.name,
    brand: product.brand || '',
    category: product.category,
    expiration_date: product.expirationDate,
    in_brigade: product.inBrigade,
    batch: product.batch || null,
    added_at: product.addedAt,
  };
}

function discardFromRow(row: any): DiscardRecord {
  return {
    id: row.id,
    productId: row.product_id || '',
    productName: row.product_name || 'Produto sem nome',
    productBrand: row.product_brand || '',
    productCategory: row.product_category || '',
    productBarcode: row.product_barcode || '',
    quantity: Number(row.quantity) || 1,
    reason: row.reason || 'Validade',
    discardedAt: row.discarded_at || row.created_at,
  };
}

function discardToRow(record: DiscardRecord, storeId: string) {
  return {
    id: record.id,
    store_id: storeId,
    product_id: record.productId || null,
    product_name: record.productName,
    product_brand: record.productBrand || '',
    product_category: record.productCategory || '',
    product_barcode: record.productBarcode || '',
    quantity: record.quantity,
    reason: record.reason,
    discarded_at: record.discardedAt,
  };
}

function settingsFromRow(row: any, fallback: Settings): Settings {
  if (!row) return fallback;
  return {
    storeName: row.store_name || fallback.storeName,
    teamName: row.team_name || fallback.teamName,
    alertCritical: row.alert_critical ?? fallback.alertCritical,
    alertHigh: row.alert_high ?? fallback.alertHigh,
    alertMedium: row.alert_medium ?? fallback.alertMedium,
    alertLow: row.alert_low ?? fallback.alertLow,
    brigadeAutoSuggest: row.brigade_auto_suggest ?? fallback.brigadeAutoSuggest,
    notificationTime: row.notification_time || fallback.notificationTime,
  };
}

function settingsToRow(settings: Settings, storeId: string) {
  return {
    store_id: storeId,
    store_name: settings.storeName,
    team_name: settings.teamName,
    alert_critical: settings.alertCritical,
    alert_high: settings.alertHigh,
    alert_medium: settings.alertMedium,
    alert_low: settings.alertLow,
    brigade_auto_suggest: settings.brigadeAutoSuggest,
    notification_time: settings.notificationTime,
  };
}

export async function ensureAnonymousAuth() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const result = await supabase.auth.signInAnonymously();
  if (result.error) throw result.error;
  return result.data.session;
}

export async function loginStore(pin: string, storeNumber: number) {
  await ensureAnonymousAuth();
  const { data, error } = await supabase.rpc('login_store', {
    input_pin: pin,
    input_store_number: storeNumber,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Login não retornou dados da loja.');
  return {
    storeId: row.store_id,
    storeName: row.store_name,
    storeNumber: row.store_number,
    appUserId: row.app_user_id,
    role: row.role,
  } as StoreSession;
}

export async function bootstrapAdmin(pin: string, storeNumber: number) {
  await ensureAnonymousAuth();
  const { data, error } = await supabase.rpc('bootstrap_admin', {
    input_pin: pin,
    input_store_number: storeNumber,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Admin não retornou dados da loja.');
  return {
    storeId: row.store_id,
    storeName: row.store_name,
    storeNumber: row.store_number,
    appUserId: row.app_user_id,
    role: row.role,
  } as StoreSession;
}

export async function createRemoteOperator(name: string, pin: string, storeNumbers: number[]) {
  const { data, error } = await supabase.rpc('admin_create_operator', {
    input_name: name,
    input_pin: pin,
    input_store_numbers: storeNumbers,
  });
  if (error) throw error;
  return data as string;
}

export async function listRemoteOperators() {
  const { data, error } = await supabase.rpc('admin_list_operators');
  if (error) throw error;
  return data || [];
}

export async function loadRemoteState(storeId: string, fallbackSettings: Settings) {
  const [productsResult, discardsResult, settingsResult] = await Promise.all([
    supabase.from('products').select('*').eq('store_id', storeId).order('expiration_date', { ascending: true }),
    supabase.from('discard_records').select('*').eq('store_id', storeId).order('discarded_at', { ascending: false }),
    supabase.from('store_settings').select('*').eq('store_id', storeId).maybeSingle(),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (discardsResult.error) throw discardsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  return {
    products: (productsResult.data || []).map(productFromRow),
    discardRecords: (discardsResult.data || []).map(discardFromRow),
    settings: settingsFromRow(settingsResult.data, fallbackSettings),
  };
}

export async function upsertRemoteProduct(product: Product, storeId: string) {
  const { error } = await supabase.from('products').upsert(productToRow(product, storeId));
  if (error) throw error;
}

export async function deleteRemoteProduct(productId: string, storeId: string) {
  const { error } = await supabase.from('products').delete().eq('id', productId).eq('store_id', storeId);
  if (error) throw error;
}

export async function insertRemoteDiscard(record: DiscardRecord, storeId: string) {
  const { error } = await supabase.from('discard_records').insert(discardToRow(record, storeId));
  if (error) throw error;
}

export async function upsertRemoteSettings(settings: Settings, storeId: string) {
  const { error } = await supabase.from('store_settings').upsert(settingsToRow(settings, storeId));
  if (error) throw error;
}
