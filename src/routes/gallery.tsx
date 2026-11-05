import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Images, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import hero from "@/assets/community.webp";
import { PageHero, Reveal } from "@/components/site/Motion";
import { Lightbox } from "@/components/site/Lightbox";
import { coverOf, fetchAlbums, fetchCategories, formatDate, type GalleryAlbum } from "@/lib/gallery";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Our Work in Action — Photo Gallery | Shiv Sewa Welfare Society" },
      { name: "description", content: "Real photographs of Shiv Sewa Welfare Society’s social work: tree plantation, community help, and more." },
      { property: "og:title", content: "हमारे सेवा कार्य — तस्वीरों में" },
      { property: "og:description", content: "Photographs of Shiv Sewa Welfare Society’s real social work and service activities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GalleryPage,
});

const PAGE = 12;

function GalleryPage() {
  const albums = useQuery({ queryKey: ["gallery", "albums"], queryFn: fetchAlbums });
  const categories = useQuery({ queryKey: ["gallery", "categories"], queryFn: fetchCategories });
  const [filter, setFilter] = useState<string>("all");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<number | null>(null);

  const list = albums.data ?? [];
  const usedCats = (categories.data ?? []).filter((c) => list.some((a) => a.category_id === c.id));
  const shown = filter === "all" ? list : list.filter((a) => a.category_id === filter);
  const photos = useMemo(() => shown.flatMap((a) => a.photos.map((p) => ({ ...p, albumTitle: a.title }))), [shown]);
  const featured = list.filter((a) => a.featured).slice(0, 3);
  const catName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name;

  return (
    <>
      <PageHero eyebrow="Our Work in Action" title="हमारे सेवा कार्य — तस्वीरों में"
        image={hero} text="हर तस्वीर हमारी सेवा, समर्पण और समाज में सकारात्मक बदलाव की एक कहानी है। Shiv Sewa Welfare Society के सामाजिक कार्यों और जरूरतमंद लोगों की सहायता के यादगार पलों को देखें।" />

      <section className="mx-auto max-w-7xl px-6 py-16">
        {albums.isLoading && <p className="text-center text-muted-foreground">Loading photos…</p>}
        {albums.isError && <p role="alert" className="text-center text-destructive">Photos could not be loaded. Please refresh the page.</p>}
        {albums.isSuccess && list.length === 0 && <p className="text-center text-muted-foreground">Photos will appear here once albums are published.</p>}

        {featured.length > 0 && filter === "all" && (
          <div className="mb-16">
            <Reveal><h2 className="text-2xl font-extrabold text-forest md:text-3xl">Featured Events</h2></Reveal>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {featured.map((a) => <AlbumCard key={a.id} album={a} category={catName(a.category_id)} onOpen={() => { const i = photos.findIndex((p) => p.album_id === a.id); setOpen(i < 0 ? 0 : i); }} />)}
            </div>
          </div>
        )}

        {list.length > 0 && (
          <>
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
              {[{ id: "all", name: "All Photos" }, ...usedCats].map((c) => (
                <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => { setFilter(c.id); setLimit(PAGE); }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${filter === c.id ? "border-forest bg-forest text-forest-foreground" : "bg-card text-forest hover:border-saffron"}`}>{c.name}</button>
              ))}
            </div>
            <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {photos.slice(0, limit).map((p, i) => (
                <motion.button key={p.id} type="button" onClick={() => setOpen(i)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                  className="group mb-4 block w-full overflow-hidden rounded-lg bg-muted text-left" aria-label={`Open photo: ${p.caption || p.albumTitle}`}>
                  <img src={p.url} alt={p.caption || p.albumTitle} width={p.width ?? undefined} height={p.height ?? undefined} loading="lazy" decoding="async"
                    className="h-auto w-full transition-transform duration-700 group-hover:scale-105" />
                  {p.caption && <span className="block px-3 py-2 text-sm text-muted-foreground">{p.caption}</span>}
                </motion.button>
              ))}
            </div>
            {photos.length > limit && (
              <div className="mt-8 text-center"><button type="button" onClick={() => setLimit(limit + PAGE)} className="btn-forest">Load More Photos</button></div>
            )}
          </>
        )}
      </section>
      <Lightbox items={photos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}

function AlbumCard({ album, category, onOpen }: { album: GalleryAlbum; category?: string | undefined; onOpen: () => void }) {
  const cover = coverOf(album);
  return (
    <motion.article whileHover={{ y: -6 }} className="group overflow-hidden rounded-lg border bg-card shadow-soft">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="aspect-[4/3] overflow-hidden bg-muted">{cover && <img src={cover.url} alt={album.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}</div>
        <div className="p-5">
          {category && <span className="text-xs font-bold uppercase tracking-wide text-saffron">{category}</span>}
          <h3 className="mt-1 text-lg font-extrabold text-forest">{album.title}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {album.event_date && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(album.event_date)}</span>}
            {album.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{album.location}</span>}
            <span className="inline-flex items-center gap-1"><Images className="h-4 w-4" />{album.photos.length} photos</span>
          </div>
          {album.description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{album.description}</p>}
        </div>
      </button>
    </motion.article>
  );
}
