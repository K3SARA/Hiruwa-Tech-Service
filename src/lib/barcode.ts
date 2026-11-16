/**
 * Utility for generating standardized shop barcodes for products and inventory units
 * that lack an official manufacturer or retail barcode.
 */
export function generateShopBarcode(prefix = "HTS"): string {
  const timestampPart = Date.now().toString().slice(-4);
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timestampPart}${randomPart}`;
}

