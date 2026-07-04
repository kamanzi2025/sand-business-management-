import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';

const COLUMNS = [
  { header: 'P.O Date', key: 'po_date', width: 12 },
  { header: 'Last Supply Date', key: 'last_supply_date', width: 16 },
  { header: 'Customer', key: 'customer_name', width: 18 },
  { header: 'Qty (Trucks)', key: 'quantity_trucks', width: 12 },
  { header: 'Purchase Unit Price', key: 'purchase_unit_price', width: 16 },
  { header: 'Selling Unit Price', key: 'selling_unit_price', width: 16 },
  { header: 'Purchase Total', key: 'purchase_total', width: 16 },
  { header: 'Sale Total', key: 'sale_total', width: 16 },
  { header: 'Purchasing VAT', key: 'purchase_vat', width: 14 },
  { header: 'Selling VAT', key: 'selling_vat', width: 14 },
  { header: 'Net after VAT', key: 'net_after_vat', width: 14 },
  { header: 'Status', key: 'status', width: 12 },
];

export async function exportOrdersToExcel(orders, currencySymbol) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true };

  orders.forEach((order) => sheet.addRow(order));

  sheet.getColumn('purchase_unit_price').numFmt = '#,##0';
  sheet.getColumn('selling_unit_price').numFmt = '#,##0';
  sheet.getColumn('purchase_total').numFmt = '#,##0';
  sheet.getColumn('sale_total').numFmt = '#,##0';
  sheet.getColumn('purchase_vat').numFmt = '#,##0';
  sheet.getColumn('selling_vat').numFmt = '#,##0';
  sheet.getColumn('net_after_vat').numFmt = '#,##0';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveAs(blob, `sand-orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportOrdersToPdf(orders, currencySymbol) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('Sand Supply — Orders', 14, 14);
  doc.setFontSize(9);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 20);

  autoTable(doc, {
    startY: 25,
    head: [
      ['P.O Date', 'Last Supply', 'Customer', 'Qty', 'Purch. Price', 'Sell Price', 'Purch. Total', 'Sale Total', 'Purch. VAT', 'Sell VAT', 'Net after VAT', 'Status'],
    ],
    body: orders.map((o) => [
      formatDate(o.po_date),
      o.last_supply_date ? formatDate(o.last_supply_date) : '—',
      o.customer_name || '—',
      o.quantity_trucks,
      formatCurrency(o.purchase_unit_price, currencySymbol),
      formatCurrency(o.selling_unit_price, currencySymbol),
      formatCurrency(o.purchase_total, currencySymbol),
      formatCurrency(o.sale_total, currencySymbol),
      formatCurrency(o.purchase_vat, currencySymbol),
      formatCurrency(o.selling_vat, currencySymbol),
      formatCurrency(o.net_after_vat, currencySymbol),
      o.status,
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [42, 120, 214] },
  });

  doc.save(`sand-orders-${new Date().toISOString().slice(0, 10)}.pdf`);
}
