import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { selectCls } from "@/components/admin/AdminBits";
import { memberSchema, memberStatuses, membershipTypes, validateMemberImage, type MemberInput, type MemberView } from "@/lib/members";
import { saveMember, saveMemberCertificate } from "@/lib/members.functions";
import { generateCertificate, memberImageUrls, uploadMemberImage } from "@/lib/member-certificate";
import { supabase } from "@/integrations/supabase/client";
import { certificateDetails } from "@/lib/certificate-details";

export function MemberForm({ member, onClose, onSaved }: { member: MemberView | null; onClose: () => void; onSaved: (id: string) => void }) {
  const [form, setForm] = useState<MemberInput>(member ? memberSchema.parse({ ...member, signatory_name: certificateDetails.signatoryName }) : { full_name: "", father_name: "", date_of_birth: "", mobile: "", email: "", address: "", joining_date: new Date().toISOString().slice(0, 10), membership_type: "Member", status: "active", notes: "", signatory_name: certificateDetails.signatoryName });
  const [photo, setPhoto] = useState<File | null>(null);
  const signature: File | null = null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveMember);
  const saveCertificate = useServerFn(saveMemberCertificate);
  function set(key: keyof MemberInput, value: string) { setForm((prev) => ({ ...prev, [key]: value })); }
  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = memberSchema.safeParse(form);
    const issues: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) issues[String(issue.path[0])] = issue.message;
    for (const [key, file] of [["photo", photo], ["signature", signature]] as const) if (file) {
      try { validateMemberImage(file); } catch (error) { issues[key] = (error as Error).message; }
    }
    setErrors(issues);
    if (!parsed.success || Object.keys(issues).length) return;
    setBusy(true);
    const uploaded: string[] = [];
    let savedId = "";
    try {
      const folder = crypto.randomUUID();
      const photoPath = photo ? await uploadMemberImage(photo, folder, "photo") : member?.photo_path ?? "";
      if (photo) uploaded.push(photoPath);
      const signaturePath = member?.signature_path || await uploadMemberImage(new File([await (await fetch("/authorized-signature.png")).blob()], "signature.png", { type: "image/png" }), folder, "signature");
      if (!member?.signature_path) uploaded.push(signaturePath);
      if (signature) uploaded.push(signaturePath);
      const row = await save({ data: { ...(member ? { id: member.id } : {}), member: parsed.data, photo_path: photoPath, signature_path: signaturePath } });
      savedId = row.id;
      const urls = await memberImageUrls(row.photo_path, row.signature_path);
      const certificate = await generateCertificate({ ...row, ...urls, certificate_url: "" });
      const path = `certificates/${row.id}/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage.from("members").upload(path, certificate.blob, { contentType: "application/pdf" });
      if (error) throw new Error("Certificate upload failed.");
      await saveCertificate({ data: { id: row.id, updated_at: row.updated_at, path } });
      if (member) {
        const oldFiles = [photo ? member.photo_path : "", signature ? member.signature_path : "", member.certificate_path].filter(Boolean);
        if (oldFiles.length) await supabase.storage.from("members").remove(oldFiles);
      }
      toast.success(member ? "Member updated and certificate saved." : "Member registered and certificate saved.");
      onSaved(row.id);
    } catch (error) {
      if (savedId) {
        toast.warning("Member saved, but the certificate could not be saved. Open the certificate to retry.");
        onSaved(savedId);
      } else {
        if (uploaded.length) await supabase.storage.from("members").remove(uploaded);
        setErrors({ submit: (error as Error).message || "Could not save this member. Please try again." });
      }
    } finally { setBusy(false); }
  }
  const fields: { key: keyof MemberInput; label: string; type?: string; limit: number }[] = [
    { key: "full_name", label: "Full Name", limit: 150 }, { key: "father_name", label: "Father's Name", limit: 150 },
    { key: "date_of_birth", label: "Date of Birth", type: "date", limit: 10 }, { key: "joining_date", label: "Joining Date", type: "date", limit: 10 },
    { key: "mobile", label: "Mobile Number", type: "tel", limit: 16 }, { key: "email", label: "Email Address", type: "email", limit: 255 },
  ];
  const errorFor = (key: string) => errors[key] ? <p id={`error-${key}`} className="mt-1 text-xs text-destructive">{errors[key]}</p> : null;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-lg" aria-describedby="member-form-description">
      <DialogTitle>{member ? "Edit Member" : "Add Member"}</DialogTitle>
      <DialogDescription id="member-form-description">Shiv Sewa Welfare Society membership registration</DialogDescription>
      <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type, limit }) => <div key={key}>
          <Label htmlFor={`member-${key}`}>{label}</Label>
          <Input id={`member-${key}`} type={type ?? "text"} value={form[key]} maxLength={limit} onChange={(e) => set(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} />{errorFor(key)}
        </div>)}
        <div className="sm:col-span-2"><Label htmlFor="member-address">Full Address</Label><Textarea id="member-address" maxLength={1000} value={form.address} onChange={(e) => set("address", e.target.value)} aria-invalid={!!errors['address']} />{errorFor("address")}</div>
        <div><Label htmlFor="member-type">Membership Type</Label><select id="member-type" className={`${selectCls} w-full`} value={form.membership_type} onChange={(e) => set("membership_type", e.target.value)}>{membershipTypes.map((v) => <option key={v}>{v}</option>)}</select></div>
        <div><Label htmlFor="member-status">Certificate Status</Label><select id="member-status" className={`${selectCls} w-full capitalize`} value={form.status} onChange={(e) => set("status", e.target.value)}>{memberStatuses.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
        <div><Label htmlFor="member-photo">Member Photograph (optional){member ? " · replace" : ""}</Label><Input id="member-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />{member?.photo_url && <img src={member.photo_url} alt="Current member photograph" className="mt-2 h-16 w-16 rounded object-contain" />}{errorFor("photo")}</div>
        <div className="sm:col-span-2"><Label htmlFor="member-signatory_name">Authorized Signatory's Name</Label><Input id="member-signatory_name" value={form.signatory_name} readOnly />{errorFor("signatory_name")}</div>
        <div className="sm:col-span-2"><Label htmlFor="member-notes">Membership Notes (optional)</Label><Textarea id="member-notes" maxLength={2000} value={form.notes} onChange={(e) => set("notes", e.target.value)} />{errorFor("notes")}</div>
        {errors['submit'] && <p role="alert" className="text-sm text-destructive sm:col-span-2">{errors['submit']}</p>}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" variant="saffron" disabled={busy}>{busy ? "Saving member & certificate…" : "Save Member"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}