import { supabase as typedSupabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tables not yet in generated types
const supabase = typedSupabase as any;

export const GALLERY_BUCKET = "gallery";

export type GalleryCategory = { id: string; name: string; description: string; sort_order: number };
export type GalleryPhoto = { id: string; album_id: string; storage_path: string; caption: string; width: number | null; height: number | null; sort_order: number; url?: string | undefined };
export type GalleryAlbum = {
  id: string; title: string; category_id: string | null; event_date: string | null; location: string; description: string;
  cover_photo_id: string | null; published: boolean; featured: boolean; created_at: string; photos: GalleryPhoto[];
};

/** Private bucket: photos are served through short-lived signed links. */
export async function signPhotos(photos: GalleryPhoto[]): Promise<GalleryPhoto[]> {
  if (!photos.length) return photos;
  const { data, error } = await supabase.storage.from(GALLERY_BUCKET).createSignedUrls(photos.map((p) => p.storage_path), 60 * 60 * 6);
  if (error) throw error;
  const map = new Map<string, string>((data as { path: string; signedUrl: string }[]).map((d) => [d.path, d.signedUrl]));
  return photos.map((p) => ({ ...p, url: map.get(p.storage_path) ?? undefined }));
}

export async function fetchCategories(): Promise<GalleryCategory[]> {
  const { data, error } = await supabase.from("gallery_categories").select("id,name,description,sort_order").order("sort_order");
  if (error) throw error;
  return data;
}

/** RLS returns only published albums to visitors; admins also see drafts. */
export async function fetchAlbums(): Promise<GalleryAlbum[]> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select("*, photos:gallery_photos!gallery_photos_album_id_fkey(id,album_id,storage_path,caption,width,height,sort_order)")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const albums = data as unknown as GalleryAlbum[];
  const all = await signPhotos(albums.flatMap((a) => a.photos));
  const byId = new Map(all.map((p) => [p.id, p]));
  return albums.map((a) => ({ ...a, photos: a.photos.map((p) => byId.get(p.id)!).sort((x, y) => x.sort_order - y.sort_order) }));
}

/** Home-page preview: only the first `limit` photos are signed, not every photo in every album. */
export async function fetchPreviewPhotos(limit = 6): Promise<(GalleryPhoto & { title: string })[]> {
  const albums = await fetchAlbumsRaw();
  const photos = albums.flatMap((a) => a.photos.map((p) => ({ ...p, title: a.title }))).slice(0, limit);
  return signPhotos(photos) as Promise<(GalleryPhoto & { title: string })[]>;
}

async function fetchAlbumsRaw(): Promise<GalleryAlbum[]> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select("*, photos:gallery_photos!gallery_photos_album_id_fkey(id,album_id,storage_path,caption,width,height,sort_order)")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as GalleryAlbum[];
}

export function coverOf(album: GalleryAlbum) {
  return album.photos.find((p) => p.id === album.cover_photo_id) ?? album.photos[0];
}

export function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
