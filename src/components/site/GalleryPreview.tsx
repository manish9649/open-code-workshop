import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { fetchPreviewPhotos } from "@/lib/gallery";
import { Reveal } from "./Motion";

export function GalleryPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const nearViewport = useInView(ref, { once: true, margin: "600px" });
  return <div ref={ref}>{nearViewport ? <GalleryPreviewContent /> : <div className="min-h-64" />}</div>;
}

function GalleryPreviewContent() {
  const { data, isPending } = useQuery({ queryKey: ["gallery", "preview"], queryFn: () => fetchPreviewPhotos(6), staleTime: 5 * 60_000 });
  if (isPending) return <div className="min-h-64" />;
  const photos = data ?? [];
  if (!photos.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal className="text-center">
        <span className="eyebrow">Our Work in Action</span>
        <h2 lang="hi" className="mt-3 text-3xl font-extrabold text-forest md:text-5xl">हमारे सेवा कार्य — तस्वीरों में</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Real moments from our service activities.</p>
      </Reveal>
      <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {photos.map((p) => (
          <motion.div key={p.id} initial={false}
            className="group aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <img src={p.url} alt={p.caption || p.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </motion.div>
        ))}
      </div>
      <div className="mt-10 text-center"><Link to="/gallery" className="btn-forest">View All Photos <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
  );
}
