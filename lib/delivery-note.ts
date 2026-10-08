import type { Order, Settings } from "./api"

/**
 * Generates a printable delivery note for an order.
 * Opens a new window with a print-ready HTML document — the admin can
 * print it or save it as PDF via the browser's print dialog.
 */
export function printDeliveryNote(order: Order, settings: Settings | null) {
  const companyName = settings?.companyName || "Store"
  const currency = order.currency || settings?.currency || "USD"
  const currencySymbol = settings?.currencySymbol || ""

  const itemsHtml = order.items
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(item.productName)}</td>
        <td>${item.sku ? escapeHtml(item.sku) : "—"}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${currencySymbol}${parseFloat(item.unitPrice).toFixed(2)}</td>
        <td class="num">${currencySymbol}${parseFloat(item.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Delivery Note - ${escapeHtml(order.orderNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #8b5cf6; }
    .company h1 { font-size: 24px; color: #8b5cf6; margin-bottom: 4px; }
    .company p { font-size: 13px; color: #666; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 20px; color: #1a1a2e; }
    .doc-title p { font-size: 13px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 8px; }
    .info-grid { display: flex; gap: 32px; margin-bottom: 24px; }
    .info-box { flex: 1; background: #f8f7fc; border: 1px solid #e5e0f0; border-radius: 8px; padding: 14px; }
    .info-box h4 { font-size: 11px; text-transform: uppercase; color: #8b5cf6; margin-bottom: 6px; }
    .info-box p { font-size: 13px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #8b5cf6; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
    td.num, th.num { text-align: right; }
    tr:nth-child(even) td { background: #fafafa; }
    .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid #8b5cf6; border-bottom: none; padding-top: 12px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #f59e0b; color: white; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e0f0; font-size: 12px; color: #888; text-align: center; }
    .notes { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>${escapeHtml(companyName)}</h1>
      ${settings?.address ? `<p>${escapeHtml(settings.address)}</p>` : ""}
      ${settings?.phoneNumber ? `<p>Phone: ${escapeHtml(settings.phoneNumber)}</p>` : ""}
      ${settings?.contactEmail ? `<p>${escapeHtml(settings.contactEmail)}</p>` : ""}
    </div>
    <div class="doc-title">
      <h2>DELIVERY NOTE</h2>
      <p>Order: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p>Status: <span class="status-badge">${order.status}</span></p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h4>Deliver To</h4>
      <p>
        <strong>${escapeHtml(order.customerName)}</strong><br>
        ${escapeHtml(order.customerPhone)}
        ${order.customerEmail ? `<br>${escapeHtml(order.customerEmail)}` : ""}
      </p>
    </div>
    <div class="info-box">
      <h4>Order Summary</h4>
      <p>
        Items: ${order.itemCount}<br>
        Total: <strong>${currencySymbol}${parseFloat(order.totalAmount).toFixed(2)} ${currency}</strong>
      </p>
    </div>
  </div>

  ${order.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>` : ""}

  <div class="section">
    <h3>Items</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th>SKU</th>
          <th class="num">Qty</th>
          <th class="num">Unit Price</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr class="total-row">
          <td colspan="5" class="num">TOTAL</td>
          <td class="num">${currencySymbol}${parseFloat(order.totalAmount).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Generated by ${escapeHtml(companyName)} • ${escapeHtml(order.orderNumber)}</p>
    ${settings?.workingHours ? `<p>Working hours: ${escapeHtml(settings.workingHours)}</p>` : ""}
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
