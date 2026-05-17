import { normalizeBarcodeValue } from './barcodeImage';

export type BarcodeValidationResult = {
  isValid: boolean;
  normalized: string;
  message: string;
  kind: 'custom' | 'standard' | 'warning' | 'empty';
};

function hasValidCheckDigit(code: string) {
  const digits = code.split('').map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) return false;

  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}

export function isLikelyStandardBarcode(value: string) {
  const normalized = normalizeBarcodeValue(value);
  return /^\d+$/.test(normalized) && [8, 12, 13, 14].includes(normalized.length);
}

export function validateBarcode(value: string): BarcodeValidationResult {
  const normalized = normalizeBarcodeValue(value);

  if (!normalized) {
    return { isValid: false, normalized, message: 'Informe o código de barras.', kind: 'empty' };
  }

  if (normalized.length < 3) {
    return {
      isValid: false,
      normalized,
      message: 'Código próprio deve ter pelo menos 3 caracteres.',
      kind: 'warning',
    };
  }

  if (normalized.length > 40) {
    return {
      isValid: false,
      normalized,
      message: 'Código muito longo. Use até 40 caracteres.',
      kind: 'warning',
    };
  }

  if (!/^[A-Z0-9._-]+$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      message: 'Use apenas letras, números, ponto, hífen ou underline.',
      kind: 'warning',
    };
  }

  if (isLikelyStandardBarcode(normalized)) {
    if (hasValidCheckDigit(normalized)) {
      return { isValid: true, normalized, message: 'Código padrão válido.', kind: 'standard' };
    }

    return {
      isValid: true,
      normalized,
      message: 'Código aceito como próprio. O dígito verificador não bate com EAN/UPC.',
      kind: 'warning',
    };
  }

  return { isValid: true, normalized, message: 'Código próprio aceito.', kind: 'custom' };
}
