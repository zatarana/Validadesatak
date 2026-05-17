import { Product, DiscardRecord, Settings } from '../types';
import { formatPtDate, getDaysUntil, getExpirationLabel } from './dates';
import { ProductListFilter } from '../types/filters';
import { generateBarcodeImageDataUrl } from './barcodeImage';

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openWhatsApp(message: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

function filterProductsByStatus(products: Product[], settings: Settings, filter: ProductListFilter) {
  return products
    .filter(product => {
      const days = getDaysUntil(product.expirationDate);
      if (filter === 'expired') return days < 0;
      if (filter === 'critical') return days >= 0 && days <= settings.alertCritical;
      if (filter === 'attention') return days > settings.alertCritical && days <= settings.alertMedium;
      if (filter === 'healthy') return days > settings.alertMedium;
      return true;
    })
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));
}

function statusTitle(filter: ProductListFilter) {
  if (filter === 'expired') return 'Vencidos';
  if (filter === 'critical') return 'Críticos';
  if (filter === 'attention') return 'Atenção';
  if (filter === 'healthy') return 'Saudáveis';
  return 'Todos os lotes';
}

export function exportProductsCsv(products: Product[]) {
  const header = ['Nome', 'Marca', 'Categoria', 'Código', 'Lote', 'Quantidade', 'Validade', 'Dias', 'Brigada', 'Adicionado'];
  const rows = products.map(product => [
    product.name,
    product.brand,
    product.category,
    product.barcode,
    product.batch || '',
    product.quantity ?? '',
    formatPtDate(product.expirationDate, 'dd/MM/yyyy'),
    getDaysUntil(product.expirationDate),
    product.inBrigade ? 'Sim' : 'Não',
    formatPtDate(product.addedAt, 'dd/MM/yyyy'),
  ]);

  const csv = [header, ...rows].map(row => row.map(csvCell).join(';')).join('\n');
  downloadTextFile(`produtos-validade-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
}

export function exportDiscardsCsv(records: DiscardRecord[]) {
  const header = ['Produto', 'Marca', 'Categoria', 'Código', 'Quantidade', 'Motivo', 'Data'];
  const rows = records.map(record => [
    record.productName,
    record.productBrand,
    record.productCategory,
    record.productBarcode,
    record.quantity,
    record.reason,
    new Date(record.discardedAt).toLocaleString('pt-BR'),
  ]);

  const csv = [header, ...rows].map(row => row.map(csvCell).join(';')).join('\n');
  downloadTextFile(`descartes-validade-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
}

export function shareWhatsAppSummary(products: Product[], records: DiscardRecord[], settings: Settings) {
  const expired = products.filter(product => getDaysUntil(product.expirationDate) < 0).length;
  const critical = products.filter(product => {
    const days = getDaysUntil(product.expirationDate);
    return days >= 0 && days <= settings.alertCritical;
  }).length;
  const brigade = products.filter(product => product.inBrigade).length;
  const discarded = records.reduce((sum, record) => sum + record.quantity, 0);

  const message = [
    '*Relatório de Validades*',
    `Loja: ${settings.storeName || 'Não informado'}`,
    `Equipe: ${settings.teamName || 'Não informado'}`,
    '',
    `Produtos cadastrados: ${products.length}`,
    `Lotes na brigada: ${brigade}`,
    `Vencidos: ${expired}`,
    `Críticos: ${critical}`,
    `Itens descartados: ${discarded}`,
  ].join('\n');

  openWhatsApp(message);
}

export function shareProductStatusList(products: Product[], settings: Settings, filter: ProductListFilter) {
  const filtered = filterProductsByStatus(products, settings, filter);
  const title = statusTitle(filter);
  const lines = filtered.length
    ? filtered.slice(0, 45).map((product, index) => {
      const days = getDaysUntil(product.expirationDate);
      return `${index + 1}. ${product.name} | ${product.brand || 'sem marca'} | qtd ${product.quantity ?? '-'} | vence ${formatPtDate(product.expirationDate)} (${getExpirationLabel(days)})`;
    })
    : [`Nenhum lote em ${title.toLowerCase()}.`];

  const message = [
    `*Lista de Validades — ${title}*`,
    `Loja: ${settings.storeName || 'Não informado'}`,
    `Equipe: ${settings.teamName || 'Não informado'}`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    `Total: ${filtered.length}`,
    '',
    ...lines,
  ].join('\n');

  openWhatsApp(message);
}

export function shareBrigadeChecklist(products: Product[], settings: Settings) {
  const brigadeProducts = products
    .filter(product => product.inBrigade || getDaysUntil(product.expirationDate) <= settings.brigadeAutoSuggest)
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));

  const lines = brigadeProducts.length
    ? brigadeProducts.slice(0, 40).map((product, index) => {
      const days = getDaysUntil(product.expirationDate);
      return `${index + 1}. ${product.name} | ${product.brand || 'sem marca'} | qtd ${product.quantity ?? '-'} | vence ${formatPtDate(product.expirationDate)} (${getExpirationLabel(days)})`;
    })
    : ['Nenhum lote na Brigada ou dentro do prazo de sugestão.'];

  const message = [
    '*Checklist da Brigada de Validade*',
    `Loja: ${settings.storeName || 'Não informado'}`,
    `Equipe: ${settings.teamName || 'Não informado'}`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    ...lines,
  ].join('\n');

  openWhatsApp(message);
}

export function printBarcodeLabels(products: Product[], settings: Settings) {
  const sortedProducts = products.slice().sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate));
  const labels = sortedProducts.map(product => {
    const days = getDaysUntil(product.expirationDate);
    const barcodeImage = product.barcodeImage || generateBarcodeImageDataUrl(product.barcode);
    return `
      <section class="label">
        <div class="topline">${escapeHtml(settings.storeName || 'SATAK.IO')}</div>
        <div class="product">${escapeHtml(product.name)}</div>
        <div class="meta">${escapeHtml(product.brand || 'Sem marca')} • ${escapeHtml(product.category || 'Sem categoria')}</div>
        ${barcodeImage ? `<img class="barcode" src="${barcodeImage}" alt="Código ${escapeHtml(product.barcode)}" />` : `<div class="barcode fallback">${escapeHtml(product.barcode || '-')}</div>`}
        <div class="bottom">
          <span>Val.: <strong>${formatPtDate(product.expirationDate)}</strong></span>
          <span>Qtd.: <strong>${escapeHtml(product.quantity ?? '-')}</strong></span>
        </div>
        <div class="status">${escapeHtml(getExpirationLabel(days))}</div>
      </section>
    `;
  }).join('');

  const html = `
    <html>
      <head>
        <title>Etiquetas de Validade</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 12mm; font-family: Arial, sans-serif; color: #111827; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8mm; }
          .label { border: 1.5px solid #111827; border-radius: 10px; padding: 9px; min-height: 62mm; page-break-inside: avoid; display: flex; flex-direction: column; gap: 4px; }
          .topline { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: #4f46e5; }
          .product { font-size: 15px; line-height: 1.1; font-weight: 900; }
          .meta { font-size: 9px; color: #4b5563; font-weight: 700; text-transform: uppercase; }
          .barcode { width: 100%; height: 31mm; object-fit: contain; margin: 1px 0; }
          .fallback { border: 1px dashed #9ca3af; display: flex; align-items: center; justify-content: center; font-weight: 800; }
          .bottom { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; }
          .status { background: #f3f4f6; border-radius: 8px; padding: 5px; text-align: center; font-size: 11px; font-weight: 900; text-transform: uppercase; }
          @media print { body { padding: 8mm; } .grid { gap: 5mm; } }
        </style>
      </head>
      <body>
        <div class="grid">${labels || '<p>Nenhum produto cadastrado.</p>'}</div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printProductsReport(products: Product[], records: DiscardRecord[], settings: Settings) {
  const rows = products
    .slice()
    .sort((a, b) => getDaysUntil(a.expirationDate) - getDaysUntil(b.expirationDate))
    .map(product => `
      <tr>
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.brand || '-')}</td>
        <td>${escapeHtml(product.category || '-')}</td>
        <td>${escapeHtml(product.quantity ?? '-')}</td>
        <td>${formatPtDate(product.expirationDate, 'dd/MM/yyyy')}</td>
        <td>${escapeHtml(getExpirationLabel(getDaysUntil(product.expirationDate)))}</td>
        <td>${product.inBrigade ? 'Sim' : 'Não'}</td>
      </tr>
    `).join('');

  const discarded = records.reduce((sum, record) => sum + record.quantity, 0);
  const html = `
    <html>
      <head>
        <title>Relatório de Validades</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin-bottom: 4px; }
          .meta { color: #6b7280; margin-bottom: 24px; }
          .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
          .value { font-size: 28px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Relatório de Validades</h1>
        <div class="meta">${escapeHtml(settings.storeName)} • ${escapeHtml(settings.teamName)} • ${new Date().toLocaleString('pt-BR')}</div>
        <div class="cards">
          <div class="card"><div class="value">${products.length}</div><div>Produtos</div></div>
          <div class="card"><div class="value">${products.filter(p => p.inBrigade).length}</div><div>Na brigada</div></div>
          <div class="card"><div class="value">${records.length}</div><div>Registros de descarte</div></div>
          <div class="card"><div class="value">${discarded}</div><div>Itens descartados</div></div>
        </div>
        <table>
          <thead><tr><th>Produto</th><th>Marca</th><th>Categoria</th><th>Qtd</th><th>Validade</th><th>Status</th><th>Brigada</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}
