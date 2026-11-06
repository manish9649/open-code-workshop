import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateMemberImage } from "@/lib/members";
import { officeImageUrl, uploadOfficeImage, type OfficeImageKind } from "@/lib/member-certificate";

const items: { kind: OfficeImageKind; label: string }[] = [
  { kind: "president", label: "President's Signature" },
  { kind: "secretary", label: "Secretary's Signature" },
  { kind: "seal", label: "Society Seal / Stamp" },
];

/** Admin uploads for the signatures and seal printed on every appointment letter. */
export function OfficeSignatures() {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => Promise.all(items.map(async (i) => [i.kind, await officeImageUrl(i.kind)] as const)).then((e) => setUrls(Object.fromEntries(e))).catch(() => {});
  useEffect(() => { void load(); }, []);
  async function upload(kind: OfficeImageKind, file?: File) {
    if (!file) return;
    try { validateMemberImage(file); setBusy(kind); await uploadOfficeImage(kind, file); await load(); toast.success("Saved. New appointment letters will use this image."); }
    catch (e) { toast.error((e as Error).message || "Upload failed."); } finally { setBusy(null); }
  }
  return <section className="py-5">
    <h3 className="mb-1 font-bold text-forest">Letter Signatures & Seal</h3>
    <p className="mb-3 text-sm text-muted-foreground">Upload clear images (PNG with transparent background works best).</p>
    <div className="grid gap-4 sm:grid-cols-3">{items.map(({ kind, label }) => <div key={kind} className="rounded-lg border p-3">
      <Label htmlFor={`office-${kind}`}>{label}</Label>
      <div className="my-2 flex h-20 items-center justify-center rounded bg-muted">{urls[kind] ? <img src={urls[kind]} alt={label} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">{busy === kind ? "Uploading…" : "Not uploaded"}</span>}</div>
      <Input id={`office-${kind}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busy} onChange={(e) => { void upload(kind, e.target.files?.[0]); e.target.value = ""; }} />
    </div>)}</div>
  </section>;
}
