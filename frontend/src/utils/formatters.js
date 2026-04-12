/**
 * Formats a number as Indian Rupee (INR) currency string without the symbol
 * used for manual ₹ prefixing in the UI.
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
};