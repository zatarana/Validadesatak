import { normalizeBarcodeValue } from './barcodeImage';

export type BarcodeValidationResult = {
  isValid: boolean;
  normalized: string;
  message: string;
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

export function validateBarcode(value: string): BarcodeValidationResult {
  const normalized = normalizeBarcodeValue(value);

  if (!normalized) {
    return { isValid: false, normalized, message: 'Informe o código de barras.' };
  }

  if (![8, 12, 13, 14].includes(normalized.length)) {
    return {
      isValid: false,
      normalized,
      message: 'Código deve ter 8, 12, 13 ou 14 dígitos.',
    };
  }

  if (!hasValidCheckDigit(normalized)) {
    return {
      isValid: false,
      normalized,
      message: 'Dígito verificador inválido. Confira se o código foi digitado corretamente.',
    };
  }

  return { isValid: true, normalized, message: 'Código válido.' };
}
