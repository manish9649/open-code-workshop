import { certificateDetails } from "@/lib/certificate-details";
import { inr, methodLabel, type Donation } from "@/lib/donations";
import { officeImageUrl } from "@/lib/member-certificate";

export const receiptEmailSubject = "Donation Receipt and Thank You Letter – Shiv Sewa Welfare Society";

/** Plain-text body for the receipt email; download links are appended by the sender. */
export function receiptEmailBody(d: Pick<Donation, "donor_name" | "amount"> & { receipt_number: string }) {
  return [
    `Dear ${d.donor_name},`,
    "",
    `Thank you for your generous donation of ${inr(d.amount)} to Shiv Sewa Welfare Society. Your payment has been verified.`,
    "",
    `Your donation receipt number is ${d.receipt_number}. Please use the links below to download your donation receipt and thank-you letter (links stay valid for 7 days).`,
    "",
    "With gratitude,",
    "Shiv Sewa Welfare Society",
    "Together for a Better Tomorrow.",
  ].join("\n");
}

export function receiptFileName(receiptNumber: string) {
  return `Donation-Receipt-${receiptNumber.replace(/[^A-Za-z0-9]+/g, "-")}`;
}
export function thankYouFileName(receiptNumber: string) {
  return `Thank-You-Letter-${receiptNumber.replace(/[^A-Za-z0-9]+/g, "-")}`;
}

const optionalImage = async (url: string) => {
  if (!url) return null;
  try {
    const result = await fetch(url);
    if (!result.ok) return null;
    return await createImageBitmap(await result.blob());
  } catch {
    return null;
  }
};
const indianDate = (v: string) => {
  const [y, m, d] = v.slice(0, 10).split("-");
  return `${d} / ${m} / ${y}`;
};

type Ctx = CanvasRenderingContext2D;
function makePage() {
  const W = 1240, H = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Receipt generation is unavailable in this browser.");
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const green = token("--letter-green"), ink = token("--letter-ink"), paper = token("--letter-paper"), muted = token("--certificate-muted");
  const font = (size: number, bold = false, italic = false) => `${italic ? "italic " : ""}${bold ? "700" : "400"} ${size}px Arial, Helvetica, sans-serif`;
  const text = (c: Ctx, value: string, x: number, y: number, size: number, opts: { color?: string; bold?: boolean; italic?: boolean; align?: CanvasTextAlign; max?: number } = {}) => {
    c.fillStyle = opts.color ?? ink; c.textAlign = opts.align ?? "left";
    let s = size; c.font = font(s, opts.bold, opts.italic);
    while (opts.max && c.measureText(value).width > opts.max && s > 12) { s -= 1; c.font = font(s, opts.bold, opts.italic); }
    c.fillText(value, x, y);
  };
  const paragraph = (c: Ctx, value: string, x: number, y: number, width: number, size: number, lh: number) => {
    c.textAlign = "left"; c.fillStyle = ink; c.font = font(size);
    let cx = x, cy = y;
    for (const w of value.split(/(\s+)/)) {
      if (!w) continue;
      const m = c.measureText(w).width;
      if (/^\s+$/.test(w)) { if (cx > x) cx += m; continue; }
      if (cx + m > x + width && cx > x) { cx = x; cy += lh; }
      c.fillText(w, cx, cy); cx += m;
    }
    return cy + lh;
  };
  const line = (c: Ctx, x1: number, y1: number, x2: number, y2: number, color = green, w = 2) => { c.strokeStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  const fit = (c: Ctx, img: ImageBitmap, x: number, y: number, w: number, h: number) => { const r = Math.min(w / img.width, h / img.height); c.drawImage(img, x + (w - img.width * r) / 2, y + (h - img.height * r) / 2, img.width * r, img.height * r); };
  const letterhead = (c: Ctx, title: string) => {
    c.fillStyle = paper; c.fillRect(0, 0, W, H);
    text(c, "SHIV SEVA", W / 2, 105, 50, { color: green, bold: true, align: "center" });
    text(c, "WELFARE SOCIETY", W / 2, 154, 32, { align: "center" });
    text(c, "SERVICE | HUMANITY | SOCIAL WELFARE", W / 2, 186, 17, { color: muted, italic: true, align: "center" });
    text(c, `Registration No.: ${certificateDetails.registrationNumber}    UID: ${certificateDetails.uniqueIdentificationNumber}`, W / 2, 226, 18, { align: "center" });
    line(c, 50, 280, W - 50, 280, green, 5);
    text(c, title, W / 2, 332, 35, { color: green, align: "center" });
  };
  const signatureBlock = (c: Ctx, president: ImageBitmap | null, seal: ImageBitmap | null, y: number) => {
    const L = 93, R = W - 93, cw = (R - L) / 2, th = 110;
    c.strokeStyle = token("--letter-rule"); c.lineWidth = 2; c.strokeRect(L, y, R - L, th);
    line(c, L + cw, y, L + cw, y + th, token("--letter-rule"));
    if (president) fit(c, president, L + 8, y + 6, cw - 16, th - 12);
    if (seal) fit(c, seal, L + cw + 8, y + 6, cw - 16, th - 12);
    text(c, "Authorized Signatory", L + cw / 2, y + th + 30, 20, { align: "center" });
    text(c, "Society Seal / Stamp", L + cw + cw / 2, y + th + 30, 20, { align: "center" });
    return y + th + 60;
  };
  const toPdf = async (title: string) => {
    const preview = canvas.toDataURL("image/png");
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    doc.setTitle(title); doc.setAuthor(certificateDetails.societyName);
    const image = await doc.embedPng(preview);
    const page = doc.addPage([595.28, 841.89]); page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
    const bytes = await doc.save();
    return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  };
  return { W, H, canvas, ctx, green, ink, muted, text, paragraph, line, letterhead, signatureBlock, toPdf };
}

async function loadOfficeImages() {
  const [presidentUrl, sealUrl] = await Promise.all([officeImageUrl("president"), officeImageUrl("seal")]);
  return Promise.all([optionalImage(presidentUrl), optionalImage(sealUrl)]);
}

/** Donation receipt (bill) PDF for a verified donation. */
export async function generateDonationReceipt(d: Donation, receiptNumber: string) {
  await document.fonts.ready;
  const [president, seal] = await loadOfficeImages();
  const p = makePage();
  const { ctx, W, H, green, muted, text, line } = p;
  p.letterhead(ctx, "DONATION RECEIPT");
  const L = 93, R = W - 93;
  let y = 410;
  const field = (label: string, value: string) => {
    ctx.font = "700 23px Arial, Helvetica, sans-serif";
    text(ctx, label, L, y, 23, { bold: true });
    const lw = ctx.measureText(label).width;
    text(ctx, value, L + lw + 10, y, 23, { max: R - L - lw - 10 });
    y += 44;
  };
  field("Receipt No.:", receiptNumber);
  field("Receipt Date:", indianDate(d.verified_at ?? d.created_at));
  field("Received From:", d.donor_name);
  if (d.email) field("Email:", d.email);
  if (d.phone) field("Mobile:", d.phone);
  y += 6;
  line(ctx, L, y, R, y, green, 2); y += 50;
  field("Donation Amount:", inr(d.amount));
  field("Payment Method:", methodLabel(d.payment_method));
  if (d.transaction_ref) field("Transaction ID / UTR:", d.transaction_ref);
  field("Donation Date:", indianDate(d.created_at));
  field("Payment Status:", "Verified");
  y += 10;
  line(ctx, L, y, R, y, green, 2); y += 34;
  p.paragraph(ctx, "Thank you for your generous contribution. This receipt confirms that your donation has been received and verified by Shiv Sewa Welfare Society.", L, y, R - L, 20, 30);
  const end = p.signatureBlock(ctx, president, seal, 1310);
  text(ctx, "SHIV SEVA WELFARE SOCIETY | Official Donation Receipt", W / 2, H - 58, 14, { color: muted, align: "center" });
  president?.close(); seal?.close();
  void end;
  return p.toPdf(`Donation Receipt ${receiptNumber} — ${d.donor_name}`);
}

/** Thank-you letter PDF sent together with the receipt. */
export async function generateThankYouLetter(d: Donation) {
  await document.fonts.ready;
  const [president, seal] = await loadOfficeImages();
  const p = makePage();
  const { ctx, W, H, muted, text } = p;
  p.letterhead(ctx, "THANK YOU LETTER");
  const L = 93, R = W - 93;
  let y = 430;
  y = p.paragraph(ctx, `Dear ${d.donor_name},`, L, y, R - L, 24, 36) + 18;
  const message = [
    "Thank you for your generous contribution to Shiv Sewa Welfare Society. Your valuable support helps us continue our work towards social welfare, education, community development, and helping people in need.",
    "Your kindness and contribution make a meaningful difference in society.",
    "We sincerely appreciate your support.",
  ];
  for (const part of message) y = p.paragraph(ctx, part, L, y, R - L, 24, 38) + 14;
  y += 20;
  y = p.paragraph(ctx, "With gratitude,", L, y, R - L, 24, 36);
  y = p.paragraph(ctx, "Shiv Sewa Welfare Society", L, y, R - L, 24, 36);
  p.paragraph(ctx, "Together for a Better Tomorrow.", L, y, R - L, 24, 36);
  p.signatureBlock(ctx, president, seal, 1310);
  text(ctx, "SHIV SEVA WELFARE SOCIETY | Official Document", W / 2, H - 58, 14, { color: muted, align: "center" });
  president?.close(); seal?.close();
  return p.toPdf(`Thank You Letter — ${d.donor_name}`);
}

export function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the generated PDF."));
    reader.readAsDataURL(blob);
  });
}
