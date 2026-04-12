/**
 * Calculates the total value of an investment item
 */
export const calculateInvestmentValue = (units, buyPrice) => {
  const u = parseFloat(units) || 0;
  const p = parseFloat(buyPrice) || 0;
  return u * p;
};