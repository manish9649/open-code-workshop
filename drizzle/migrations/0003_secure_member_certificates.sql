CREATE TABLE public.members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 certificate_number text NOT NULL UNIQUE DEFAULT ('SSWS-' || upper(gen_random_uuid()::text)),
 full_name text NOT NULL,
 father_name text NOT NULL,
 date_of_birth date NOT NULL,
 mobile text NOT NULL,
 email text NOT NULL,
 address text NOT NULL,
 joining_date date NOT NULL,
 membership_type text NOT NULL DEFAULT 'Member',
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','revoked')),
 notes text NOT NULL DEFAULT '',
 photo_path text NOT NULL,
 signature_path text NOT NULL,
 signatory_name text NOT NULL,
 certificate_path text NOT NULL DEFAULT '',
 created_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT member_text_limits CHECK (char_length(full_name) BETWEEN 2 AND 150 AND char_length(father_name) BETWEEN 2 AND 150 AND char_length(address) BETWEEN 10 AND 1000 AND char_length(email) <= 255 AND char_length(mobile) BETWEEN 10 AND 16 AND char_length(notes) <= 2000 AND char_length(signatory_name) BETWEEN 2 AND 150 AND membership_type IN ('Member','Volunteer','Life Member'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage members" ON public.members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.validate_member_record() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.date_of_birth > CURRENT_DATE OR NEW.joining_date < NEW.date_of_birth THEN RAISE EXCEPTION 'Invalid birth or joining date'; END IF;
 IF TG_OP = 'UPDATE' AND NEW.certificate_number <> OLD.certificate_number THEN RAISE EXCEPTION 'Certificate number cannot be changed'; END IF;
 NEW.updated_at = now();
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_member_record BEFORE INSERT OR UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.validate_member_record();
CREATE INDEX members_name_idx ON public.members(full_name);
CREATE POLICY "admins manage member files" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin'));
