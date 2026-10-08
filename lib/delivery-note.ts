import type { Order, DeliveryNote, Settings } from "./api"

/** Normalized shape the print template renders. */
export interface DeliveryNoteDoc {
  docNumber: string
  date: Date
  status?: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  customerTrn?: string | null
  billingAddress?: string | null
  shippingAddress?: string | null
  notes?: string | null
  totalAmount: number
  currency: string
  items: {
    productName: string
    brand?: string | null
    sku?: string | null
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
}

export function docFromDeliveryNote(dn: DeliveryNote): DeliveryNoteDoc {
  return {
    docNumber: dn.dnNumber,
    date: new Date(dn.deliveryDate || dn.createdAt),
    status: dn.status,
    customerName: dn.customerName,
    customerPhone: dn.customerPhone,
    customerEmail: dn.customerEmail,
    customerTrn: dn.customerTrn,
    billingAddress: dn.billingAddress,
    shippingAddress: dn.shippingAddress,
    notes: dn.notes,
    totalAmount: parseFloat(dn.totalAmount),
    currency: dn.currency,
    items: dn.items.map((i) => ({
      productName: i.productName,
      brand: i.brand,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: parseFloat(i.unitPrice),
      lineTotal: parseFloat(i.lineTotal),
    })),
  }
}

export function docFromOrder(order: Order): DeliveryNoteDoc {
  return {
    docNumber: order.orderNumber,
    date: new Date(order.createdAt),
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    customerTrn: null,
    billingAddress: order.customerAddress,
    shippingAddress: order.customerAddress,
    notes: order.notes,
    totalAmount: parseFloat(order.totalAmount),
    currency: order.currency,
    items: order.items.map((i) => ({
      productName: i.productName,
      brand: i.brand,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: parseFloat(i.unitPrice),
      lineTotal: parseFloat(i.lineTotal),
    })),
  }
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Generates a print-ready A4 Delivery Note (main copy + customer copy on
 * page 2) in a new window and opens the browser print dialog.
 */
export function printDeliveryNoteDoc(doc: DeliveryNoteDoc, settings: Settings | null) {
  const companyName = (settings?.companyName || "AYN AL FAHAD TRADING L.L.C.").toUpperCase()
  const currencySymbol = settings?.currencySymbol || ""
  const currency = doc.currency || settings?.currency || "AED"
  const totalQty = doc.items.reduce((s, i) => s + i.quantity, 0)
  const dateStr = fmtDate(doc.date)
  const billing = doc.billingAddress ? esc(doc.billingAddress) : "—"
  const shipping = doc.shippingAddress ? esc(doc.shippingAddress) : billing
  const logo = settings?.logoUrl || ""

  const css = `
    * {
      margin: 0; padding: 0; box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm 16mm 10mm; position: relative; }
    .page-break { page-break-before: always; }

    .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10mm; }
    .brand-block .logo-text { font-size: 26px; font-weight: 800; color: #14335e; letter-spacing: 1px; line-height: 1.1; }
    .brand-block .logo-sub { font-size: 15px; font-weight: 600; color: #14335e; letter-spacing: 3px; margin-top: 2px; }
    .brand-block .tagline { font-size: 9.5px; letter-spacing: 2.4px; color: #2e9ad4; font-weight: 700; margin-top: 6px; }
    .brand-block img { height: 58px; margin-bottom: 4px; }
    .hdr-right { text-align: right; }
    .brands { font-size: 13px; font-weight: 700; color: #14335e; margin-bottom: 8px; }
    .brands .sep { color: #c3cede; margin: 0 6px; font-weight: 300; }
    .cats { display: flex; gap: 18px; justify-content: flex-end; }
    .cat { text-align: center; font-size: 8.5px; color: #445; width: 58px; }
    .cat .ic { width: 34px; height: 34px; margin: 0 auto 3px; border: 1.5px solid #14335e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #14335e; }

    .doctitle { font-size: 30px; font-weight: 800; color: #14335e; letter-spacing: 0.5px; margin-bottom: 4mm; }
    .doctitle .accent { color: #2e9ad4; }
    .copy-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #2e9ad4; text-transform: uppercase; margin-bottom: 3mm; }
    .meta { font-size: 12.5px; margin-bottom: 7mm; }
    .meta .mrow { display: flex; margin-bottom: 3px; }
    .meta .lbl { width: 46px; font-weight: 700; color: #14335e; }

    .panels { display: flex; gap: 6mm; margin-bottom: 7mm; }
    .panel { flex: 1; border: 1px solid #d4e3f1; border-radius: 6px; overflow: hidden; }
    .panel h4 { background: #e9f3fb; color: #14335e; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 7px 14px; }
    .panel .body { padding: 12px 14px; font-size: 12px; }
    .panel .row { display: flex; margin-bottom: 8px; }
    .panel .row:last-child { margin-bottom: 0; }
    .panel .lbl { width: 100px; color: #555; }
    .panel .colon { margin-right: 10px; color: #aaa; }
    .panel .val { flex: 1; color: #1a1a2e; font-weight: 500; }

    table { width: 100%; border-collapse: collapse; }
    thead th { background: #14335e; color: #fff; font-size: 11px; font-weight: 700; padding: 9px 12px; text-align: left; letter-spacing: 0.3px; }
    thead th.c { text-align: center; }
    thead th.r { text-align: right; }
    tbody td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #e6ecf3; color: #222; }
    tbody td.c { text-align: center; }
    tbody td.r { text-align: right; }
    tbody tr:nth-child(even) td { background: #f2f7fc; }

    .mid { display: flex; justify-content: space-between; gap: 8mm; margin-top: 6mm; }
    .notes { flex: 1; font-size: 11.5px; color: #333; }
    .notes h5 { font-size: 12.5px; font-weight: 700; color: #14335e; margin-bottom: 7px; }
    .notes li { margin-left: 14px; margin-bottom: 4px; line-height: 1.45; }
    .totals { width: 250px; align-self: flex-start; border: 1px solid #d4e3f1; border-radius: 6px; overflow: hidden; }
    .totals .trow { display: flex; justify-content: space-between; padding: 9px 15px; font-size: 12px; background: #eaf3fb; }
    .totals .trow + .trow { border-top: 1px solid #d4e3f1; }
    .totals .lbl { color: #14335e; font-weight: 600; }
    .totals .val { font-weight: 700; color: #14335e; }
    .totals .trow.grand { background: #14335e; }
    .totals .trow.grand .lbl, .totals .trow.grand .val { color: #fff; }
    .totals .trow.grand .val { font-size: 14px; }

    .sign-wrap { display: flex; justify-content: space-between; margin-top: 10mm; gap: 10mm; }
    .sign { flex: 1; font-size: 11.5px; color: #333; position: relative; }
    .sign h6 { font-size: 10.5px; font-weight: 700; letter-spacing: 1.2px; color: #14335e; margin-bottom: 14px; text-transform: uppercase; }
    .sign .srow { display: flex; margin-bottom: 12px; }
    .sign .slbl { width: 82px; font-weight: 600; }
    .sign .sline { flex: 1; border-bottom: 1px solid #666; height: 14px; }
    .thanks { font-size: 12.5px; font-weight: 700; color: #2e9ad4; margin-top: 8mm; }
    .thanks .for { color: #14335e; font-weight: 600; margin-top: 2px; }

    .stamp { position: absolute; right: 10mm; top: -8mm; width: 82px; height: 82px; border-radius: 50%; border: 2.5px solid rgba(20,51,94,0.55); box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4.5px rgba(20,51,94,0.4); display: flex; align-items: center; justify-content: center; transform: rotate(-9deg); }
    .stamp .inner { text-align: center; font-size: 6.8px; font-weight: 700; color: rgba(20,51,94,0.6); letter-spacing: 0.4px; line-height: 1.5; }
    .stamp .inner .co { font-size: 7.5px; }

    .foot { position: absolute; left: 0; right: 0; bottom: 0; background: #14335e; color: #fff; padding: 10px 16mm; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; }
    .foot .contact span { margin-right: 18px; }
    .foot .tag { color: #a8cbe8; letter-spacing: 0.4px; }

    @media print {
      body { margin: 0; }
      .page { margin: 0; width: auto; min-height: auto; padding-bottom: 30mm; }
      @page { size: A4; margin: 0; }
    }
  `

  const itemsRows = doc.items
    .map(
      (item, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${esc(item.productName)}</td>
        <td>${item.brand ? esc(item.brand) : "—"}</td>
        <td>${item.sku ? esc(item.sku) : "—"}</td>
        <td class="c">${item.quantity}</td>
        <td class="r">${fmtNum(item.unitPrice)}</td>
        <td class="r">${fmtNum(item.lineTotal)}</td>
      </tr>`
    )
    .join("")

  const headerHtml = `
    <div class="hdr">
      <div class="brand-block">
        ${logo ? `<img src="${esc(logo)}" alt="">` : ""}
        <div class="logo-text">${esc(companyName.split(" TRADING")[0])}</div>
        <div class="logo-sub">TRADING L.L.C.</div>
        <div class="tagline">YOUR TRUSTED DISTRIBUTION PARTNER</div>
      </div>
      <div class="hdr-right">
        <div class="brands">Infinix <span class="sep">|</span> PHILIPS <span class="sep">|</span> Mcdodo</div>
        <div class="cats">
          <div class="cat"><div class="ic">📱</div>Mobile Phones</div>
          <div class="cat"><div class="ic">🎧</div>Accessories</div>
          <div class="cat"><div class="ic">🔌</div>Chargers &amp; More</div>
        </div>
      </div>
    </div>`

  const panelsHtml = `
    <div class="panels">
      <div class="panel">
        <h4>BILL TO</h4>
        <div class="body">
          <div class="row"><span class="lbl">Customer Name</span><span class="colon">:</span><span class="val">${esc(doc.customerName)}</span></div>
          <div class="row"><span class="lbl">Address</span><span class="colon">:</span><span class="val">${billing}</span></div>
          ${doc.customerTrn ? `<div class="row"><span class="lbl">TRN</span><span class="colon">:</span><span class="val">${esc(doc.customerTrn)}</span></div>` : ""}
          <div class="row"><span class="lbl">Contact</span><span class="colon">:</span><span class="val">${esc(doc.customerPhone)}</span></div>
        </div>
      </div>
      <div class="panel">
        <h4>SHIP TO</h4>
        <div class="body">
          <div class="row"><span class="lbl">Customer Name</span><span class="colon">:</span><span class="val">${esc(doc.customerName)}</span></div>
          <div class="row"><span class="lbl">Address</span><span class="colon">:</span><span class="val">${shipping}</span></div>
          <div class="row"><span class="lbl">Contact</span><span class="colon">:</span><span class="val">${esc(doc.customerPhone)}</span></div>
        </div>
      </div>
    </div>`

  const tableHtml = `
    <table>
      <thead>
        <tr>
          <th class="c">#</th>
          <th>Product Description</th>
          <th>Brand</th>
          <th>Model / SKU</th>
          <th class="c">Qty</th>
          <th class="r">Unit Price (${esc(currency)})</th>
          <th class="r">Total (${esc(currency)})</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>`

  const notesTotalsHtml = `
    <div class="mid">
      <div class="notes">
        <h5>Notes:</h5>
        <ul>
          ${doc.notes ? `<li>${esc(doc.notes)}</li>` : ""}
          <li>Goods are for your kind receipt and verification.</li>
          <li>Please check the items and quantity at the time of delivery.</li>
          <li>Any discrepancy must be reported within 24 hours.</li>
        </ul>
      </div>
      <div class="totals">
        <div class="trow"><span class="lbl">Total Quantity</span><span class="val">${totalQty}</span></div>
        <div class="trow grand"><span class="lbl">Total Amount (${esc(currency)})</span><span class="val">${fmtNum(doc.totalAmount)}</span></div>
      </div>
    </div>`

  const stampHtml = `
    <div class="stamp"><div class="inner">
      <div class="co">AYN AL FAHAD</div>
      <div>TRADING L.L.C.</div>
      <div>★</div>
      <div>DUBAI — UAE</div>
    </div></div>`

  const footerHtml = `
    <div class="foot">
      <div class="contact">
        <span>☎ ${esc(settings?.phoneNumber || "+971 2 123 4567")}</span>
        <span>✉ ${esc(settings?.contactEmail || "info@aynal-fahad.com")}</span>
        <span>📍 ${esc(settings?.address || "Dubai, UAE")}</span>
      </div>
      <div class="tag">Quality Products&nbsp; | &nbsp;Reliable Supply&nbsp; | &nbsp;Growing Together</div>
    </div>`

  // ---------- Main copy ----------
  const mainPage = `
    <div class="page">
      ${headerHtml}
      <div class="doctitle">DELIVERY <span class="accent">NOTE</span></div>
      <div class="meta">
        <div class="mrow"><span class="lbl">No:</span>${esc(doc.docNumber)}</div>
        <div class="mrow"><span class="lbl">Date:</span>${dateStr}</div>
      </div>
      ${panelsHtml}
      ${tableHtml}
      ${notesTotalsHtml}

      <div class="thanks">Thank you for your business!<div class="for">For ${esc(companyName.charAt(0) + companyName.slice(1).toLowerCase().replace(/l\.l\.c\./i, "L.L.C."))}</div></div>

      <div class="sign-wrap">
        <div class="sign">
          <h6>Customer Received By</h6>
          <div class="srow"><span class="slbl">Signature:</span><span class="sline"></span></div>
          <div class="srow"><span class="slbl">Name:</span><span class="sline"></span></div>
          <div class="srow"><span class="slbl">Date:</span><span class="sline"></span></div>
        </div>
        <div class="sign">
          <h6>Authorized Signature</h6>
          <div class="srow"><span class="slbl">Signature:</span><span class="sline"></span></div>
          <div class="srow"><span class="slbl">Name:</span><span class="sline"></span></div>
          <div class="srow"><span class="slbl">Designation:</span><span class="sline"></span></div>
          ${stampHtml}
        </div>
      </div>

      ${footerHtml}
    </div>`

  // ---------- Customer copy (compact, page 2) ----------
  const customerCopy = `
    <div class="page page-break">
      <div class="copy-label">Customer Copy</div>
      ${headerHtml}
      <div class="doctitle" style="font-size:24px">DELIVERY <span class="accent">NOTE</span></div>
      <div class="meta">
        <div class="mrow"><span class="lbl">No:</span>${esc(doc.docNumber)}</div>
        <div class="mrow"><span class="lbl">Date:</span>${dateStr}</div>
      </div>
      ${panelsHtml}
      ${tableHtml}
      ${notesTotalsHtml}
      <div class="sign-wrap">
        <div class="sign">
          <h6>Customer Received By</h6>
          <div class="srow"><span class="slbl">Signature:</span><span class="sline"></span></div>
          <div class="srow"><span class="slbl">Name:</span><span class="sline"></span></div>
          <div class="srow"><span class="slbl">Date:</span><span class="sline"></span></div>
        </div>
        <div class="sign">
          <h6>Company Stamp</h6>
          ${stampHtml.replace('top: -8mm', 'top: 2mm')}
        </div>
      </div>
      ${footerHtml}
    </div>`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Delivery Note ${esc(doc.docNumber)}</title><style>${css}</style></head>
<body>
${mainPage}
${customerCopy}
<script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
