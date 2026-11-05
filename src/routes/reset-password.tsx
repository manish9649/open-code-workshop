import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set New Password | Shiv Sewa Welfare Society" },
      { name: "description", content: "Choose a new administrator password." },
      { property: "og:title", content: "Set New Password" },
      { property: "og:description", content: "Choose a new administrator password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const recovery = typeof window !== "undefined" && window.location.hash.includes("type=recovery");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    navigate({ to: "/admin/dashboard", replace: true });
  }
  return (
    <section className="flex min-h-screen items-center justify-center px-6 pb-16 pt-32">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8">
        <h1 className="text-2xl font-extrabold text-forest">Set a new password</h1>
        {!recovery && <p className="text-sm text-muted-foreground">Open this page from the reset link in your email.</p>}
        <div><Label htmlFor="np">New password</Label><Input id="np" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
        <Button type="submit" variant="saffron" className="w-full">Save password</Button>
      </form>
    </section>
  );
}
