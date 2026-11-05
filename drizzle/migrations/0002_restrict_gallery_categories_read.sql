DROP POLICY IF EXISTS "public read cats" ON public.gallery_categories;
CREATE POLICY "read cats with published albums" ON public.gallery_categories FOR SELECT TO public
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.gallery_albums a WHERE a.category_id = gallery_categories.id AND a.published)
);