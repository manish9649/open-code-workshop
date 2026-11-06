import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Printer, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { MemberView } from "@/lib/members";
import { generateCertificate, downloadCertificate, shareCertificate, letterFileName } from "@/lib/member-certificate";
import { saveMemberCertificate } from "@/lib/members.functions";
import { supabase } from "@/integrations/supabase/client";
import { certificateDetails } from "@/lib/certificate-details";

export function MemberCertificate({ member, onClose, onStored }: { member: MemberView; onClose: () => void; onStored: () => void }) {
  const [result, setResult] = useState<{ preview: string; blob: Blob } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const save = useServerFn(saveMemberCertificate);
  useEffect(() => {
    let cancelled = false;
    setError(""); setResult(null);
    async function prepare() {
      try {
        const output = await generateCertificate(member);
        if (cancelled) return;
        if (!member.certificate_path || member.certificate_design_version < certificateDetails.designVersion) {
          const path = `certificates/${member.id}/${crypto.randomUUID()}.pdf`;
          const { error: uploadError } = await supabase.storage.from("members").upload(path, output.blob, { contentType: "application/pdf" });
          if (uploadError) throw new Error("Appointment letter could not be saved. Please retry.");
          await save({ data: { id: member.id, updated_at: member.updated_at, path } });
          if (member.certificate_path) await supabase.storage.from("members").remove([member.certificate_path]);
          onStored();
        } else {
          const response = await fetch(member.certificate_url);
          if (!response.ok) throw new Error("Saved appointment letter could not be loaded. Reopen the member to refresh access.");
          output.blob = await response.blob();
        }
        if (!cancelled) setResult(output);
      } catch (e) { if (!cancelled) setError((e as Error).message || "Could not prepare the appointment letter."); }
    }
    void prepare();
    return () => { cancelled = true; };
  }, [member.id, attempt]);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto rounded-lg">
    <DialogTitle>Appointment Letter</DialogTitle><DialogDescription className="break-all">Letter No. {member.letter_number} · {member.status.toUpperCase()}</DialogDescription>
    {error ? <div role="alert" className="text-destructive"><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => setAttempt((v) => v + 1)}><RefreshCw />Retry</Button></div> : !result ? <p className="py-12 text-center text-muted-foreground">Preparing certificate…</p> : <>
      <img src={result.preview} alt={`Appointment letter for ${member.full_name}`} className="mx-auto w-full max-w-2xl border" />
      <div className="flex flex-wrap gap-2">
        <Button variant="saffron" onClick={() => downloadCertificate(result.blob, letterFileName(member))}><Download />Download PDF</Button>
        <Button variant="outline" onClick={() => printLetter(result.blob)}><Printer />Print</Button>
        <Button variant="outline" onClick={() => shareCertificate(result.blob, member).catch(() => toast.error("Could not share the letter."))}><Share2 />Share</Button>
      </div>
    </>}
  </DialogContent></Dialog>;
}
function printLetter(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.position = "fixed"; frame.style.width = "0"; frame.style.height = "0"; frame.style.border = "0";
  frame.src = url; document.body.appendChild(frame);
  frame.onload = () => { try { frame.contentWindow?.print(); } catch { window.open(url, "_blank"); } };
  setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 60_000);
}
