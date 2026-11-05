import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { certificateDetails } from "@/lib/certificate-details";
import { verificationNumberSchema } from "@/lib/members";
import { verifyCertificate } from "@/lib/certificate-verification.functions";

const verificationOptions = (certificate: string) => queryOptions({
  queryKey: ["certificate-verification", certificate],
  queryFn: () => certificate ? verifyCertificate({ data: certificate }) : Promise.resolve(null),
  staleTime: 0,
});

export const Route = createFileRoute("/verify-certificate")({
  validateSearch: (search: Record<string, unknown>) => ({ certificate: verificationNumberSchema.safeParse(search['certificate']).success ? verificationNumberSchema.parse(search['certificate']) : "" }),
  loaderDeps: ({ search }) => ({ certificate: search.certificate }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(verificationOptions(deps.certificate)),
  head: () => ({ meta: [
    { title: "Verify Membership Certificate | Shiv Sewa Welfare Society" },
    { name: "description", content: "Check the authenticity and current status of a Shiv Sewa Welfare Society membership certificate." },
    { property: "og:title", content: "Verify Membership | Shiv Sewa Welfare Society" },
    { property: "og:description", content: "Official membership certificate verification for Shiv Sewa Welfare Society." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { certificate } = Route.useSearch();
  const initial = useSuspenseQuery(verificationOptions(certificate));
  const verify = useServerFn(verifyCertificate);
  const [number, setNumber] = useState(certificate);
  const [result, setResult] = useState(initial.data);
  const [checked, setChecked] = useState(!!certificate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <main className="mx-auto min-h-[60dvh] max-w-3xl px-5 pb-16 pt-32">
    <p className="text-sm font-semibold text-forest">{certificateDetails.societyName}</p>
    <h1 className="mt-3 text-3xl font-bold text-forest sm:text-4xl">Certificate Verification</h1>
    <form className="mt-8" onSubmit={async (event) => {
      event.preventDefault(); setError("");
      const parsed = verificationNumberSchema.safeParse(number);
      if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter a valid certificate number."); setResult(null); setChecked(false); return; }
      setBusy(true);
      try { setResult(await verify({ data: parsed.data })); setChecked(true); }
      catch (e) { setError(e instanceof Error ? e.message : "Verification failed. Please try again."); setResult(null); setChecked(false); }
      finally { setBusy(false); }
    }}>
      <Label htmlFor="verify-number">Membership Certificate Number</Label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row"><Input id="verify-number" maxLength={60} value={number} onChange={(e) => setNumber(e.target.value)} className="min-w-0" /><Button type="submit" variant="saffron" disabled={busy}><Search />{busy ? "Checking…" : "Verify Certificate"}</Button></div>
    </form>
    {error && <p role="alert" className="mt-5 text-destructive">{error}</p>}
    {checked && <section role="status" className="mt-8 border-y py-7">
      {result ? <>
        <div className="flex items-center gap-3">{result.status === "active" ? <BadgeCheck className="h-8 w-8 text-forest" /> : <ShieldAlert className="h-8 w-8 text-destructive" />}<h2 className="text-xl font-bold">{result.status === "active" ? "Verified · Active Membership" : `Membership ${result.status}`}</h2></div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">{[["Member Name", result.full_name], ["Certificate Number", result.certificate_number], ["Joining Date", result.joining_date], ["Issue Date", result.issue_date], ["Registration Number", certificateDetails.registrationNumber], ["Unique Identification Number", certificateDetails.uniqueIdentificationNumber]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}</dl>
      </> : <h2 className="text-xl font-semibold">No matching certificate found</h2>}
    </section>}
  </main>;
}