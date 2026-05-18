const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "COP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function getCurrencyFractionDigits(
  currencyCode: string = "USD",
): number {
  return ZERO_DECIMAL_CURRENCIES.has(currencyCode.toUpperCase()) ? 0 : 2;
}

export function formatPrice(
  amount: string | number,
  currencyCode: string = "USD",
  locale: string = "en-US",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const fractionDigits = getCurrencyFractionDigits(currencyCode);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(num);
}
