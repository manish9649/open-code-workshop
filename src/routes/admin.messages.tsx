import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Empty, PageTitle } from "@/components/admin/AdminBits";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Contact Messages | Admin" }, { name: "robots", content: "noindex" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const q = useQuery({
    queryKey: ["admin", "contact_submissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageTitle title="Contact Messages" />
      {q.isError && <p className="text-destructive">Could not load messages.</p>}
      {q.data && !q.data.length && <Empty>No messages yet.</Empty>}
      <div className="mt-4 space-y-4">
        {q.data?.map((m) => (
          <article key={m.id} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-bold text-forest">{m.subject}</h3>
              <time className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-IN")}</time>
            </div>
            <p className="mt-1 text-sm">{m.name} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a></p>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
