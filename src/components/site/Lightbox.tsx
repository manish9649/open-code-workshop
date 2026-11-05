import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import type { GalleryPhoto } from "@/lib/gallery";

type Item = GalleryPhoto & { albumTitle?: string };

export function Lightbox({ items, index, onChange, onClose }: { items: Item[]; index: number | null; onChange: (i: number) => void; onClose: () => void }) {
  const open = index !== null;
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange(((index ?? 0) + 1) % items.length);
      if (e.key === "ArrowLeft") onChange(((index ?? 0) - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  }, [open, index, items.length, onChange, onClose]);
  const item = open ? items[index] : null;
  return (
    <AnimatePresence>
      {item && (
        <motion.div role="dialog" aria-modal="true" aria-label="Photo viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex flex-col bg-forest/95 text-forest-foreground backdrop-blur-sm" onClick={onClose}>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm opacity-80">{(index ?? 0) + 1} / {items.length}</span>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 hover:bg-forest-foreground/10"><X /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {items.length > 1 && <button type="button" aria-label="Previous photo" onClick={() => onChange(((index ?? 0) - 1 + items.length) % items.length)} className="absolute left-2 z-10 rounded-full bg-forest/60 p-3 hover:bg-forest md:left-6"><ChevronLeft /></button>}
            <motion.img key={item.id} src={item.url} alt={item.caption || item.albumTitle || "Social work photo"} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="max-h-[78vh] max-w-full rounded-md object-contain" />
            {items.length > 1 && <button type="button" aria-label="Next photo" onClick={() => onChange(((index ?? 0) + 1) % items.length)} className="absolute right-2 z-10 rounded-full bg-forest/60 p-3 hover:bg-forest md:right-6"><ChevronRight /></button>}
          </div>
          {(item.caption || item.albumTitle) && (
            <div className="px-6 pb-6 text-center" onClick={(e) => e.stopPropagation()}>
              {item.albumTitle && <p className="font-semibold">{item.albumTitle}</p>}
              {item.caption && <p className="mt-1 text-sm opacity-80">{item.caption}</p>}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
