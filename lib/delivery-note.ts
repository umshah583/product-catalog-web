import type { Order, Settings } from "./api"

/**
 * Generates a printable delivery note for an order.
 * Opens a new window with a print-ready HTML document — the admin can
 * print it or save it as PDF via the browser's print dialog.
 *
 * Design matches the company delivery-note template:
 * logo/header, DELIVERY NOTE title, BILL TO + SHIP TO panels,
 * item table with brand, totals summary, notes, signature block,
 * and a dark footer with contact details.
 */
export function printDeliveryNote(order: Order, settings: Settings | null) {
  const companyName = settings?.companyName || "Store"
  const currencySymbol = settings?.currencySymbol || ""
  const currency = order.currency || settings?.currency || ""

  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0)

  const itemsHtml = order.items
    .map(
      (item, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${escapeHtml(item.productName)}</td>
        <td>${item.brand ? escapeHtml(item.brand) : "—"}</td>
        <td>${item.sku ? escapeHtml(item.sku) : "—"}</td>
        <td class="c">${item.quantity}</td>
        <td class="r">${parseFloat(item.unitPrice).toFixed(2)}</td>
        <td class="r">${parseFloat(item.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join("")

  const address = order.customerAddress ? escapeHtml(order.customerAddress) : "—"
  const date = new Date(order.createdAt)
  const dateStr = `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${date.getFullYear()}`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Delivery Note - ${escapeHtml(order.orderNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1a1a2e;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .brand h1 { font-size: 26px; font-weight: 800; color: #16305e; letter-spacing: 1px; }
    .brand .tag { font-size: 10px; letter-spacing: 2px; color: #16305e; text-transform: uppercase; }
    .title { font-size: 34px; font-weight: 800; color: #16305e; margin-bottom: 14px; }
    .title .accent { color: #4fc3f7; }
    .meta { font-size: 13px; margin-bottom: 24px; }
    .meta div { margin-bottom: 3px; }
    .meta b { display: inline-block; width: 44px; }

    .cols { display: flex; gap: 20px; margin-bottom: 24px; }
    .panel { flex: 1; border: 1px solid #dbe7f5; border-radius: 6px; overflow: hidden; }
    .panel h4 {
      background: #eaf3fb; color: #16305e; font-size: 12px; font-weight: 700;
      letter-spacing: 1px; padding: 8px 14px;
    }
    .panel .body { padding: 14px; font-size: 12.5px; }
    .panel .row { display: flex; margin-bottom: 8px; }
    .panel .row:last-child { margin-bottom: 0; }
    .panel .lbl { width: 105px; color: #444; }
    .panel .sep { margin-right: 10px; color: #999; }
    .panel .val { flex: 1; color: #1a1a2e; }

    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #16305e; color: #fff; font-size: 11.5px; font-weight: 700;
      padding: 10px 12px; text-align: left; letter-spacing: 0.3px;
    }
    thead th.c, thead th.r { text-align: center; }
    thead th.r { text-align: right; }
    tbody td { padding: 10px 12px; font-size: 12.5px; border-bottom: 1px solid #e8e8e8; }
    tbody td.c { text-align: center; }
    tbody td.r { text-align: right; }
    tbody tr:nth-child(even) td { background: #f4f8fc; }

    .bottom { display: flex; justify-content: space-between; margin-top: 22px; gap: 30px; }
    .notes { flex: 1; font-size: 12px; color: #333; }
    .notes h5 { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
    .notes li { margin-left: 14px; margin-bottom: 4px; }
    .totals {
      width: 260px; border: 1px solid #dbe7f5; border-radius: 6px; overflow: hidden;
      align-self: flex-start;
    }
    .totals .trow {
      display: flex; justify-content: space-between; padding: 10px 16px;
      font-size: 12.5px; background: #eaf3fb;
    }
    .totals .trow + .trow { border-top: 1px solid #dbe7f5; }
    .totals .lbl { color: #16305e; font-weight: 600; }
    .totals .val { font-weight: 700; color: #16305e; text-align: right; }

    .sign { margin-top: 40px; font-size: 12px; color: #333; }
    .sign .thanks { font-weight: 600; margin-bottom: 24px; }
    .sigline { width: 220px; border-bottom: 1px solid #333; height: 34px; margin-bottom: 6px; }
    .sign .cap { font-weight: 700; margin-bottom: 14px; }
    .sign .fld { margin-bottom: 10px; }
    .sign .fld span { display: inline-block; width: 80px; font-weight: 600; }
    .sign .fld .ln { display: inline-block; width: 140px; border-bottom: 1px solid #888; }

    .footer {
      margin-top: 44px; background: #16305e; color: #fff; border-radius: 6px;
      padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;
      font-size: 11.5px;
    }
    .footer .tagline { letter-spacing: 0.5px; color: #cfe4f5; }

    @media print {
      body { padding: 20px 30px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="hdr">
    <div class="brand">
      <h1>${escapeHtml(companyName.toUpperCase())}</h1>
      <div class="tag">Your Trusted Distribution Partner</div>
    </div>
  </div>

  <div class="title">DELIVERY <span class="accent">NOTE</span></div>

  <div class="meta">
    <div><b>No:</b> ${escapeHtml(order.orderNumber)}</div>
    <div><b>Date:</b> ${dateStr}</div>
  </div>

  <div class="cols">
    <div class="panel">
      <h4>BILL TO</h4>
      <div class="body">
        <div class="row"><span class="lbl">Customer Name</span><span class="sep">:</span><span class="val">${escapeHtml(order.customerName)}</span></div>
        <div class="row"><span class="lbl">Address</span><span class="sep">:</span><span class="val">${address}</span></div>
        <div class="row"><span class="lbl">Contact</span><span class="sep">:</span><span class="val">${escapeHtml(order.customerPhone)}</span></div>
      </div>
    </div>
    <div class="panel">
      <h4>SHIP TO</h4>
      <div class="body">
        <div class="row"><span class="lbl">Customer Name</span><span class="sep">:</span><span class="val">${escapeHtml(order.customerName)}</span></div>
        <div class="row"><span class="lbl">Address</span><span class="sep">:</span><span class="val">${address}</span></div>
        <div class="row"><span class="lbl">Contact</span><span class="sep">:</span><span class="val">${escapeHtml(order.customerPhone)}</span></div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="c">#</th>
        <th>Product Description</th>
        <th>Brand</th>
        <th>Model / SKU</th>
        <th class="c">Qty</th>
        <th class="r">Unit Price (${escapeHtml(currency)})</th>
        <th class="r">Total (${escapeHtml(currency)})</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="bottom">
    <div class="notes">
      <h5>Notes:</h5>
      <ul>
        ${order.notes ? `<li>${escapeHtml(order.notes)}</li>` : ""}
        <li>Goods are for your kind receipt and verification.</li>
        <li>Please check the items and quantity at the time of delivery.</li>
        <li>Any discrepancy must be reported within 24 hours.</li>
      </ul>
    </div>
    <div class="totals">
      <div class="trow"><span class="lbl">Total Quantity</span><span class="val">${totalQty}</span></div>
      <div class="trow"><span class="lbl">Total Amount (${escapeHtml(currency)})</span><span class="val">${parseFloat(order.totalAmount).toFixed(2)}</span></div>
    </div>
  </div>

  <div class="sign">
    <div class="thanks">Thank you for your business!<br>For ${escapeHtml(companyName)}</div>
    <div class="sigline"></div>
    <div class="cap">Authorized Signature</div>
    <div class="fld"><span>Name:</span><span class="ln"></span></div>
    <div class="fld"><span>Designation:</span><span class="ln"></span></div>
  </div>

  <div class="footer">
    <div>
      ${settings?.phoneNumber ? `☎ ${escapeHtml(settings.phoneNumber)}&nbsp;&nbsp;&nbsp;` : ""}
      ${settings?.contactEmail ? `✉ ${escapeHtml(settings.contactEmail)}&nbsp;&nbsp;&nbsp;` : ""}
      ${settings?.address ? `📍 ${escapeHtml(settings.address)}` : ""}
    </div>
    <div class="tagline">Quality Products &nbsp;|&nbsp; Reliable Supply &nbsp;|&nbsp; Growing Together</div>
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
