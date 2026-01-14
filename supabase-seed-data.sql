-- ============================================================================
-- SUPABASE SEED DATA
-- Run this AFTER running schema.sql to populate initial data
-- ============================================================================

-- ============================================================================
-- INTENTS TABLE - Relationship Goals
-- ============================================================================
INSERT INTO public.intents (label, description, emoji, is_active) VALUES
  ('Dating', 'Looking for romantic connections', '💕', true),
  ('Hookups', 'Casual physical connections', '🔥', true),
  ('Friends', 'Platonic friendships only', '🤝', true),
  ('Long-term', 'Seeking committed relationships', '💍', true),
  ('New to ENM', 'Exploring ethical non-monogamy', '🌱', true),
  ('Couple seeking', 'Couple looking for others', '👫', true),
  ('Kitchen Table Poly', 'Everyone friendly with metamours', '🍽️', true),
  ('Parallel Poly', 'Separate relationships preferred', '↔️', true),
  ('Open Relationship', 'Primary partner, open to others', '🔓', true),
  ('Relationship Anarchy', 'No relationship hierarchy', '⚡', true),
  ('Events & Community', 'Looking for ENM community', '🎉', true),
  ('Swinging', 'Recreational swinging', '🎭', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTES FOR MANUAL SETUP
-- ============================================================================

/*

STORAGE BUCKET SETUP (Do this in Supabase Dashboard > Storage):

1. Create a private bucket called "photos"
   - Name: photos
   - Public: NO (unchecked)
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

2. Add these RLS policies to storage.objects:

   Policy Name: "Users can upload own photos"
   Operation: INSERT
   Policy definition:
   ```
   bucket_id = 'photos'
   AND (storage.foldername(name))[1] = auth.uid()::text
   ```

   Policy Name: "Users can view photos"
   Operation: SELECT
   Policy definition:
   ```
   bucket_id = 'photos'
   ```

   Policy Name: "Users can delete own photos"
   Operation: DELETE
   Policy definition:
   ```
   bucket_id = 'photos'
   AND (storage.foldername(name))[1] = auth.uid()::text
   ```

AUTHENTICATION SETUP (Do this in Supabase Dashboard > Authentication):

1. Settings > Email Auth:
   - Enable Email Signup
   - Enable Email Confirmations (optional - for production)
   - Set Site URL: https://your-app-url.com (or localhost for dev)
   - Add Redirect URLs: https://your-app-url.com/auth/callback

2. Settings > URL Configuration:
   - Site URL: https://your-app-url.com
   - Redirect URLs: Add your app's deep link URLs if using Expo

3. Email Templates (optional):
   - Customize confirmation email template
   - Customize password reset template

VERIFICATION CHECKLIST:

After running schema.sql and this seed file, verify in Supabase Dashboard:

□ Table Editor shows 20+ tables (users, profiles, messages, etc.)
□ Storage shows "photos" bucket (private)
□ RLS is enabled on all tables
□ Authentication > Settings shows Email provider enabled
□ SQL Editor > "intents" table has 12 rows
□ API keys are copied to .env file

*/
