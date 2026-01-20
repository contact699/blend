# Supabase Setup Verification Guide

## Quick Manual Verification

### 1️⃣ Check Database Tables

Go to Supabase Dashboard → **Table Editor** and verify these tables exist:

**Core Tables (from schema.sql):**
- ✅ `users`
- ✅ `profiles`
- ✅ `photos`
- ✅ `likes`
- ✅ `matches`
- ✅ `chat_threads`
- ✅ `messages`
- ✅ `prompt_responses`
- ✅ `trust_scores`
- ✅ `date_reviews`
- ✅ `community_vouches`
- ✅ `user_taste_profiles`
- ✅ `profile_views`
- ✅ `blocked_users`

**Partner Linking (added by audit):**
- ✅ `partner_links`

**STI Safety (added by audit):**
- ✅ `sti_records`

**Events (from events-schema.sql):**
- ✅ `events`
- ✅ `event_rsvps`

**Push Notifications (from push-notifications-schema.sql):**
- ✅ `notification_preferences`
- ✅ `notification_log`

**Check if push_token columns exist:**
- Go to `users` table
- Check for columns: `push_token`, `push_token_updated_at`

---

### 2️⃣ Check Storage Bucket

Go to Supabase Dashboard → **Storage**:

- ✅ Bucket named `photos` exists
- ✅ Bucket is set to **PRIVATE** (not public)
- ✅ RLS policies are enabled

**Expected bucket configuration:**
```
Name: photos
Public: false (PRIVATE)
File Size Limit: 50MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

---

### 3️⃣ Check RLS Policies

Go to Supabase Dashboard → **Authentication** → **Policies**:

Each table should have policies like:
- "Users can view own data"
- "Users can insert own record"
- "Users can update own data"

**Critical policies to verify:**
- `users` - Users can view/update own data
- `profiles` - Users can view all, update own
- `photos` - Users can view all, manage own
- `partner_links` - Users can view all, manage own
- `sti_records` - Users can ONLY view/manage own
- `events` - Users can view public, manage own
- `messages` - Users can view threads they're in

---

### 4️⃣ Check Storage Policies

Go to Supabase Dashboard → **Storage** → `photos` bucket → **Policies**:

Expected policies:
- ✅ "Users can upload to own folder" (INSERT)
- ✅ "Users can view own photos" (SELECT)
- ✅ "Users can delete own photos" (DELETE)

Example policy:
```sql
-- Users can upload to own folder
(bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)
```

---

## 🧪 Test in App

If tables/bucket exist, test these features:

### Test 1: Profile Photo Upload
1. Open app
2. Go to Profile tab
3. Tap "Edit Profile"
4. Try uploading a photo
5. ✅ Should work without errors
6. ❌ If fails: Check storage bucket setup

### Test 2: Events
1. Go to Events tab
2. ✅ Should see "No events found" (not crash)
3. Try creating an event
4. ✅ Should save successfully
5. ❌ If crashes: Check `events` table exists

### Test 3: Partner Linking
1. Go to Profile → My Relationships
2. Tap "Link Partner"
3. Enter email and relationship type
4. ✅ Should send invitation
5. ❌ If fails: Check `partner_links` table exists

### Test 4: STI Safety
1. Go to Profile → My Relationships
2. Scroll to STI Safety section
3. Tap "Add First Test"
4. Fill in test details
5. ✅ Should save successfully
6. ❌ If fails: Check `sti_records` table exists

### Test 5: Matching & Messaging
1. Go to Discover tab
2. Like someone who liked you
3. Check for "It's a Match!" modal
4. Tap "Send a Message"
5. ✅ Should open chat screen
6. Send a test message
7. ✅ Message should appear
8. ❌ If fails: Check `matches`, `chat_threads`, `messages` tables

---

## 🔍 SQL Verification Queries

Run these in Supabase SQL Editor to verify setup:

### Check all tables exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check push notification columns:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('push_token', 'push_token_updated_at');
```

### Check storage bucket:
```sql
SELECT id, name, public
FROM storage.buckets
WHERE name = 'photos';
```

### Count RLS policies:
```sql
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

---

## ✅ Expected Results

If everything is set up correctly:

**Tables:** 20+ tables should exist
**Storage:** 1 bucket named `photos` (private)
**RLS Policies:** 40+ policies across all tables
**Storage Policies:** 3+ policies for photos bucket

---

## 🚨 Common Issues

### Issue: "Table does not exist"
**Fix:** Run the corresponding schema file in SQL Editor

### Issue: "Permission denied for table"
**Fix:** Check RLS policies are enabled and correct

### Issue: "Storage bucket not found"
**Fix:** Create `photos` bucket in Storage, set to PRIVATE

### Issue: "Column does not exist"
**Fix:** Run push-notifications-schema.sql for push columns

### Issue: Photos won't upload
**Fix:**
1. Check bucket exists and is private
2. Check storage policies allow uploads
3. Check user is authenticated

---

## 📞 Need Help?

If verification fails:
1. Check which specific table/feature is missing
2. Run the corresponding schema file
3. Verify in Supabase Dashboard UI
4. Test in app again

**Schema files to run:**
- `src/lib/supabase/schema.sql` - Core tables
- `src/lib/supabase/events-schema.sql` - Events
- `src/lib/supabase/push-notifications-schema.sql` - Notifications
