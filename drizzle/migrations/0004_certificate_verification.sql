ALTER TABLE public.members ADD COLUMN certificate_design_version integer NOT NULL DEFAULT 1;
ALTER TABLE public.members ALTER COLUMN certificate_design_version SET DEFAULT 2;
COMMENT ON COLUMN public.members.certificate_design_version IS 'Stored PDF layout version; regenerate older designs on administrator request.';
CREATE FUNCTION public.verify_membership_certificate(certificate text)
RETURNS TABLE(certificate_number text, full_name text, joining_date date, issue_date date, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT m.certificate_number, m.full_name, m.joining_date, (m.created_at AT TIME ZONE 'Asia/Kolkata')::date, m.status
 FROM public.members m
 WHERE certificate ~ '^SSWS-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$'
 AND m.certificate_number = certificate
 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_membership_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_membership_certificate(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.verify_membership_certificate(text) IS 'Exact high-entropy certificate lookup only. Exposes name, certificate number, dates and status; never private member contact information or files.';