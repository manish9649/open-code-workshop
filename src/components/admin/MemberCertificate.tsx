import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { MemberView } from "@/lib/members";
import { generateCertificate, downloadCertificate } from "@/lib/member-certificate";
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
          if (uploadError) throw new Error("Certificate could not be stored. Please retry.");
          await save({ data: { id: member.id, updated_at: member.updated_at, path } });
          if (member.certificate_path) await supabase.storage.from("members").remove([member.certificate_path]);
          onStored();
        } else {
          const response = await fetch(member.certificate_url);
          if (!response.ok) throw new Error("Stored certificate could not be loaded. Reopen the member to refresh access.");
          output.blob = await response.blob();
        }
        if (!cancelled) setResult(output);
      } catch (e) { if (!cancelled) setError((e as Error).message || "Could not prepare the certificate."); }
    }
    void prepare();
    return () => { cancelled = true; };
  }, [member.id, attempt]);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto rounded-lg">
    <DialogTitle>Membership Certificate</DialogTitle><DialogDescription className="break-all">{member.certificate_number} · {member.status.toUpperCase()}</DialogDescription>
    {error ? <div role="alert" className="text-destructive"><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => setAttempt((v) => v + 1)}><RefreshCw />Retry</Button></div> : !result ? <p className="py-12 text-center text-muted-foreground">Preparing certificate…</p> : <>
      <img src={result.preview} alt={`Membership certificate for ${member.full_name}`} className="w-full border" />
      <div className="flex flex-wrap gap-2">
        <Button variant="saffron" onClick={() => downloadCertificate(result.blob, member.certificate_number)}><Download />Download PDF</Button>
      </div>
    </>}
  </DialogContent></Dialog>;
}