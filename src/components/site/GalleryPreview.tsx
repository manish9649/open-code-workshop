import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fetchPreviewPhotos } from "@/lib/gallery";
import { Reveal } from "./Motion";

export function GalleryPreview() {
  const { data } = useQuery({ queryKey: ["gallery", "preview"], queryFn: () => fetchPreviewPhotos(6) });
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
        {photos.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="group aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <img src={p.url} alt={p.caption || p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </motion.div>
        ))}
      </div>
      <div className="mt-10 text-center"><Link to="/gallery" className="btn-forest">View All Photos <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
  );
}
