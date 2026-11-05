import { supabase } from "@/integrations/supabase/client";
import { site } from "@/lib/site";
import type { MemberView } from "@/lib/members";
import { certificateDetails, certificateIssueDate, certificateVerificationUrl } from "@/lib/certificate-details";

export async function imageToPng(file: File) {
  const bitmap = await createImageBitmap(file);
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

export async function generateCertificate(member: MemberView) {
  await document.fonts.ready;
  const QRCode = await import("qrcode");
  const [photo, signature, qr] = await Promise.all([
    member.photo_url ? loadImage(member.photo_url) : Promise.resolve(null),
    loadImage(member.signature_url),
    QRCode.toCanvas(certificateVerificationUrl(member.certificate_number), { width: 210, margin: 4, errorCorrectionLevel: "M" }),
  ]);
  const canvas = document.createElement("canvas"); canvas.width = 1684; canvas.height = 1190;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Certificate generation is unavailable in this browser.");
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const navy = token("--certificate-navy"), gold = token("--certificate-gold"), paper = token("--certificate-paper"), muted = token("--certificate-muted");
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 1684, 1190);
  ctx.strokeStyle = gold; ctx.lineWidth = 6; ctx.strokeRect(35, 35, 1614, 1120);
  ctx.lineWidth = 1.5; ctx.strokeRect(51, 51, 1582, 1088);
  // Symmetrical, geometric print ornaments, not a fabricated signature.
  for (const [x, y, angle] of [[65, 65, 0], [1619, 65, Math.PI / 2], [1619, 1125, Math.PI], [65, 1125, -Math.PI / 2]] as const) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.strokeStyle = gold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 105); ctx.lineTo(0, 0); ctx.lineTo(105, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 70); ctx.lineTo(15, 15); ctx.lineTo(70, 15); ctx.stroke();
    ctx.translate(27, 27); ctx.rotate(Math.PI / 4); ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
  }
  const text = (value: string, y: number, size: number, color = navy, bold = false, maxWidth = 1400, x = 842, align: CanvasTextAlign = "center", serif = false) => {
    ctx.fillStyle = color; ctx.textAlign = align;
    let s = size;
    const font = () => `${bold ? "700" : "400"} ${s}px ${serif ? 'Georgia, "Times New Roman", serif' : '"Plus Jakarta Sans", sans-serif'}`;
    ctx.font = font();
    while (ctx.measureText(value).width > maxWidth && s > 12) { s -= 1; ctx.font = font(); }
    ctx.fillText(value, x, y);
  };
  // Preserve the website's actual society mark.
  ctx.save(); ctx.translate(790, 90); ctx.scale(2.2, 2.2);
  ctx.fillStyle = token("--forest"); ctx.beginPath(); ctx.arc(24, 24, 23, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = token("--saffron"); ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(24, 24, 19, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = token("--saffron"); ctx.fill(new Path2D("M24 12c3 4 4 7 0 11-4-4-3-7 0-11z"));
  ctx.fillStyle = token("--cream"); ctx.fill(new Path2D("M12 26c3 0 6 2 8 5l4 4 4-4c2-3 5-5 8-5-1 6-6 11-12 11s-11-5-12-11z")); ctx.restore();
  text(certificateDetails.societyName.toUpperCase(), 257, 38, navy, true);
  text("Together for a Better Tomorrow", 301, 22, muted);
  text("NGO MEMBER CERTIFICATE", 405, 64, navy, true, 1420, 842, "center", true);
  ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(450, 440); ctx.lineTo(1234, 440); ctx.stroke();
  text(`Membership Certificate No. ${member.certificate_number}`, 485, 19, muted);
  const center = photo ? 1000 : 842;
  const width = photo ? 1040 : 1370;
  if (photo) {
    const r = Math.min(218 / photo.width, 245 / photo.height);
    ctx.drawImage(photo, 127 + (218 - photo.width * r) / 2, 539 + (245 - photo.height * r) / 2, photo.width * r, photo.height * r);
    ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(119, 531, 234, 261);
  }
  text("This is to certify that", 561, 28, navy, false, width, center);
  text(member.full_name, 636, 61, navy, true, width, center, "center", true);
  text("is an esteemed member of Shiv Sewa Welfare Society,", 691, 25, navy, false, width, center);
  text("committed to supporting our mission of creating a better", 737, 25, navy, false, width, center);
  text("and more compassionate society.", 783, 25, navy, false, width, center);
  const joining = new Date(member.joining_date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  text(`Joining date: ${joining}`, 866, 22, navy, false, 690, 475);
  text(`Issue date: ${certificateIssueDate(member.created_at)}`, 866, 22, navy, false, 690, 1210);
  text(`Certificate status: ${member.status.toUpperCase()}`, 909, 18, muted, true);
  ctx.drawImage(qr, 113, 935, 155, 155);
  text("Verify membership", 1112, 15, muted, false, 220, 191);
  const sr = Math.min(250 / signature.width, 86 / signature.height);
  ctx.drawImage(signature, 1232 + (250 - signature.width * sr) / 2, 952 + (86 - signature.height * sr) / 2, signature.width * sr, signature.height * sr);
  ctx.strokeStyle = gold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(1207, 1046); ctx.lineTo(1512, 1046); ctx.stroke();
  text(certificateDetails.signatoryName, 1076, 23, navy, true, 310, 1360);
  text("Authorized Signatory", 1105, 17, muted, false, 310, 1360);
  text(`Registration No. ${certificateDetails.registrationNumber}`, 993, 18, muted, false, 800);
  text(`Unique Identification No. ${certificateDetails.uniqueIdentificationNumber}`, 1030, 18, muted, false, 800);
  text(site.email, 1084, 18, navy, false, 800);
  photo?.close(); signature.close();
  const preview = canvas.toDataURL("image/png");
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`Membership Certificate — ${member.full_name}`); doc.setAuthor(site.name);
  const image = await doc.embedPng(preview);
  const page = doc.addPage([841.89, 595.28]); page.drawImage(image, { x: 0, y: 0, width: 841.89, height: 595.28 });
  const bytes = await doc.save();
  return { preview, blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }) };
}

export function downloadCertificate(blob: Blob, number: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = `${number}.pdf`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function shareCertificate(blob: Blob, member: MemberView) {
  const file = new File([blob], `${member.certificate_number}.pdf`, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `${site.name} Membership Certificate` }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; }
  } else downloadCertificate(blob, member.certificate_number);
}