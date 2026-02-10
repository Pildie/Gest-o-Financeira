export const getInvoiceMonth = (purchaseDate: Date, closingDay: number): string => {
  const pDate = new Date(purchaseDate);
  const day = pDate.getDate();

  if (day >= closingDay) {
    pDate.setMonth(pDate.getMonth() + 1);
  }

  const year = pDate.getFullYear();
  const month = String(pDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};
