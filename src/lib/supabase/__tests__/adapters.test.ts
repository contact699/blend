/**
 * Tests for Type Adapters
 * 
 * These adapters transform Supabase data structures to App types.
 * Critical for ensuring data flows correctly between backend and frontend.
 */

import {
  nullToUndefined,
  undefinedToNull,
  parseDate,
  extractPhotoUrl,
  transformProfile,
  transformProfiles,
  transformMessage,
  transformMatch,
  transformChatThread,
  transformLike,
  transformPing,
  isSupabaseProfile,
  isAppProfile,
  ensureAppProfile,
  SupabaseProfile,
  SupabasePhoto,
  SupabaseMessage,
  SupabaseMatch,
  SupabaseChatThread,
  SupabaseLike,
  SupabasePing,
} from '../adapters';

describe('Utility Functions', () => {
  describe('nullToUndefined', () => {
    it('should convert null to undefined', () => {
      expect(nullToUndefined(null)).toBeUndefined();
    });

    it('should pass through undefined', () => {
      expect(nullToUndefined(undefined)).toBeUndefined();
    });

    it('should pass through values', () => {
      expect(nullToUndefined('test')).toBe('test');
      expect(nullToUndefined(0)).toBe(0);
      expect(nullToUndefined(false)).toBe(false);
      expect(nullToUndefined([])).toEqual([]);
    });
  });

  describe('undefinedToNull', () => {
    it('should convert undefined to null', () => {
      expect(undefinedToNull(undefined)).toBeNull();
    });

    it('should pass through null', () => {
      expect(undefinedToNull(null)).toBeNull();
    });

    it('should pass through values', () => {
      expect(undefinedToNull('test')).toBe('test');
      expect(undefinedToNull(0)).toBe(0);
      expect(undefinedToNull(false)).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('should return undefined for null/undefined', () => {
      expect(parseDate(null)).toBeUndefined();
      expect(parseDate(undefined)).toBeUndefined();
    });

    it('should return valid date strings', () => {
      const validDate = '2025-01-14T12:00:00Z';
      expect(parseDate(validDate)).toBe(validDate);
    });

    it('should return undefined for invalid dates', () => {
      expect(parseDate('not-a-date')).toBeUndefined();
      expect(parseDate('')).toBeUndefined();
    });
  });
});

describe('Photo Adapters', () => {
  describe('extractPhotoUrl', () => {
    it('should return undefined for null/undefined', () => {
      expect(extractPhotoUrl(null)).toBeUndefined();
      expect(extractPhotoUrl(undefined)).toBeUndefined();
    });

    it('should return string URLs directly', () => {
      const url = 'https://example.com/photo.jpg';
      expect(extractPhotoUrl(url)).toBe(url);
    });

    it('should prefer signedUrl over storage_path', () => {
      const photo: SupabasePhoto = {
        id: '1',
        profile_id: 'p1',
        storage_path: 'photos/user/photo.jpg',
        signedUrl: 'https://signed-url.com/photo.jpg',
        order_index: 0,
        is_primary: true,
      };
      expect(extractPhotoUrl(photo)).toBe('https://signed-url.com/photo.jpg');
    });

    it('should fallback to storage_path when no signedUrl', () => {
      const photo: SupabasePhoto = {
        id: '1',
        profile_id: 'p1',
        storage_path: 'photos/user/photo.jpg',
        order_index: 0,
        is_primary: true,
      };
      expect(extractPhotoUrl(photo)).toBe('photos/user/photo.jpg');
    });

    it('should handle null signedUrl', () => {
      const photo: SupabasePhoto = {
        id: '1',
        profile_id: 'p1',
        storage_path: 'photos/user/photo.jpg',
        signedUrl: null,
        order_index: 0,
        is_primary: true,
      };
      expect(extractPhotoUrl(photo)).toBe('photos/user/photo.jpg');
    });
  });
});

describe('Profile Adapters', () => {
  const createSupabaseProfile = (overrides: Partial<SupabaseProfile> = {}): SupabaseProfile => ({
    id: 'profile-1',
    user_id: 'user-1',
    display_name: 'Test User',
    age: 28,
    city: 'San Francisco',
    bio: 'Test bio',
    pace_preference: 'medium',
    response_style: 'relaxed',
    open_to_meet: true,
    virtual_only: false,
    no_photos: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-14T00:00:00Z',
    ...overrides,
  });

  describe('transformProfile', () => {
    it('should transform a basic profile', () => {
      const supabaseProfile = createSupabaseProfile();
      const appProfile = transformProfile(supabaseProfile);

      expect(appProfile.id).toBe('profile-1');
      expect(appProfile.user_id).toBe('user-1');
      expect(appProfile.display_name).toBe('Test User');
      expect(appProfile.age).toBe(28);
      expect(appProfile.city).toBe('San Francisco');
      expect(appProfile.bio).toBe('Test bio');
      expect(appProfile.photos).toEqual([]);
      expect(appProfile.intent_ids).toEqual([]);
    });

    it('should convert null bio to empty string', () => {
      const supabaseProfile = createSupabaseProfile({ bio: null });
      const appProfile = transformProfile(supabaseProfile);

      expect(appProfile.bio).toBe('');
    });

    it('should extract and sort photo URLs', () => {
      const supabaseProfile = createSupabaseProfile({
        photos: [
          { id: '3', profile_id: 'p1', storage_path: 'path3', order_index: 2, is_primary: false, signedUrl: 'https://url3.com' },
          { id: '1', profile_id: 'p1', storage_path: 'path1', order_index: 0, is_primary: true, signedUrl: 'https://url1.com' },
          { id: '2', profile_id: 'p1', storage_path: 'path2', order_index: 1, is_primary: false, signedUrl: 'https://url2.com' },
        ],
      });
      const appProfile = transformProfile(supabaseProfile);

      expect(appProfile.photos).toEqual([
        'https://url1.com',
        'https://url2.com',
        'https://url3.com',
      ]);
    });

    it('should extract intent IDs', () => {
      const supabaseProfile = createSupabaseProfile({
        profile_intents: [
          { intent_id: 'dating' },
          { intent_id: 'friends' },
        ],
      });
      const appProfile = transformProfile(supabaseProfile);

      expect(appProfile.intent_ids).toEqual(['dating', 'friends']);
    });

    it('should transform prompt responses', () => {
      const supabaseProfile = createSupabaseProfile({
        profile_prompt_responses: [
          {
            id: 'pr-1',
            profile_id: 'profile-1',
            prompt_id: 'prompt-1',
            prompt_text: 'What is your favorite...?',
            response_text: 'My answer',
          },
        ],
      });
      const appProfile = transformProfile(supabaseProfile);

      expect(appProfile.prompt_responses).toHaveLength(1);
      expect(appProfile.prompt_responses[0].prompt_text).toBe('What is your favorite...?');
    });

    it('should handle location fields', () => {
      const supabaseProfile = createSupabaseProfile({
        latitude: 37.7749,
        longitude: -122.4194,
        show_on_map: true,
      });
      const appProfile = transformProfile(supabaseProfile);

      expect(appProfile.latitude).toBe(37.7749);
      expect(appProfile.longitude).toBe(-122.4194);
      expect(appProfile.show_on_map).toBe(true);
    });

    it('should convert null location fields to undefined/false', () => {
      const supabaseProfile = createSupabaseProfile({
        latitude: null,
        longitude: null,
        show_on_map: null,
      });
      const appProfile = transformProfile(supabaseProfile);

      expect(appProfile.latitude).toBeUndefined();
      expect(appProfile.longitude).toBeUndefined();
      expect(appProfile.show_on_map).toBe(false);
    });
  });

  describe('transformProfiles', () => {
    it('should transform an array of profiles', () => {
      const profiles = [
        createSupabaseProfile({ id: 'p1', display_name: 'User 1' }),
        createSupabaseProfile({ id: 'p2', display_name: 'User 2' }),
      ];
      const appProfiles = transformProfiles(profiles);

      expect(appProfiles).toHaveLength(2);
      expect(appProfiles[0].display_name).toBe('User 1');
      expect(appProfiles[1].display_name).toBe('User 2');
    });

    it('should return empty array for empty input', () => {
      expect(transformProfiles([])).toEqual([]);
    });
  });
});

describe('Type Guards', () => {
  describe('isSupabaseProfile', () => {
    it('should return true for valid Supabase profiles', () => {
      const profile = {
        id: 'test',
        user_id: 'user',
        display_name: 'Test',
      };
      expect(isSupabaseProfile(profile)).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isSupabaseProfile(null)).toBe(false);
      expect(isSupabaseProfile(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isSupabaseProfile('string')).toBe(false);
      expect(isSupabaseProfile(123)).toBe(false);
    });
  });

  describe('isAppProfile', () => {
    it('should return true for profiles with string[] photos', () => {
      const profile = {
        photos: ['https://url1.com', 'https://url2.com'],
      };
      expect(isAppProfile(profile)).toBe(true);
    });

    it('should return true for profiles with empty photos array', () => {
      const profile = {
        photos: [],
      };
      expect(isAppProfile(profile)).toBe(true);
    });

    it('should return false for profiles with object photos', () => {
      const profile = {
        photos: [{ storage_path: 'path', signedUrl: 'url' }],
      };
      expect(isAppProfile(profile)).toBe(false);
    });
  });
});

describe('Match Adapter', () => {
  it('should transform a match with shared intents', () => {
    const supabaseMatch: SupabaseMatch = {
      id: 'match-1',
      user_1_id: 'user-1',
      user_2_id: 'user-2',
      status: 'active',
      matched_at: '2025-01-14T00:00:00Z',
      shared_intents: [{ intent_id: 'dating' }, { intent_id: 'friends' }],
    };
    const appMatch = transformMatch(supabaseMatch);

    expect(appMatch.id).toBe('match-1');
    expect(appMatch.shared_intent_ids).toEqual(['dating', 'friends']);
  });

  it('should handle missing shared_intents', () => {
    const supabaseMatch: SupabaseMatch = {
      id: 'match-1',
      user_1_id: 'user-1',
      user_2_id: 'user-2',
      status: 'pending',
      matched_at: '2025-01-14T00:00:00Z',
    };
    const appMatch = transformMatch(supabaseMatch);

    expect(appMatch.shared_intent_ids).toEqual([]);
  });
});

describe('Message Adapter', () => {
  it('should transform a basic message', () => {
    const supabaseMessage: SupabaseMessage = {
      id: 'msg-1',
      thread_id: 'thread-1',
      sender_id: 'user-1',
      message_type: 'text',
      content: 'Hello!',
      media_storage_path: null,
      is_first_message: false,
      created_at: '2025-01-14T12:00:00Z',
      read_at: null,
    };
    const appMessage = transformMessage(supabaseMessage);

    expect(appMessage.id).toBe('msg-1');
    expect(appMessage.content).toBe('Hello!');
    expect(appMessage.read_at).toBeUndefined();
    expect(appMessage.media_url).toBeUndefined();
  });

  it('should prefer signed URL for media', () => {
    const supabaseMessage: SupabaseMessage = {
      id: 'msg-1',
      thread_id: 'thread-1',
      sender_id: 'user-1',
      message_type: 'image',
      content: '',
      media_storage_path: 'photos/msg/image.jpg',
      mediaSignedUrl: 'https://signed.url/image.jpg',
      is_first_message: false,
      created_at: '2025-01-14T12:00:00Z',
      read_at: null,
    };
    const appMessage = transformMessage(supabaseMessage);

    expect(appMessage.media_url).toBe('https://signed.url/image.jpg');
  });

  it('should transform message reactions', () => {
    const supabaseMessage: SupabaseMessage = {
      id: 'msg-1',
      thread_id: 'thread-1',
      sender_id: 'user-1',
      message_type: 'text',
      content: 'Hello!',
      media_storage_path: null,
      is_first_message: false,
      created_at: '2025-01-14T12:00:00Z',
      read_at: null,
      message_reactions: [
        { emoji: '❤️', user_id: 'user-2', created_at: '2025-01-14T12:01:00Z' },
      ],
    };
    const appMessage = transformMessage(supabaseMessage);

    expect(appMessage.reactions).toHaveLength(1);
    expect(appMessage.reactions![0].emoji).toBe('❤️');
  });
});

describe('ChatThread Adapter', () => {
  it('should transform a chat thread', () => {
    const supabaseThread: SupabaseChatThread = {
      id: 'thread-1',
      match_id: 'match-1',
      unlocked: true,
      first_message_type: 'prompt',
      last_message_at: '2025-01-14T12:00:00Z',
      archived_at: null,
    };
    const appThread = transformChatThread(supabaseThread);

    expect(appThread.id).toBe('thread-1');
    expect(appThread.unlocked).toBe(true);
    expect(appThread.first_message_type).toBe('prompt');
    expect(appThread.archived_at).toBeUndefined();
  });

  it('should handle group chat fields', () => {
    const supabaseThread: SupabaseChatThread = {
      id: 'thread-1',
      match_id: 'match-1',
      unlocked: true,
      is_group: true,
      group_name: 'Test Group',
      participant_ids: ['user-1', 'user-2', 'user-3'],
      created_by: 'user-1',
    };
    const appThread = transformChatThread(supabaseThread);

    expect(appThread.is_group).toBe(true);
    expect(appThread.group_name).toBe('Test Group');
    expect(appThread.participant_ids).toEqual(['user-1', 'user-2', 'user-3']);
  });
});

describe('Like Adapter', () => {
  it('should transform a like', () => {
    const supabaseLike: SupabaseLike = {
      id: 'like-1',
      from_user_id: 'user-1',
      to_user_id: 'user-2',
      created_at: '2025-01-14T12:00:00Z',
      seen: false,
    };
    const appLike = transformLike(supabaseLike);

    expect(appLike.id).toBe('like-1');
    expect(appLike.from_user_id).toBe('user-1');
    expect(appLike.seen).toBe(false);
  });
});

describe('Ping Adapter', () => {
  it('should transform a ping', () => {
    const supabasePing: SupabasePing = {
      id: 'ping-1',
      from_user_id: 'user-1',
      to_user_id: 'user-2',
      message: 'Hey there!',
      created_at: '2025-01-14T12:00:00Z',
      read: false,
    };
    const appPing = transformPing(supabasePing);

    expect(appPing.id).toBe('ping-1');
    expect(appPing.message).toBe('Hey there!');
    expect(appPing.read).toBe(false);
  });
});
