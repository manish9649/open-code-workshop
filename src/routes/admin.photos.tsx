import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Plus, Star, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase as typedSupabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose typing for gallery writes
const supabase = typedSupabase as any;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { coverOf, fetchAlbums, fetchCategories, GALLERY_BUCKET, type GalleryAlbum } from "@/lib/gallery";
import { adminHead } from "@/lib/admin-head";

export const Route = createFileRoute("/admin/photos")({
  head: () => adminHead("Gallery Administration", "Private society photo and event album management."),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const albums = useQuery({ queryKey: ["gallery", "albums"], queryFn: fetchAlbums });
  const cats = useQuery({ queryKey: ["gallery", "categories"], queryFn: fetchCategories });
  const [selected, setSelected] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["gallery"] });

  async function createAlbum() {
    const { data, error } = await supabase.from("gallery_albums").insert({ title: "New album" }).select("id").single();
    if (error) return alert(error.message);
    await refresh(); setSelected(data.id);
  }
  async function addCategory(e: FormEvent) {
    e.preventDefault(); if (!newCat.trim()) return;
    const { error } = await supabase.from("gallery_categories").insert({ name: newCat.trim(), sort_order: (cats.data?.length ?? 0) + 1 });
    if (error) alert(error.message); else { setNewCat(""); refresh(); }
  }
  const album = albums.data?.find((a) => a.id === selected);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold text-forest">Photo Gallery</h2><p className="text-sm text-muted-foreground">Upload event photos into albums. Published albums appear on the public Gallery page.</p></div>
        <Button asChild variant="outline"><Link to="/gallery">View public gallery</Link></Button>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-3">
          <Button variant="saffron" className="w-full" onClick={createAlbum}><Plus />New album</Button>
          {albums.data?.map((a) => (
            <button key={a.id} type="button" onClick={() => setSelected(a.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left ${selected === a.id ? "border-forest bg-secondary" : "bg-card"}`}>
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">{coverOf(a) && <img src={coverOf(a)!.url} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0"><p className="truncate font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{a.published ? "Published" : "Draft"} · {a.photos.length} photos</p></div>
            </button>
          ))}
          <form onSubmit={addCategory} className="space-y-2 border-t pt-4">
            <Label htmlFor="nc">Add a category</Label>
            <div className="flex gap-2"><Input id="nc" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Category name" /><Button type="submit" variant="outline">Add</Button></div>
          </form>
        </aside>
        <div>{albums.isLoading ? <p>Loading albums…</p> : albums.error ? <p className="text-destructive">Could not load albums: {(albums.error as Error).message}</p> : album ? <AlbumEditor key={album.id} album={album} categories={cats.data ?? []} onChange={refresh} onDeleted={() => { setSelected(null); refresh(); }} /> : <p className="text-muted-foreground">Select an album or create a new one.</p>}</div>
      </div>
    </div>
  );
}

function AlbumEditor({ album, categories, onChange, onDeleted }: { album: GalleryAlbum; categories: { id: string; name: string }[]; onChange: () => void; onDeleted: () => void }) {
  const [f, setF] = useState({ title: album.title, category_id: album.category_id ?? "", event_date: album.event_date ?? "", location: album.location, description: album.description });
  const [saved, setSaved] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number; failed: string[] } | null>(null);

  async function update(patch: Record<string, unknown>) {
    const { error } = await supabase.from("gallery_albums").update(patch).eq("id", album.id);
    if (error) alert(error.message); else onChange();
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    await update({ title: f.title.trim() || "Untitled album", category_id: f.category_id || null, event_date: f.event_date || null, location: f.location.trim(), description: f.description.trim() });
    setSaved("Saved"); setTimeout(() => setSaved(""), 2000);
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((x) => x.type.startsWith("image/"));
    const failed: string[] = [];
    setProgress({ done: 0, total: list.length, failed });
    let order = album.photos.length;
    for (const file of list) {
      const dims = await new Promise<{ w: number; h: number } | null>((res) => { const img = new Image(); img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => res(null); img.src = URL.createObjectURL(file); });
      const path = `${album.id}/${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase() || "jpg"}`;
      let ok = false;
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        ok = !error;
        if (error && attempt === 1) failed.push(`${file.name}: ${error.message}`);
      }
      if (ok) {
        const { error } = await supabase.from("gallery_photos").insert({ album_id: album.id, storage_path: path, width: dims?.w ?? null, height: dims?.h ?? null, sort_order: order++ });
        if (error) failed.push(`${file.name}: ${error.message}`);
      }
      setProgress((p) => p && { ...p, done: p.done + 1, failed });
    }
    onChange();
  }
  async function removePhoto(id: string, path: string) {
    if (!confirm("Delete this photo?")) return;
    if (album.cover_photo_id === id) await supabase.from("gallery_albums").update({ cover_photo_id: null }).eq("id", album.id);
    await supabase.from("gallery_photos").delete().eq("id", id);
    await supabase.storage.from(GALLERY_BUCKET).remove([path]);
    onChange();
  }
  async function move(i: number, dir: -1 | 1) {
    const a = album.photos[i], b = album.photos[i + dir];
    if (!a || !b) return;
    await supabase.from("gallery_photos").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("gallery_photos").update({ sort_order: a.sort_order }).eq("id", b.id);
    onChange();
  }
  async function caption(id: string, value: string) {
    await supabase.from("gallery_photos").update({ caption: value.trim() }).eq("id", id);
    onChange();
  }
  async function removeAlbum() {
    if (!confirm("Delete this whole album and all its photos?")) return;
    const paths = album.photos.map((p) => p.storage_path);
    await supabase.from("gallery_albums").update({ cover_photo_id: null }).eq("id", album.id);
    const { error } = await supabase.from("gallery_albums").delete().eq("id", album.id);
    if (error) return alert(error.message);
    if (paths.length) await supabase.storage.from(GALLERY_BUCKET).remove(paths);
    onDeleted();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button variant={album.published ? "outline" : "saffron"} onClick={() => update({ published: !album.published })}>{album.published ? <><EyeOff />Unpublish</> : <><Eye />Publish</>}</Button>
        <Button variant="outline" onClick={() => update({ featured: !album.featured })}><Star className={album.featured ? "fill-current text-saffron" : ""} />{album.featured ? "Featured" : "Mark as featured"}</Button>
        <Button variant="outline" className="text-destructive" onClick={removeAlbum}><Trash2 />Delete album</Button>
        <span className="self-center text-sm text-muted-foreground">Status: {album.published ? "Published — visible to visitors" : "Draft — only you can see it"}</span>
      </div>
      <form onSubmit={save} className="grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
        <div className="md:col-span-2"><Label htmlFor="t">Event name</Label><Input id="t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={150} /></div>
        <div><Label htmlFor="c">Category</Label>
          <select id="c" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} className="mt-1 h-10 w-full rounded-md border bg-background px-3">
            <option value="">— Choose —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><Label htmlFor="d">Date (optional)</Label><Input id="d" type="date" value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} /></div>
        <div className="md:col-span-2"><Label htmlFor="l">Location (optional)</Label><Input id="l" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} maxLength={150} /></div>
        <div className="md:col-span-2"><Label htmlFor="ds">Description (optional)</Label><Textarea id="ds" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} /></div>
        <div className="flex items-center gap-3"><Button type="submit" variant="saffron">Save details</Button>{saved && <span role="status" className="text-sm text-forest">{saved}</span>}</div>
      </form>
      <div>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-card p-8 text-center hover:border-saffron">
          <ImagePlus className="h-8 w-8 text-saffron" /><span className="font-semibold">Add photos</span><span className="text-sm text-muted-foreground">Select one or many photos (up to 20 MB each). Originals are kept at full quality.</span>
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        </label>
        {progress && (
          <div className="mt-3 text-sm" role="status">
            Uploaded {progress.done} of {progress.total}
            <div className="mt-1 h-2 overflow-hidden rounded bg-muted"><div className="h-full bg-saffron transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
            {progress.failed.map((x) => <p key={x} className="text-destructive">{x}</p>)}
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {album.photos.map((p, i) => (
          <div key={p.id} className="overflow-hidden rounded-lg border bg-card">
            <div className="relative aspect-[4/3] bg-muted"><img src={p.url} alt={p.caption || album.title} className="h-full w-full object-contain" />
              {album.cover_photo_id === p.id && <span className="absolute left-2 top-2 rounded bg-saffron px-2 py-0.5 text-xs font-bold text-saffron-foreground">Cover</span>}</div>
            <div className="space-y-2 p-3">
              <Input defaultValue={p.caption} placeholder="Caption (optional)" aria-label="Caption" onBlur={(e) => e.target.value !== p.caption && caption(p.id, e.target.value)} />
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                <Button size="sm" variant="outline" aria-label="Move later" disabled={i === album.photos.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                <Button size="sm" variant="outline" onClick={() => update({ cover_photo_id: p.id })}>Set cover</Button>
                <Button size="sm" variant="outline" className="text-destructive" aria-label="Delete photo" onClick={() => removePhoto(p.id, p.storage_path)}><Trash2 /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
