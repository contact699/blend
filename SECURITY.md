# Security Implementation Guide

This document outlines the security features implemented in the Blend dating app.

## 1. Database Security (Supabase)

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only read/update their own data
- Profiles are visible to authenticated users (except blocked users)
- Match data is only accessible to match participants
- Messages are only accessible to conversation participants
- Likes/Pinds are only visible to sender and recipient

**To set up:** Run the SQL in `src/lib/supabase/schema.sql` in your Supabase SQL Editor.

### Required Environment Variables
Add these to your ENV tab in Vibecode:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. IDOR Prevention

All IDs use UUIDs instead of sequential integers:
- User IDs: UUID v4
- Profile IDs: UUID v4
- Photo IDs: UUID v4
- Match IDs: UUID v4
- Message IDs: UUID v4
- Thread IDs: UUID v4

This prevents attackers from guessing valid IDs by incrementing numbers.

## 3. Photo Security

### Private Storage
- Photos are stored in a private Supabase storage bucket
- No direct public URLs are exposed
- All photos are served via short-lived signed URLs (5-minute expiry)

### EXIF Stripping
Before upload, all photos are processed to:
- Remove EXIF metadata (camera info, timestamps)
- Remove geolocation data
- Re-encode as JPEG with quality optimization

### Validation
- Maximum file size: 10MB
- Supported formats: JPEG, PNG
- Automatic format conversion

## 4. Conversation Security

### Authorization Checks
Messages are protected by:
1. **RLS Policies**: Database-level enforcement
2. **Application Checks**: Additional verification in hooks
3. **Participant Validation**: Both sender and recipient must be part of the match

### Message Security
- Messages are validated and sanitized before storage
- Maximum length: 2000 characters
- HTML/script tags are stripped
- Only conversation participants can read/write messages

## 5. Input Validation

### Validation Rules
All user inputs are validated using Zod schemas:

| Field | Validation |
|-------|------------|
| Display Name | 2-30 chars, alphanumeric + basic punctuation |
| Age | Integer, 18-120 |
| City | Max 50 chars |
| Bio | Max 500 chars |
| Message | 1-2000 chars |
| Pind | 1-500 chars |

### Sanitization
- HTML tags are stripped
- Script injection attempts are blocked
- SQL injection patterns are detected
- XSS patterns are detected and blocked

### Usage
```typescript
import { validateOrThrow, profileSchema } from '@/lib/validation';

const validatedData = validateOrThrow(profileSchema, userInput);
```

## 6. Authentication

### Supabase Auth
- Email/password authentication
- Phone authentication
- Session persistence with secure storage
- Auto token refresh

### Session Management
- Sessions stored in AsyncStorage (encrypted on device)
- Auto-refresh of expired tokens
- Secure logout clears all session data

## 7. Security Best Practices

### What We Do
- Use HTTPS for all API calls (Supabase default)
- Validate all inputs server-side via RLS
- Use parameterized queries (Supabase handles this)
- Implement rate limiting via RLS policies
- Log security events

### What You Should Do
- Enable MFA in Supabase Auth settings
- Set up proper CORS in Supabase
- Enable email verification
- Review RLS policies regularly
- Monitor for unusual activity

## 8. Blocked Users & Reporting

### Block Feature
- Blocked users cannot see your profile
- Blocked users cannot message you
- RLS policies enforce this at database level

### Report Feature
- Reports are stored with reporter ID
- Reports include reason and details
- Admin can review via Supabase dashboard

## 9. Security Checklist

Before going to production:

- [ ] Set up Supabase project
- [ ] Run schema.sql to create tables with RLS
- [ ] Create private storage bucket for photos
- [ ] Add environment variables
- [ ] Enable email/phone verification
- [ ] Enable MFA
- [ ] Test RLS policies
- [ ] Review all API endpoints
- [ ] Set up monitoring/alerts
- [ ] Perform penetration testing

## 10. Files Reference

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Supabase client configuration |
| `src/lib/supabase/types.ts` | Database type definitions |
| `src/lib/supabase/schema.sql` | SQL schema with RLS policies |
| `src/lib/supabase/hooks.ts` | Secure API hooks |
| `src/lib/supabase/photos.ts` | Photo handling with EXIF stripping |
| `src/lib/validation.ts` | Input validation schemas |
