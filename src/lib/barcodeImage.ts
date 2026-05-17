const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

export function normalizeBarcodeValue(value: string) {
  return value.replace(/\D/g, '');
}

function toCode128BValues(value: string) {
  const cleanValue = normalizeBarcodeValue(value);
  if (!cleanValue) return [];

  const startCodeB = 104;
  const values = cleanValue.split('').map(char => char.charCodeAt(0) - 32);
  const checksum = (startCodeB + values.reduce((sum, code, index) => sum + code * (index + 1), 0)) % 103;

  return [startCodeB, ...values, checksum, 106];
}

export function generateBarcodeSvg(barcode: string) {
  const cleanBarcode = normalizeBarcodeValue(barcode);
  const codes = toCode128BValues(cleanBarcode);
  if (!codes.length) return '';

  const moduleWidth = 2;
  const quietZone = 18;
  const barHeight = 64;
  const textArea = 26;
  const height = barHeight + textArea;
  const patterns = codes.map(code => CODE128_PATTERNS[code]);
  const totalModules = patterns.join('').split('').reduce((sum, width) => sum + Number(width), 0);
  const width = quietZone * 2 + totalModules * moduleWidth;

  let x = quietZone;
  const rects: string[] = [];

  patterns.forEach(pattern => {
    pattern.split('').forEach((module, index) => {
      const moduleSize = Number(module) * moduleWidth;
      if (index % 2 === 0) {
        rects.push(`<rect x="${x}" y="8" width="${moduleSize}" height="${barHeight}" fill="#111827" />`);
      }
      x += moduleSize;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Código de barras ${cleanBarcode}">
    <rect width="100%" height="100%" rx="12" fill="#ffffff" />
    ${rects.join('')}
    <text x="50%" y="${height - 8}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2" fill="#111827">${cleanBarcode}</text>
  </svg>`;
}

export function generateBarcodeImageDataUrl(barcode: string) {
  const svg = generateBarcodeSvg(barcode);
  if (!svg) return '';

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
