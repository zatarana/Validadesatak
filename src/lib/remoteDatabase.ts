import { DiscardRecord, Product, Settings } from '../types';
import { supabase } from './supabase';

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

function productToRow(product: Product, userId: string) {
  return {
    id: product.id,
    user_id: userId,
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

function discardToRow(record: DiscardRecord, userId: string) {
  return {
    id: record.id,
    user_id: userId,
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

function settingsToRow(settings: Settings, userId: string) {
  return {
    user_id: userId,
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

export async function loadRemoteState(userId: string, fallbackSettings: Settings) {
  const [productsResult, discardsResult, settingsResult] = await Promise.all([
    supabase.from('products').select('*').eq('user_id', userId).order('expiration_date', { ascending: true }),
    supabase.from('discard_records').select('*').eq('user_id', userId).order('discarded_at', { ascending: false }),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
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

export async function upsertRemoteProduct(product: Product, userId: string) {
  const { error } = await supabase.from('products').upsert(productToRow(product, userId));
  if (error) throw error;
}

export async function updateRemoteProduct(product: Product, userId: string) {
  const { error } = await supabase.from('products').upsert(productToRow(product, userId));
  if (error) throw error;
}

export async function deleteRemoteProduct(productId: string, userId: string) {
  const { error } = await supabase.from('products').delete().eq('id', productId).eq('user_id', userId);
  if (error) throw error;
}

export async function insertRemoteDiscard(record: DiscardRecord, userId: string) {
  const { error } = await supabase.from('discard_records').insert(discardToRow(record, userId));
  if (error) throw error;
}

export async function upsertRemoteSettings(settings: Settings, userId: string) {
  const { error } = await supabase.from('user_settings').upsert(settingsToRow(settings, userId));
  if (error) throw error;
}
