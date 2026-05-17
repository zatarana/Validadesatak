import { Product } from '../types';
import { DEFAULT_CATEGORY } from './categories';
import { normalizeBarcodeValue } from './barcodeImage';

export type BarcodeLookupResult = {
  source: 'local' | 'web' | 'not_found';
  barcode: string;
  name?: string;
  brand?: string;
  category?: string;
};

function normalizeText(value: string | undefined) {
  return (value || '').trim();
}

export async function lookupBarcode(barcode: string, products: Product[]): Promise<BarcodeLookupResult> {
  const cleanBarcode = normalizeBarcodeValue(barcode);

  if (!cleanBarcode) {
    return { source: 'not_found', barcode: '' };
  }

  const localProduct = products.find(product => normalizeBarcodeValue(product.barcode) === cleanBarcode);
  if (localProduct) {
    return {
      source: 'local',
      barcode: cleanBarcode,
      name: localProduct.name,
      brand: localProduct.brand,
      category: localProduct.category || DEFAULT_CATEGORY,
    };
  }

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json?fields=product_name,brands,categories_tags,categories`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return { source: 'not_found', barcode: cleanBarcode };
    }

    const data = await response.json();
    if (data.status !== 1 || !data.product) {
      return { source: 'not_found', barcode: cleanBarcode };
    }

    const productName = normalizeText(data.product.product_name);
    const brand = normalizeText(data.product.brands?.split(',')?.[0]);

    if (!productName) {
      return { source: 'not_found', barcode: cleanBarcode };
    }

    return {
      source: 'web',
      barcode: cleanBarcode,
      name: productName,
      brand,
      category: DEFAULT_CATEGORY,
    };
  } catch {
    return { source: 'not_found', barcode: cleanBarcode };
  }
}
