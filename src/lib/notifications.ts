import { Product, Settings } from '../types';
import { getDaysUntil } from './dates';

export function getNotificationPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
}

export function getExpiringProducts(products: Product[], settings: Settings) {
  return products
    .filter(product => {
      const days = getDaysUntil(product.expirationDate);
      return days >= 0 && days <= settings.alertCritical;
    })
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));
}

export function sendTestNotification(products: Product[], settings: Settings) {
  if (!('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações.');
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Permita notificações antes de testar.');
  }

  const expiring = getExpiringProducts(products, settings);
  const title = expiring.length > 0 ? `${expiring.length} lote(s) críticos` : 'SATAK.IO ativo';
  const body = expiring.length > 0
    ? `${expiring[0].name} vence em ${getDaysUntil(expiring[0].expirationDate)} dia(s).`
    : 'Você receberá alertas quando houver produtos críticos.';

  new Notification(title, {
    body,
    icon: './icon.svg',
    badge: './icon.svg',
    tag: 'satak-test-notification',
  });
}
