
CREATE POLICY "users read own recordings files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users upload own recordings files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users update own recordings files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users delete own recordings files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
