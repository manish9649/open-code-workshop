ALTER TYPE public.donation_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TABLE public.donations ADD COLUMN reference_number text NOT NULL DEFAULT ('SSWD-' || upper(replace(gen_random_uuid()::text,'-',''))), ADD COLUMN screenshot_path text, ADD COLUMN submission_key uuid UNIQUE;
CREATE UNIQUE INDEX donation_reference_unique ON public.donations(reference_number);
CREATE UNIQUE INDEX donation_utr_unique ON public.donations(lower(transaction_ref)) WHERE transaction_ref <> '' AND payment_method='upi';
ALTER TABLE public.donations ADD CONSTRAINT donation_input_limits CHECK (char_length(donor_name) BETWEEN 2 AND 150 AND char_length(email)<=255 AND char_length(phone)<=20 AND char_length(transaction_ref)<=100 AND char_length(notes)<=2000 AND amount<=9999999999.99);
CREATE POLICY "admin donation screenshots" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='donation-screenshots' AND public.has_role(auth.uid(),'admin'));
