import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/admin-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  beforeLoad: async () => { if (await isAdminUser()) throw redirect({ to: "/admin/dashboard" }); },
  head: () => ({
    meta: [
      { title: "Admin Login | Shiv Sewa Welfare Society" },
      { name: "description", content: "Administrator sign-in for Shiv Sewa Welfare Society." },
      { property: "og:title", content: "Admin Login" },
      { property: "og:description", content: "Administrator sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (forgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "If this email belongs to an administrator, a reset link has been sent." });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); return setMsg({ ok: false, text: "Incorrect email or password." }); }
    if (!(await isAdminUser())) {
      await supabase.auth.signOut(); setBusy(false);
      return setMsg({ ok: false, text: "This account does not have administrator access." });
    }
    navigate({ to: "/admin/dashboard", replace: true });
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 pb-16 pt-32">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3"><span className="rounded-full bg-forest p-2 text-primary-foreground"><Lock className="h-5 w-5" /></span>
          <h1 className="text-2xl font-extrabold text-forest">{forgot ? "Reset password" : "Admin Login"}</h1></div>
        <div><Label htmlFor="em">Admin email</Label><Input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {!forgot && (
          <div><Label htmlFor="pw">Password</Label>
            <div className="relative"><Input id="pw" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          </div>
        )}
        {msg && <p role="alert" className={`text-sm ${msg.ok ? "text-forest" : "text-destructive"}`}>{msg.text}</p>}
        <Button type="submit" variant="saffron" className="w-full" disabled={busy}>{busy ? "Please wait…" : forgot ? "Send reset link" : "Login"}</Button>
        <button type="button" className="text-sm font-semibold text-forest underline" onClick={() => { setForgot(!forgot); setMsg(null); }}>{forgot ? "Back to login" : "Forgot password?"}</button>
      </form>
    </section>
  );
}
