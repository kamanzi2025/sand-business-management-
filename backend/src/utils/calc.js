// Central formula for derived order figures, kept in one place so the
// "assumption" is easy to find and change.
//
// purchase_total = quantity * purchase_unit_price
// sale_total      = quantity * selling_unit_price
// purchase_vat    = purchase_total * vat_percentage
// selling_vat     = sale_total * vat_percentage
// net_after_vat   = selling_vat - purchase_vat   (net VAT payable/reclaimable on this order)
export function computeOrderTotals({ quantity_trucks, purchase_unit_price, selling_unit_price, vat_percentage }) {
  const qty = Number(quantity_trucks) || 0;
  const purchasePrice = Number(purchase_unit_price) || 0;
  const sellingPrice = Number(selling_unit_price) || 0;
  const vatRate = (Number(vat_percentage) || 0) / 100;

  const purchase_total = qty * purchasePrice;
  const sale_total = qty * sellingPrice;
  const purchase_vat = purchase_total * vatRate;
  const selling_vat = sale_total * vatRate;
  const net_after_vat = selling_vat - purchase_vat;

  return { purchase_total, sale_total, purchase_vat, selling_vat, net_after_vat };
}
