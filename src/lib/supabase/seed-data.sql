-- Seed Data for Testing
-- Run this AFTER schema.sql and events-schema.sql
-- NOTE: This creates test data - remove before production!

-- ============================================================================
-- SEED INTENTS (if not already done)
-- ============================================================================
INSERT INTO public.intents (id, label, description, emoji) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Long-term relationship', 'Looking for something serious', '💕'),
  ('22222222-2222-2222-2222-222222222222', 'Casual dating', 'Keeping it light and fun', '🌸'),
  ('33333333-3333-3333-3333-333333333333', 'New friends', 'Just here to meet people', '🤝'),
  ('44444444-4444-4444-4444-444444444444', 'Activity partners', 'Looking for adventure buddies', '🎯'),
  ('55555555-5555-5555-5555-555555555555', 'Networking', 'Professional connections', '💼')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED TEST USERS (for development/testing only)
-- These use fixed UUIDs so they can be referenced
-- ============================================================================
INSERT INTO public.users (id, email, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'maya@test.com', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'alex@test.com', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'jordan@test.com', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'sam@test.com', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'chris@test.com', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED TEST PROFILES
-- ============================================================================
INSERT INTO public.profiles (id, user_id, display_name, age, city, bio, pace_preference, open_to_meet) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   'Maya', 28, 'San Francisco', 
   'Artist and nature lover. Looking for meaningful connections with like-minded souls. I believe in honest communication and growing together. 🌿✨', 
   'medium', true),
  ('b2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
   'Alex', 32, 'Oakland', 
   'Tech by day, musician by night. Polyamorous and proud. Always looking for new adventures and deep conversations over coffee.', 
   'fast', true),
  ('c3333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 
   'Jordan', 26, 'Berkeley', 
   'Graduate student studying psychology. Love hiking, board games, and spontaneous road trips. ENM and exploring what that means for me.', 
   'slow', true),
  ('d4444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 
   'Sam', 30, 'San Francisco', 
   'Chef, foodie, and amateur photographer. Looking for partners who appreciate good food and good company. Currently in an open marriage.', 
   'medium', true),
  ('e5555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 
   'Chris', 35, 'Palo Alto', 
   'Software engineer who loves the outdoors. Relationship anarchist. Passionate about climbing, sustainability, and authentic connections.', 
   'medium', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED PROFILE INTENTS
-- ============================================================================
INSERT INTO public.profile_intents (profile_id, intent_id) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('b2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'),
  ('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333'),
  ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
  ('d4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222'),
  ('e5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),
  ('e5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED PROMPT RESPONSES
-- ============================================================================
INSERT INTO public.prompt_responses (profile_id, prompt_id, prompt_text, response_text) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'ideal-day', 'My ideal day looks like...', 
   'Waking up slowly with coffee, painting in my studio until noon, then a long hike followed by dinner with people I love.'),
  ('a1111111-1111-1111-1111-111111111111', 'looking-for', 'I''m looking for...', 
   'Genuine connections built on trust and communication. Someone who understands that love isn''t a finite resource.'),
  ('b2222222-2222-2222-2222-222222222222', 'fun-fact', 'A fun fact about me...', 
   'I once played guitar at a music festival with 5000 people. Stage fright? Never heard of her.'),
  ('c3333333-3333-3333-3333-333333333333', 'bucket-list', 'On my bucket list...', 
   'Visit every national park in California, learn to surf, and write a book about relationship psychology.'),
  ('d4444444-4444-4444-4444-444444444444', 'ideal-day', 'My ideal day looks like...', 
   'Farmers market in the morning, cooking an elaborate meal for friends, and ending with a movie night.'),
  ('e5555555-5555-5555-5555-555555555555', 'fun-fact', 'A fun fact about me...', 
   'I''ve summited 10 of the 14ers in Colorado. Mountain air is my therapy.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED LINKED PARTNERS
-- ============================================================================
INSERT INTO public.linked_partners (profile_id, name, age) VALUES
  ('d4444444-4444-4444-4444-444444444444', 'Taylor', 29)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED EVENTS
-- ============================================================================
INSERT INTO public.events (
  id, host_id, title, description, category, tags,
  location_name, location_city, location_latitude, location_longitude,
  start_date, start_time, end_time, timezone,
  max_attendees, current_attendees, visibility, status, is_featured
) VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Poly Potluck & Game Night',
    'Join us for a cozy evening of good food, board games, and great conversation! Bring a dish to share and your favorite game. This is a casual, low-key event perfect for meeting new people in the community.',
    'social',
    ARRAY['poly-friendly', 'game-night', 'newbie-friendly'],
    'Maya''s Place',
    'San Francisco',
    37.7749,
    -122.4194,
    CURRENT_DATE + INTERVAL '3 days',
    '18:00',
    '22:00',
    'America/Los_Angeles',
    20,
    8,
    'public',
    'published',
    true
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ENM 101: Intro to Ethical Non-Monogamy',
    'Curious about ethical non-monogamy? Whether you''re just starting to explore or looking to deepen your understanding, this workshop covers the fundamentals including different relationship structures, communication frameworks, and managing jealousy.',
    'education',
    ARRAY['workshop', 'newbie-friendly', 'discussion'],
    'Community Center',
    'Oakland',
    37.8044,
    -122.2712,
    CURRENT_DATE + INTERVAL '7 days',
    '14:00',
    '17:00',
    'America/Los_Angeles',
    30,
    15,
    'public',
    'published',
    true
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Sunset Hike at Lands End',
    'Join us for a beautiful sunset hike along the Lands End trail! We''ll meet at the trailhead and take a moderate 3-mile loop with stunning views of the Golden Gate. All fitness levels welcome.',
    'outdoor',
    ARRAY['hiking', 'singles', 'social-mixer'],
    'Lands End Lookout',
    'San Francisco',
    37.7849,
    -122.5094,
    CURRENT_DATE + INTERVAL '5 days',
    '16:30',
    '19:00',
    'America/Los_Angeles',
    15,
    6,
    'public',
    'published',
    false
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Couples & Partners Dinner Party',
    'An intimate dinner party for couples and metamours. Sam will be preparing a 5-course tasting menu. BYOB! Space is limited to ensure quality conversation.',
    'social',
    ARRAY['couples-welcome', 'dinner-party', 'poly-friendly'],
    'Sam''s Kitchen',
    'San Francisco',
    37.7599,
    -122.4148,
    CURRENT_DATE + INTERVAL '10 days',
    '19:00',
    '23:00',
    'America/Los_Angeles',
    12,
    4,
    'friends_only',
    'published',
    false
  ),
  (
    'e5555555-5555-5555-5555-555555555555',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Virtual Coffee Chat: Relationship Anarchy',
    'A casual virtual hangout to discuss relationship anarchy concepts, share experiences, and connect with others exploring non-hierarchical relationships. All experience levels welcome!',
    'virtual',
    ARRAY['discussion', 'lgbtq+', 'newbie-friendly'],
    'Zoom',
    'Online',
    NULL,
    NULL,
    CURRENT_DATE + INTERVAL '2 days',
    '10:00',
    '11:30',
    'America/Los_Angeles',
    25,
    12,
    'public',
    'published',
    true
  )
ON CONFLICT (id) DO NOTHING;
