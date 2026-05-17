import { Product } from '../types';
import { formatPtDate, getDaysUntil, getExpirationLabel } from './dates';

export type ConferenceMap = Record<string, string>;

const STORAGE_KEY = 'conferenceChecks';

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function loadConferenceChecks(): ConferenceMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveConferenceChecks(checks: ConferenceMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
}

export function isProductCheckedToday(product: Product, checks: ConferenceMap) {
  const externalCheck = checks[product.id];
  const savedOnProduct = product.lastCheckedAt;
  return Boolean(
    (externalCheck && externalCheck.slice(0, 10) === todayKey())
    || (savedOnProduct && savedOnProduct.slice(0, 10) === todayKey())
  );
}

export function buildConferenceWhatsAppMessage(products: Product[], checks: ConferenceMap) {
  const checked = products.filter(product => isProductCheckedToday(product, checks));
  const pending = products.filter(product => !isProductCheckedToday(product, checks));
  const progress = products.length > 0 ? Math.round((checked.length / products.length) * 100) : 0;

  const pendingLines = pending
    .slice()
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate))
    .slice(0, 35)
    .map((product, index) => `${index + 1}. ${product.name} | ${product.brand || 'sem marca'} | qtd ${product.quantity ?? '-'} | vence ${formatPtDate(product.expirationDate)} (${getExpirationLabel(getDaysUntil(product.expirationDate))})`);

  return [
    '*Conferência de Validades*',
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
    `Progresso: ${progress}%`,
    `Conferidos: ${checked.length}`,
    `Pendentes: ${pending.length}`,
    '',
    '*Pendentes:*',
    ...(pendingLines.length ? pendingLines : ['Nenhum lote pendente.']),
  ].join('\n');
}

export function shareConferenceWhatsApp(products: Product[], checks: ConferenceMap) {
  const message = buildConferenceWhatsAppMessage(products, checks);
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}
