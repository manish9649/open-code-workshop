import { supabase } from "@/integrations/supabase/client";
import { site } from "@/lib/site";
import type { MemberView } from "@/lib/members";
import { certificateDetails } from "@/lib/certificate-details";

export async function imageToPng(file: File) {
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This photo could not be opened. Please choose a valid JPG, PNG or WebP photo."); }
  const ratio = Math.min(1, 700 / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas"); c.width = Math.round(bitmap.width * ratio); c.height = Math.round(bitmap.height * ratio);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Images could not be prepared.");
  ctx.drawImage(bitmap, 0, 0, c.width, c.height); bitmap.close();
  return await new Promise<Blob>((resolve, reject) => c.toBlob((b) => b ? resolve(b) : reject(new Error("Image conversion failed.")), "image/png"));
}

export async function uploadMemberImage(file: File, folder: string, kind: "photo" | "signature") {
  const blob = await imageToPng(file);
  const path = `records/${folder}/${kind}-${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from("members").upload(path, blob, { contentType: "image/png" });
  if (error) throw new Error("Image upload failed. Please try again.");
  return path;
}

export async function memberImageUrls(photo: string, signature: string) {
  const signed = async (path: string) => {
    if (!path) return "";
    const { data, error } = await supabase.storage.from("members").createSignedUrl(path, 900);
    if (error || !data?.signedUrl) throw new Error("Could not load member images.");
    return data.signedUrl;
  };
  const [photo_url, signature_url] = await Promise.all([signed(photo), signed(signature)]);
  return { photo_url, signature_url };
}

async function loadImage(url: string) {
  const result = await fetch(url);
  if (!result.ok) throw new Error("Could not load the photograph or signature. Reopen the member to try again.");
  return createImageBitmap(await result.blob());
}

// Letter signatures & seal uploaded by the admin live in fixed private folders.
export const officeImageFolders = {
  president: "0f1e0000-0000-4000-8000-000000000001",
  secretary: "0f1e0000-0000-4000-8000-000000000002",
  seal: "0f1e0000-0000-4000-8000-000000000003",
} as const;
export type OfficeImageKind = keyof typeof officeImageFolders;

export async function officeImageUrl(kind: OfficeImageKind) {
  const folder = `records/${officeImageFolders[kind]}`;
  const { data, error } = await supabase.storage.from("members").list(folder, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
  const file = data?.find((f) => f.name.endsWith(".png"));
  if (error || !file) return "";
  const { data: signed } = await supabase.storage.from("members").createSignedUrl(`${folder}/${file.name}`, 900);
  return signed?.signedUrl ?? "";
}

export async function uploadOfficeImage(kind: OfficeImageKind, file: File) {
  const folder = `records/${officeImageFolders[kind]}`;
  const { data: old } = await supabase.storage.from("members").list(folder, { limit: 100 });
  await uploadMemberImage(file, officeImageFolders[kind], "signature");
  const stale = (old ?? []).map((f) => `${folder}/${f.name}`);
  if (stale.length) await supabase.storage.from("members").remove(stale);
}

const optionalImage = async (url: string) => { if (!url) return null; try { return await loadImage(url); } catch { return null; } };
const indianDate = (v: string) => { const [y, m, d] = v.slice(0, 10).split("-"); return `${d} / ${m} / ${y}`; };

export async function generateCertificate(member: MemberView) {
  await document.fonts.ready;
  const [presidentUrl, secretaryUrl, sealUrl] = await Promise.all([officeImageUrl("president"), officeImageUrl("secretary"), officeImageUrl("seal")]);
  const [photo, president, secretary, seal] = await Promise.all([
    member.photo_url ? loadImage(member.photo_url) : Promise.resolve(null),
    optionalImage(presidentUrl), optionalImage(secretaryUrl), optionalImage(sealUrl),
  ]);
  const W = 1240, H = 1754;
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Letter generation is unavailable in this browser.");
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const green = token("--letter-green"), light = token("--letter-green-light"), ink = token("--letter-ink"), paper = token("--letter-paper"), muted = token("--certificate-muted");
  const serif = 'Arial, Helvetica, sans-serif';
  const societyName = "Shiv Seva Welfare Society";
  const font = (size: number, bold = false, italic = false) => `${italic ? "italic " : ""}${bold ? "700" : "400"} ${size}px ${serif}`;
  const text = (value: string, x: number, y: number, size: number, opts: { color?: string; bold?: boolean; italic?: boolean; align?: CanvasTextAlign; max?: number } = {}) => {
    ctx.fillStyle = opts.color ?? ink; ctx.textAlign = opts.align ?? "left";
    let s = size; ctx.font = font(s, opts.bold, opts.italic);
    while (opts.max && ctx.measureText(value).width > opts.max && s > 12) { s -= 1; ctx.font = font(s, opts.bold, opts.italic); }
    ctx.fillText(value, x, y);
  };
  // Rich text line: segments of [text, bold], wrapped within width.
  const paragraph = (segments: [string, boolean][], x: number, y: number, width: number, size: number, lh: number) => {
    const words: { w: string; b: boolean }[] = [];
    for (const [t, b] of segments) for (const w of t.split(/(\s+)/)) if (w) words.push({ w, b });
    let cx = x, cy = y; ctx.textAlign = "left"; ctx.fillStyle = ink;
    for (const { w, b } of words) {
      ctx.font = font(size, b); const m = ctx.measureText(w).width;
      if (/^\s+$/.test(w)) { if (cx > x) cx += m; continue; }
      if (cx + m > x + width && cx > x) { cx = x; cy += lh; }
      ctx.fillText(w, cx, cy); cx += m;
    }
    return cy + lh;
  };
  const line = (x1: number, y1: number, x2: number, y2: number, color = green, w = 2) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const fit = (img: ImageBitmap, x: number, y: number, w: number, h: number) => { const r = Math.min(w / img.width, h / img.height); ctx.drawImage(img, x + (w - img.width * r) / 2, y + (h - img.height * r) / 2, img.width * r, img.height * r); };

  ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
  // Match the uploaded white letterhead: no logo, coloured panel or outer frame.
  text("SHIV SEVA", W / 2, 105, 50, { color: green, bold: true, align: "center" });
  text("WELFARE SOCIETY", W / 2, 154, 32, { align: "center" });
  text("SERVICE | HUMANITY | SOCIAL WELFARE", W / 2, 186, 17, { color: muted, italic: true, align: "center" });
  text("Registered Office: ________________________________________", W / 2, 222, 18, { align: "center" });
  text("Registration No.: _________________    Contact: _________________", W / 2, 256, 18, { align: "center" });
  line(50, 310, W - 50, 310, green, 5);
  text("APPOINTMENT LETTER", W / 2, 358, 35, { color: green, align: "center" });
  // Addressee block + photo
  const L = 53, R = W - 53;
  let y = 414;
  const field = (label: string, value: string, maxW = 760) => { ctx.font = font(23, true); text(label, L, y, 23, { bold: true }); const lw = ctx.measureText(label).width; text(value, L + lw + 10, y, 23, { max: maxW - lw - 10 }); y += 39; };
  field("Letter No.:", member.letter_number);
  field("Date:", indianDate(member.created_at));
  text("To,", L, y, 23); y += 39;
  field("Mr./Ms.", member.full_name);
  field("Father's / Husband's Name:", member.father_name);
  ctx.font = font(23, true); text("Address:", L, y, 23, { bold: true });
  y = paragraph([[member.address, false]], L + ctx.measureText("Address:").width + 10, y, 760 - 110, 23, 34) + 12;
  const px = R - 230, py = 397;
  ctx.strokeStyle = green; ctx.lineWidth = 3; ctx.strokeRect(px, py, 215, 215);
  if (photo) fit(photo, px + 6, py + 6, 203, 203);
  else { text("PASTE", px + 107, py + 88, 19, { color: muted, align: "center" }); text("PHOTO", px + 107, py + 115, 19, { color: muted, align: "center" }); text("HERE", px + 107, py + 142, 19, { color: muted, align: "center" }); }
  y = Math.max(y, py + 235);
  const designation = member.membership_type;
  y = paragraph([["Subject: ", true], [`Appointment as ${designation} of ${societyName}`, false]], L, y, R - L, 21, 29) + 12;
  y = paragraph([[`Dear Mr./Ms. ${member.full_name},`, false]], L, y, R - L, 21, 29) + 12;
  y = paragraph([[`We are pleased to appoint you as ${designation} (Designation) of `, false], [societyName, true], [`, with effect from ${indianDate(member.joining_date)}, subject to the rules and regulations of the Society.`, false]], L, y, R - L, 21, 29) + 12;
  y = paragraph([["Your key responsibilities will include:", true]], L, y, R - L, 21, 29);
  const duties = ["Participating in social welfare, charitable and community development activities.", "Supporting the Society's programmes related to education, health and public welfare.", "Promoting the aims and objectives of the Society in a responsible manner.", "Following the Society's rules, maintaining discipline and protecting its reputation."];
  duties.forEach((d, i) => { text(`${i + 1}.`, L + 20, y, 22); y = paragraph([[d, false]], L + 55, y, R - L - 55, 21, 30); });
  y = paragraph([["We look forward to your sincere contribution and commitment towards the objectives of the Society. We welcome you and wish you success in this role.", false]], L, y + 10, R - L, 21, 29) + 14;
  text("For ", L, y, 23, { italic: true }); ctx.font = font(23, false, true); text(societyName.toUpperCase(), L + ctx.measureText("For ").width, y, 23, { italic: true, bold: true });
  // Three empty image boxes followed by the role, name and signature lines.
  const tx = L + 40, tr = R - 40, ty = y + 25, th = 86, cw = (tr - tx) / 3;
  ctx.strokeStyle = token("--letter-rule"); ctx.lineWidth = 2; ctx.strokeRect(tx, ty, tr - tx, th);
  line(tx + cw, ty, tx + cw, ty + th, token("--letter-rule"));
  line(tx + 2 * cw, ty, tx + 2 * cw, ty + th, token("--letter-rule"));
  [president, secretary, seal].forEach((img, i) => { if (img) fit(img, tx + cw * i + 8, ty + 6, cw - 16, th - 12); });
  ["President", "Secretary", "Society Seal / Stamp"].forEach((h, i) => text(h, tx + cw * i + cw / 2, ty + th + 20, 20, { align: "center" }));
  [0, 1].forEach((i) => {
    const x = tx + cw * i + 62;
    text("Name: __________________", x, ty + th + 57, 20);
    text("Signature: _______________", x, ty + th + 82, 20);
  });
  let ay = ty + th + 122;
  text("MEMBER'S ACCEPTANCE", L, ay, 23, { color: green });
  ay = paragraph([["I accept this appointment and agree to abide by the Society's rules and regulations.", false]], L, ay + 37, R - L, 21, 30) + 8;
  text("Member's Signature: _______________________", L, ay, 21);
  text("Date: ____ / ____ / ______", L + 470, ay, 21);
  text("SHIV SEVA WELFARE SOCIETY | Official Document", W / 2, H - 58, 14, { color: token("--letter-footer"), align: "center" });
  photo?.close(); president?.close(); secretary?.close(); seal?.close();
  const preview = canvas.toDataURL("image/png");
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`Appointment Letter — ${member.full_name}`); doc.setAuthor(site.name);
  const image = await doc.embedPng(preview);
  const page = doc.addPage([595.28, 841.89]); page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
  const bytes = await doc.save();
  return { preview, blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }) };
}

export function letterFileName(member: Pick<MemberView, "letter_number" | "full_name">) {
  return `Appointment-Letter-${(member.letter_number || member.full_name).replace(/[^A-Za-z0-9]+/g, "-")}`;
}

export function downloadCertificate(blob: Blob, number: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = `${number}.pdf`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function shareCertificate(blob: Blob, member: MemberView) {
  const file = new File([blob], `${letterFileName(member)}.pdf`, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `${site.name} Appointment Letter` }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; }
  } else downloadCertificate(blob, letterFileName(member));
}
/** Short, readable form of the certificate number for printing (QR keeps the full number). */
export function shortCertificateNumber(number: string) {
  const m = /^SSWS-([0-9A-F]{8})/i.exec(number);
  return m?.[1] ? `SSWS-${m[1].toUpperCase()}` : number;
}
