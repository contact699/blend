# Supabase Setup Guide for Blend

This guide walks you through setting up your Supabase backend for the Blend ENM dating app.

## Prerequisites

- Supabase account (free tier works fine for development)
- Access to Supabase Dashboard: https://supabase.com/dashboard

---

## Step 1: Create Supabase Project (If Not Already Created)

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name:** Blend (or your preferred name)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be provisioned

---

## Step 2: Get Your API Keys

1. In Supabase Dashboard, go to **Project Settings** (gear icon) > **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

3. Update your `.env` file:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-long-key-here
   ```

   **OR** use the **ENV tab** in Vibecode App to update these values.

---

## Step 3: Run Database Schema

1. In Supabase Dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open the file `src/lib/supabase/schema.sql` in this repository
4. Copy the **entire contents** (605 lines)
5. Paste into the SQL Editor
6. Click **RUN** (or press Cmd/Ctrl + Enter)
7. You should see: ✅ Success. No rows returned

**What this does:**
- Creates 20+ tables (users, profiles, messages, events, etc.)
- Sets up Row Level Security (RLS) on all tables
- Creates indexes for performance
- Sets up triggers for auto-updating timestamps

---

## Step 4: Populate Initial Data

1. Still in **SQL Editor**, create a **New query**
2. Open the file `supabase-seed-data.sql` in this repository
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **RUN**
6. You should see: ✅ Success. Inserted 12 rows.

**What this does:**
- Populates the `intents` table with 12 relationship goals (Dating, Friends, Hookups, etc.)

---

## Step 5: Set Up Storage Bucket for Photos

1. In Supabase Dashboard, click **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Fill in:
   - **Name:** `photos`
   - **Public bucket:** ❌ **UNCHECK THIS** (must be private)
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`
4. Click **"Create bucket"**

### Add Storage Policies (CRITICAL for security):

1. Click on the **photos** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**

**Policy 1: Users can upload own photos**
- Click **"For full customization"**
- Policy name: `Users can upload own photos`
- Allowed operation: `INSERT`
- Policy definition:
  ```sql
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **"Review"** > **"Save policy"**

**Policy 2: Users can view photos**
- Policy name: `Users can view photos`
- Allowed operation: `SELECT`
- Policy definition:
  ```sql
  bucket_id = 'photos'
  ```
- Click **"Review"** > **"Save policy"**

**Policy 3: Users can delete own photos**
- Policy name: `Users can delete own photos`
- Allowed operation: `DELETE`
- Policy definition:
  ```sql
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **"Review"** > **"Save policy"**

---

## Step 6: Configure Authentication

1. In Supabase Dashboard, click **Authentication** in the left sidebar
2. Click **"Providers"**
3. Find **"Email"** and click to expand
4. Configure:
   - **Enable Email provider:** ✅ Check
   - **Confirm email:** ❌ Uncheck for development (you can enable later)
   - **Secure email change:** ✅ Check
5. Click **"Save"**

### URL Configuration:

1. Go to **Authentication** > **URL Configuration**
2. Set:
   - **Site URL:** `http://localhost:8081` (for development)
   - **Redirect URLs:** Add `http://localhost:8081/**` (for development)
3. Click **"Save"**

---

## Step 7: Verify Everything Works

1. In Supabase Dashboard, go to **Table Editor**
2. You should see all these tables:
   - ✅ users
   - ✅ profiles
   - ✅ photos
   - ✅ intents (12 rows)
   - ✅ matches
   - ✅ messages
   - ✅ chat_threads
   - ✅ likes
   - ✅ pings
   - ✅ events
   - ✅ trust_scores
   - ✅ date_reviews
   - ✅ community_vouches
   - ✅ blocked_users
   - ✅ reports
   - ✅ partner_links
   - ✅ and more...

3. Go to **Storage** and verify:
   - ✅ "photos" bucket exists
   - ✅ Bucket is PRIVATE (not public)
   - ✅ 3 policies are active

4. Go to **Authentication** > **Providers** and verify:
   - ✅ Email provider is enabled

---

## Step 8: Test Authentication in Your App

1. Make sure your `.env` file has the correct keys from Step 2
2. Start your app: `bun start`
3. Try signing up with a test email
4. Check **Authentication** > **Users** in Supabase Dashboard
5. You should see your new user appear!

---

## 🔒 Security Checklist

Before going to production, verify:

- [ ] All tables have RLS enabled (green shield icon in Table Editor)
- [ ] Storage bucket is PRIVATE (not public)
- [ ] Storage policies are active (3 policies)
- [ ] Email confirmation is enabled in Auth settings (for production)
- [ ] Site URL and Redirect URLs are set to your production domain
- [ ] Database password is strong and stored securely
- [ ] API keys are in `.env` file (not hardcoded in source)
- [ ] `.env` file is in `.gitignore` (it is by default)

---

## 🚀 Optional Enhancements

### Enable Email Confirmation (Production)
1. Go to **Authentication** > **Email Templates**
2. Customize the "Confirm signup" template
3. Go to **Authentication** > **Providers** > **Email**
4. Enable **"Confirm email"**

### Add Social Login (Optional)
1. Go to **Authentication** > **Providers**
2. Enable Google, Apple, or other providers
3. Follow Supabase docs for OAuth setup

### Enable Realtime (For Live Messaging)
Realtime is enabled by default! The app uses it for:
- Live message updates
- Typing indicators
- Online status

### Add Database Backups (Production)
1. Go to **Database** > **Backups**
2. Supabase automatically creates daily backups (Pro plan)
3. You can also create manual backups

---

## 🐛 Troubleshooting

### "relation 'users' does not exist"
- You haven't run `schema.sql` yet. Go back to Step 3.

### "new row violates row-level security policy"
- RLS policies are blocking your query
- Check **Table Editor** > Click table > **Policies** tab
- Verify policies exist and are correct

### "Failed to fetch" or connection errors
- Check your API keys in `.env` file
- Verify Supabase project URL is correct
- Check if project is paused (free tier pauses after 7 days of inactivity)

### Photos not uploading
- Verify storage bucket exists and is named "photos"
- Check storage policies are active
- Verify bucket is PRIVATE (not public)

### Authentication not working
- Check Email provider is enabled
- Verify Site URL and Redirect URLs are set
- Check `.env` file has correct anon key

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Storage Guide:** https://supabase.com/docs/guides/storage
- **Auth Guide:** https://supabase.com/docs/guides/auth

---

## ✅ Done!

Once you've completed all steps above, your Supabase backend is fully configured and ready for development. The app should now be able to:

- ✅ Sign up / Sign in users
- ✅ Create and edit profiles
- ✅ Upload photos securely
- ✅ Send messages (real-time)
- ✅ Create matches
- ✅ Browse events
- ✅ Track trust scores
- ✅ And all other app features!

If you run into any issues, check the Troubleshooting section above or consult the Supabase documentation.
