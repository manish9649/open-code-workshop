ALTER TABLE public.donations
  ADD COLUMN receipt_number text,
  ADD COLUMN receipt_path text,
  ADD COLUMN thank_you_path text,
  ADD COLUMN receipt_email_sent_at timestamptz,
  ADD COLUMN receipt_email_status text;

CREATE UNIQUE INDEX donations_receipt_number_key ON public.donations (receipt_number) WHERE receipt_number IS NOT NULL;

CREATE SEQUENCE public.donation_receipt_seq START 1;
GRANT USAGE ON SEQUENCE public.donation_receipt_seq TO service_role;

CREATE OR REPLACE FUNCTION public.assign_donation_receipt(donation_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  num text;
BEGIN
  SELECT d.receipt_number INTO num FROM public.donations d WHERE d.id = donation_id;
  IF num IS NOT NULL THEN RETURN num; END IF;
  num := 'SSW/RCPT/' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY') || '/' || lpad(nextval('public.donation_receipt_seq')::text, 4, '0');
  UPDATE public.donations d SET receipt_number = num WHERE d.id = donation_id AND d.receipt_number IS NULL;
  RETURN num;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assign_donation_receipt(uuid) FROM anon, authenticated;

CREATE POLICY "Admins manage donation receipts" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'donation-receipts' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'donation-receipts' AND public.has_role(auth.uid(), 'admin'));