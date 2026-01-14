// Secure API Hooks for Supabase
// Implements authorization checks and input validation

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUser } from './client';
import {
  validateOrThrow,
  profileUpdateSchema,
  createMessageSchema,
  createPindSchema,
  createReportSchema,
  blockUserSchema,
  uuidSchema,
} from '../validation';
import {
  getSignedPhotoUrls,
  securePhotoUpload,
  deletePhoto,
} from './photos';

// ============================================================================
// TYPES
// ============================================================================

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  pace_preference: 'slow' | 'medium' | 'fast';
  no_photos: boolean;
  open_to_meet: boolean;
  virtual_only: boolean;
  response_style: 'quick' | 'relaxed';
  voice_intro_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Photo {
  id: string;
  profile_id: string;
  storage_path: string;
  order_index: number;
  is_primary: boolean;
  signedUrl?: string | null;
}

interface Match {
  id: string;
  user_1_id: string;
  user_2_id: string;
  status: 'pending' | 'active' | 'archived';
  matched_at: string;
}

interface ChatThread {
  id: string;
  match_id: string;
  unlocked: boolean;
  matches?: Match;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  message_type: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call';
  content: string;
  media_storage_path: string | null;
  is_first_message: boolean;
  created_at: string;
  read_at: string | null;
  mediaSignedUrl?: string | null;
}

interface ProfileWithRelations extends Profile {
  photos?: Photo[];
  profile_intents?: { intent_id: string }[];
  prompt_responses?: Array<{
    id: string;
    prompt_id: string;
    prompt_text: string;
    response_text: string;
  }>;
  linked_partners?: Array<{
    id: string;
    name: string;
    age: number;
    photo_storage_path: string | null;
  }>;
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

/**
 * Hook to get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get current user's profile
 */
export function useCurrentProfile() {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return useQuery({
    queryKey: ['profile', 'current', user],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

// ============================================================================
// PROFILE HOOKS
// ============================================================================

/**
 * Hook to get a profile by user ID (with blocked user filtering via RLS)
 */
export function useProfile(userId: string | undefined) {
  const { data: currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ['profile', userId, currentUser?.id],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      validateOrThrow(uuidSchema, userId);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          *,
          photos (id, storage_path, order_index, is_primary),
          profile_intents (intent_id),
          prompt_responses (*),
          linked_partners (*)
        `
        )
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const profile = data as unknown as ProfileWithRelations;

      // Get signed URLs for photos
      if (profile.photos && profile.photos.length > 0) {
        const paths = profile.photos.map((p) => p.storage_path);
        const signedUrls = await getSignedPhotoUrls(paths);
        profile.photos = profile.photos.map((p) => ({
          ...p,
          signedUrl: signedUrls.get(p.storage_path) || null,
        }));
      }

      return profile;
    },
    enabled: !!userId && !!currentUser,
  });
}

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      // Validate input
      const validatedUpdates = validateOrThrow(profileUpdateSchema, updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(validatedUpdates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * Hook to upload a profile photo
 */
export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (!user || !profile) throw new Error('Not authenticated');

      const result = await securePhotoUpload(user.id, imageUri);
      if (!result.success || !result.path) {
        throw new Error(result.error ?? 'Upload failed');
      }

      // Add photo record to database
      const { data, error } = await supabase
        .from('photos')
        .insert({
          profile_id: profile.id,
          storage_path: result.path,
          order_index: 0,
          is_primary: false,
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file on database error
        await deletePhoto(result.path);
        throw error;
      }

      return data as Photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * Hook to delete a profile photo
 */
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      validateOrThrow(uuidSchema, photoId);

      // Get photo record first
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('storage_path, profile_id')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;

      const photoData = photo as { storage_path: string; profile_id: string };

      // Delete from storage
      const { error: storageError } = await deletePhoto(photoData.storage_path);
      if (storageError) {
        console.warn('Storage delete error:', storageError);
      }

      // Delete from database
      const { error } = await supabase.from('photos').delete().eq('id', photoId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ============================================================================
// MATCH HOOKS
// ============================================================================

/**
 * Hook to get current user's matches
 */
export function useMatches() {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return useQuery({
    queryKey: ['matches', user],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          chat_threads (*)
        `
        )
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false });

      if (error) throw error;
      return data as Array<Match & { chat_threads: ChatThread[] }>;
    },
    enabled: !!user,
  });
}

/**
 * Hook to get a single match with authorization check
 */
export function useMatch(matchId: string | undefined) {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return useQuery({
    queryKey: ['match', matchId, user],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID required');
      if (!user) throw new Error('Not authenticated');

      validateOrThrow(uuidSchema, matchId);

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) throw error;

      const match = data as Match;

      // RLS handles this, but double-check in app
      if (match.user_1_id !== user.id && match.user_2_id !== user.id) {
        throw new Error('Unauthorized access to match');
      }

      return match;
    },
    enabled: !!matchId && !!user,
  });
}

// ============================================================================
// CHAT HOOKS - CRITICAL SECURITY
// ============================================================================

/**
 * Hook to get messages for a thread (with authorization)
 */
export function useThreadMessages(threadId: string | undefined) {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return useQuery({
    queryKey: ['messages', threadId, user],
    queryFn: async () => {
      if (!threadId) throw new Error('Thread ID required');
      if (!user) throw new Error('Not authenticated');

      validateOrThrow(uuidSchema, threadId);

      // First verify user is a participant (RLS does this, but we double-check)
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .select(
          `
          *,
          matches (user_1_id, user_2_id)
        `
        )
        .eq('id', threadId)
        .single();

      if (threadError) throw threadError;

      const threadData = thread as unknown as ChatThread & {
        matches: { user_1_id: string; user_2_id: string };
      };

      // Authorization check
      const isParticipant =
        threadData.matches.user_1_id === user.id ||
        threadData.matches.user_2_id === user.id;

      if (!isParticipant) {
        throw new Error(
          'Unauthorized: You are not a participant in this conversation'
        );
      }

      // Get messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messageList = messages as Message[];

      // Get signed URLs for media
      const mediaPaths = messageList
        .filter((m) => m.media_storage_path)
        .map((m) => m.media_storage_path!);

      if (mediaPaths.length > 0) {
        const signedUrls = await getSignedPhotoUrls(mediaPaths);
        return messageList.map((m) => ({
          ...m,
          mediaSignedUrl: m.media_storage_path
            ? signedUrls.get(m.media_storage_path) || null
            : null,
        }));
      }

      return messageList;
    },
    enabled: !!threadId && !!user,
    refetchInterval: 5000, // Poll for new messages
  });
}

/**
 * Hook to send a message (with authorization and validation)
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      thread_id: string;
      content: string;
      message_type?: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call';
      is_first_message?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Validate input
      const validated = validateOrThrow(createMessageSchema, input);

      // Verify thread participation (RLS does this, but we check in app too)
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .select('*, matches (user_1_id, user_2_id)')
        .eq('id', validated.thread_id)
        .single();

      if (threadError) throw new Error('Thread not found');

      const threadData = thread as unknown as ChatThread & {
        matches: { user_1_id: string; user_2_id: string };
      };

      if (
        threadData.matches.user_1_id !== user.id &&
        threadData.matches.user_2_id !== user.id
      ) {
        throw new Error('Unauthorized: Cannot send message to this thread');
      }

      // Insert message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: validated.thread_id,
          sender_id: user.id,
          message_type: validated.message_type,
          content: validated.content,
          is_first_message: validated.is_first_message,
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread last_message_at
      await supabase
        .from('chat_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', validated.thread_id);

      return data as Message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.thread_id] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

/**
 * Hook to mark messages as read
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (threadId: string) => {
      if (!user) throw new Error('Not authenticated');
      validateOrThrow(uuidSchema, threadId);

      // Mark all unread messages from other users as read
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
    },
  });
}

// ============================================================================
// LIKES & PINDS HOOKS
// ============================================================================

/**
 * Hook to get likes received
 */
export function useLikesReceived() {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return useQuery({
    queryKey: ['likes', 'received', user],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Array<{
        id: string;
        from_user_id: string;
        to_user_id: string;
        seen: boolean;
        created_at: string;
      }>;
    },
    enabled: !!user,
  });
}

/**
 * Hook to send a pind
 */
export function useSendPind() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: { to_user_id: string; message: string }) => {
      if (!user) throw new Error('Not authenticated');

      const validated = validateOrThrow(createPindSchema, input);

      const { data, error } = await supabase
        .from('pinds')
        .insert({
          from_user_id: user.id,
          to_user_id: validated.to_user_id,
          message: validated.message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinds'] });
    },
  });
}

/**
 * Hook to get pinds received
 */
export function usePindsReceived() {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return useQuery({
    queryKey: ['pinds', 'received', user],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pinds')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Array<{
        id: string;
        from_user_id: string;
        to_user_id: string;
        message: string;
        read: boolean;
        created_at: string;
      }>;
    },
    enabled: !!user,
  });
}

// ============================================================================
// BLOCK & REPORT HOOKS
// ============================================================================

/**
 * Hook to block a user
 */
export function useBlockUser() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: { blocked_id: string; reason?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const validated = validateOrThrow(blockUserSchema, input);

      const { data, error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: validated.blocked_id,
          reason: validated.reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all queries as blocked users affect many views
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook to report a user
 */
export function useReportUser() {
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      reported_user_id: string;
      reason: string;
      details?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const validated = validateOrThrow(createReportSchema, input);

      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: validated.reported_user_id,
          reason: validated.reason,
          details: validated.details,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

// ============================================================================
// DISCOVER PROFILES HOOK
// ============================================================================

// ============================================================================
// PARTNER LINKS HOOKS
// ============================================================================

interface PartnerLinkWithProfile {
  id: string;
  profile_id: string;
  invited_email: string | null;
  linked_user_id: string | null;
  relationship_type: string;
  status: 'pending' | 'confirmed' | 'declined';
  name: string;
  created_at: string;
  updated_at: string;
  linked_profile?: {
    display_name: string;
    age: number;
    city: string;
    photos?: Array<{ storage_path: string; signedUrl?: string }>;
  };
}

/**
 * Hook to get partner links for current user's profile
 */
export function usePartnerLinks() {
  const { data: profile } = useCurrentProfile();

  return useQuery({
    queryKey: ['partner-links', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      try {
        const { data, error } = await supabase
          .from('partner_links')
          .select(`
            *,
            linked_profile:profiles!partner_links_linked_user_id_fkey (
              display_name,
              age,
              city,
              photos (storage_path)
            )
          `)
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) {
          // Table may not exist yet - this is expected
          console.log('[PartnerLinks] Query error (table may not exist):', error?.message ?? error?.code ?? 'Unknown');
          return [];
        }

        // Get signed URLs for linked profile photos
        const partnerLinksData = (data ?? []) as PartnerLinkWithProfile[];
        const allPhotoPaths = partnerLinksData
          .flatMap(link => link.linked_profile?.photos?.map(p => p.storage_path) ?? [])
          .filter(Boolean);

        if (allPhotoPaths.length > 0) {
          const signedUrls = await getSignedPhotoUrls(allPhotoPaths);
          return partnerLinksData.map(link => ({
            ...link,
            linked_profile: link.linked_profile ? {
              ...link.linked_profile,
              photos: link.linked_profile.photos?.map(photo => ({
                ...photo,
                signedUrl: signedUrls.get(photo.storage_path) || undefined,
              })),
            } : undefined,
          }));
        }

        return partnerLinksData;
      } catch (err) {
        console.log('[PartnerLinks] Exception:', err);
        return [];
      }
    },
    enabled: !!profile?.id,
  });
}

/**
 * Hook to get incoming partner link requests (where user was invited)
 */
export function usePartnerLinkRequests() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['partner-link-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's email to find invitations
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;

      if (!userEmail) return [];

      // Find partner links where this user was invited by email
      const { data, error } = await supabase
        .from('partner_links')
        .select(`
          *,
          requester_profile:profiles!partner_links_profile_id_fkey (
            display_name,
            age,
            city,
            photos (storage_path)
          )
        `)
        .eq('invited_email', userEmail.toLowerCase())
        .eq('status', 'pending');

      if (error) {
        console.error('[PartnerLinks] Error fetching requests:', error);
        return [];
      }

      return data ?? [];
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to add a partner link
 */
export function useAddPartnerLink() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();

  return useMutation({
    mutationFn: async (input: {
      email: string;
      name: string;
      relationshipType: string;
    }) => {
      if (!profile?.id) throw new Error('No profile');

      // Check if user exists with this email
      const { data: authData } = await supabase.auth.admin?.listUsers?.() ?? { data: null };
      // Note: Admin API may not be available client-side, so we handle gracefully

      // Check if a profile exists with this email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.email.toLowerCase())
        .maybeSingle();

      // Insert partner link
      const { data, error } = await supabase
        .from('partner_links')
        .insert({
          profile_id: profile.id,
          invited_email: input.email.toLowerCase(),
          linked_user_id: existingUser?.id ?? null,
          relationship_type: input.relationshipType,
          status: 'pending',
          name: input.name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-links'] });
    },
  });
}

/**
 * Hook to respond to a partner link request
 */
export function useRespondToPartnerLink() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: { linkId: string; accept: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const newStatus = input.accept ? 'confirmed' : 'declined';
      const updates: { status: 'confirmed' | 'declined'; linked_user_id?: string } = { status: newStatus };

      // If accepting, link the user
      if (input.accept) {
        updates.linked_user_id = user.id;
      }

      const { data, error } = await supabase
        .from('partner_links')
        .update(updates)
        .eq('id', input.linkId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-links'] });
      queryClient.invalidateQueries({ queryKey: ['partner-link-requests'] });
    },
  });
}

/**
 * Hook to remove a partner link
 */
export function useRemovePartnerLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('partner_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-links'] });
    },
  });
}

// ============================================================================
// EVENTS HOOKS
// ============================================================================

interface EventWithDetails {
  id: string;
  created_by: string;
  title: string;
  description: string;
  location: string | null;
  event_date: string;
  event_time: string | null;
  max_attendees: number | null;
  is_public: boolean;
  image_path: string | null;
  created_at: string;
  updated_at: string;
  imageSignedUrl?: string | null;
  attendee_count?: number;
  current_user_status?: 'going' | 'interested' | 'not_going' | null;
  creator_profile?: {
    display_name: string;
    photos?: Array<{ storage_path: string; signedUrl?: string }>;
  };
}

/**
 * Hook to get all public events
 */
export function useEvents() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['events', user?.id, user],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator_profile:profiles!events_created_by_fkey (
            display_name,
            photos (storage_path)
          ),
          event_attendees (id, user_id, status)
        `)
        .eq('is_public', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) {
        console.error('[Events] Error fetching:', error);
        return [];
      }

      const events = data as unknown as Array<EventWithDetails & { event_attendees: Array<{ id: string; user_id: string; status: string }> }>;

      // Get signed URLs for event images and creator photos
      const imagePaths = events
        .map(e => e.image_path)
        .filter((p): p is string => !!p);
      const creatorPhotoPaths = events
        .flatMap(e => e.creator_profile?.photos?.map(p => p.storage_path) ?? [])
        .filter(Boolean);
      const allPaths = [...imagePaths, ...creatorPhotoPaths];

      const signedUrls = allPaths.length > 0 ? await getSignedPhotoUrls(allPaths) : new Map();

      return events.map(event => ({
        ...event,
        imageSignedUrl: event.image_path ? signedUrls.get(event.image_path) || null : null,
        attendee_count: event.event_attendees?.filter(a => a.status === 'going').length ?? 0,
        current_user_status: event.event_attendees?.find(a => a.user_id === user.id)?.status as 'going' | 'interested' | 'not_going' | null ?? null,
        creator_profile: event.creator_profile ? {
          ...event.creator_profile,
          photos: event.creator_profile.photos?.map(photo => ({
            ...photo,
            signedUrl: signedUrls.get(photo.storage_path) || undefined,
          })),
        } : undefined,
      }));
    },
    enabled: !!user,
  });
}

/**
 * Hook to get a single event by ID
 */
export function useEvent(eventId: string | undefined) {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['event', eventId, user?.id, user],
    queryFn: async () => {
      if (!eventId || !user) throw new Error('Event ID required');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator_profile:profiles!events_created_by_fkey (
            user_id,
            display_name,
            photos (storage_path)
          ),
          event_attendees (
            id,
            user_id,
            status,
            attendee_profile:profiles!event_attendees_user_id_fkey (
              display_name,
              photos (storage_path)
            )
          )
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      const event = data as unknown as EventWithDetails & {
        event_attendees: Array<{
          id: string;
          user_id: string;
          status: string;
          attendee_profile: { display_name: string; photos?: Array<{ storage_path: string }> };
        }>;
      };

      // Get signed URLs
      const allPaths = [
        event.image_path,
        ...(event.creator_profile?.photos?.map(p => p.storage_path) ?? []),
        ...event.event_attendees.flatMap(a => a.attendee_profile?.photos?.map(p => p.storage_path) ?? []),
      ].filter((p): p is string => !!p);

      const signedUrls = allPaths.length > 0 ? await getSignedPhotoUrls(allPaths) : new Map();

      return {
        ...event,
        imageSignedUrl: event.image_path ? signedUrls.get(event.image_path) || null : null,
        attendee_count: event.event_attendees?.filter(a => a.status === 'going').length ?? 0,
        current_user_status: event.event_attendees?.find(a => a.user_id === user.id)?.status as 'going' | 'interested' | 'not_going' | null ?? null,
      };
    },
    enabled: !!eventId && !!user,
  });
}

/**
 * Hook to create an event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      location?: string;
      event_date: string;
      event_time?: string;
      max_attendees?: number;
      is_public?: boolean;
      image_path?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          created_by: user.id,
          title: input.title,
          description: input.description,
          location: input.location,
          event_date: input.event_date,
          event_time: input.event_time,
          max_attendees: input.max_attendees,
          is_public: input.is_public ?? true,
          image_path: input.image_path,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/**
 * Hook to update event attendance
 */
export function useUpdateEventAttendance() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: { eventId: string; status: 'going' | 'interested' | 'not_going' }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if attendance record exists
      const { data: existing } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', input.eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('event_attendees')
          .update({ status: input.status })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('event_attendees')
          .insert({
            event_id: input.eventId,
            user_id: user.id,
            status: input.status,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    },
  });
}

// ============================================================================
// DISCOVER PROFILES HOOK
// ============================================================================

/**
 * Hook to get discoverable profiles (with blocked user filtering via RLS)
 */
export function useDiscoverProfiles() {
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  return useQuery({
    queryKey: ['discover', user?.id, user],
    queryFn: async () => {
      if (!user) {
        console.log('[Discover] No user found');
        throw new Error('Not authenticated');
      }

      console.log('[Discover] Fetching profiles for user:', user.id);

      // First, get list of users the current user has blocked
      const { data: blockedUsers } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      const blockedUserIds = blockedUsers?.map(b => b.blocked_id) || [];
      console.log('[Discover] Blocked users:', blockedUserIds.length);

      // Get list of users the current user has already liked
      const { data: likedUsers } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', user.id);

      const likedUserIds = likedUsers?.map(l => l.to_user_id) || [];
      console.log('[Discover] Already liked users:', likedUserIds.length);

      // Get list of users who the current user has already matched with
      const { data: matches } = await supabase
        .from('matches')
        .select('user_1_id, user_2_id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      const matchedUserIds = (matches ?? []).map((m: { user_1_id: string; user_2_id: string }) =>
        m.user_1_id === user.id ? m.user_2_id : m.user_1_id
      );
      console.log('[Discover] Already matched users:', matchedUserIds.length);

      // Combine all users to exclude
      const excludeUserIds = [...new Set([...blockedUserIds, ...likedUserIds, ...matchedUserIds])];
      console.log('[Discover] Total users to exclude:', excludeUserIds.length);

      // Get profiles with photos and intents
      let query = supabase
        .from('profiles')
        .select(
          `
          *,
          photos (id, storage_path, order_index, is_primary),
          profile_intents (intent_id),
          prompt_responses (*)
        `
        )
        .neq('user_id', user.id);

      // Filter out excluded users if any
      if (excludeUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${excludeUserIds.join(',')})`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('[Discover] Supabase error:', error);
        throw error;
      }

      console.log('[Discover] Found profiles:', data?.length ?? 0);

      const profiles = data as unknown as ProfileWithRelations[];

      // Log photos info for debugging
      console.log('[Discover] Profile photo details:');
      profiles.forEach((p) => {
        const photoCount = p.photos?.length ?? 0;
        console.log(`[Discover] - ${p.display_name}: ${photoCount} photos`);
        if (p.photos && p.photos.length > 0) {
          p.photos.forEach((photo, idx) => {
            console.log(`[Discover]   Photo ${idx}: id=${photo.id}, path=${photo.storage_path}`);
          });
        }
      });

      // Get signed URLs for photos
      const allPhotoPaths = profiles.flatMap(
        (p) => p.photos?.map((photo) => photo.storage_path).filter(Boolean) || []
      );

      console.log(`[Discover] Total photo paths to sign: ${allPhotoPaths.length}`);

      const signedUrls = await getSignedPhotoUrls(allPhotoPaths);
      console.log(`[Discover] Signed URLs generated: ${signedUrls.size}`);

      // Map profiles with signed URLs
      const profilesWithUrls = profiles.map((profile) => ({
        ...profile,
        photos: profile.photos?.map((photo) => ({
          ...photo,
          signedUrl: signedUrls.get(photo.storage_path) || null,
        })),
      }));

      // Filter to only show profiles with at least one visible photo
      const profilesWithPhotos = profilesWithUrls.filter((profile) => {
        const hasVisiblePhoto = profile.photos?.some((photo) => photo.signedUrl);
        if (!hasVisiblePhoto) {
          console.log(`[Discover] Filtering out ${profile.display_name} - no visible photos`);
        }
        return hasVisiblePhoto;
      });

      console.log(`[Discover] Profiles with visible photos: ${profilesWithPhotos.length}`);

      return profilesWithPhotos;
    },
    enabled: !!user,
  });
}

// ============================================================================
// TRUST SCORE HOOKS
// ============================================================================

interface TrustScoreData {
  id: string;
  user_id: string;
  overall_score: number;
  tier: 'newcomer' | 'member' | 'trusted' | 'verified' | 'ambassador';
  badges: string[];
  dimensions: {
    behavior: { score: number; description: string };
    community: { score: number; description: string };
    reliability: { score: number; description: string };
    safety: { score: number; description: string };
    engagement: { score: number; description: string };
    transparency: { score: number; description: string };
  };
  stats: {
    dates_completed: number;
    events_attended: number;
    events_hosted: number;
    reviews_received: number;
    average_rating: number;
    vouches_received: number;
    response_rate: number;
    days_on_platform: number;
  };
  created_at: string;
  updated_at: string;
}

interface DateReviewData {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  categories: {
    communication: number;
    respect: number;
    authenticity: number;
    safety: number;
  };
  positives: string[];
  concerns: string[];
  comment: string | null;
  is_anonymous: boolean;
  verified: boolean;
  created_at: string;
  reviewer_profile?: {
    display_name: string;
    photos?: Array<{ storage_path: string; signedUrl?: string }>;
  };
}

interface CommunityVouchData {
  id: string;
  voucher_id: string;
  vouched_user_id: string;
  relationship: 'dated' | 'friends' | 'event_met' | 'community';
  duration_known: 'less_than_month' | '1_6_months' | '6_12_months' | 'over_year';
  message: string | null;
  created_at: string;
  voucher_profile?: {
    display_name: string;
    photos?: Array<{ storage_path: string; signedUrl?: string }>;
  };
  voucher_trust_score?: {
    tier: 'newcomer' | 'member' | 'trusted' | 'verified' | 'ambassador';
  };
}

// Default trust score for new users
function getDefaultTrustScore(userId: string): TrustScoreData {
  return {
    id: '',
    user_id: userId,
    overall_score: 20,
    tier: 'newcomer',
    badges: [],
    dimensions: {
      behavior: { score: 20, description: 'App behavior based on response rate and activity' },
      community: { score: 0, description: 'Community feedback from reviews and vouches' },
      reliability: { score: 20, description: 'Shows up and follows through on commitments' },
      safety: { score: 100, description: 'Respects boundaries, no reports' },
      engagement: { score: 10, description: 'Contributes to community events and discussions' },
      transparency: { score: 30, description: 'Profile completeness and regular updates' },
    },
    stats: {
      dates_completed: 0,
      events_attended: 0,
      events_hosted: 0,
      reviews_received: 0,
      average_rating: 0,
      vouches_received: 0,
      response_rate: 0,
      days_on_platform: 0,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Hook to get trust score for a user
 */
export function useTrustScore(userId?: string) {
  const { data: currentUser } = useCurrentUser();
  const targetUserId = userId ?? currentUser?.id;

  return useQuery({
    queryKey: ['trust-score', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('trust_scores')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('[TrustScore] Error fetching:', error);
        // Return default score instead of throwing
        return getDefaultTrustScore(targetUserId);
      }

      if (!data) {
        // No trust score exists yet, return default
        return getDefaultTrustScore(targetUserId);
      }

      return data as TrustScoreData;
    },
    enabled: !!targetUserId,
  });
}

/**
 * Hook to get reviews for a user
 */
export function useDateReviews(userId?: string) {
  const { data: currentUser } = useCurrentUser();
  const targetUserId = userId ?? currentUser?.id;

  return useQuery({
    queryKey: ['date-reviews', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('date_reviews')
        .select(`
          *,
          reviewer_profile:profiles!date_reviews_reviewer_id_fkey (
            display_name,
            photos (storage_path)
          )
        `)
        .eq('reviewed_user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DateReviews] Error fetching:', error);
        return [];
      }

      // Get signed URLs for reviewer photos
      const reviews = (data ?? []) as DateReviewData[];
      const photoPaths = reviews
        .flatMap(r => r.reviewer_profile?.photos?.map(p => p.storage_path) ?? [])
        .filter(Boolean);

      if (photoPaths.length > 0) {
        const signedUrls = await getSignedPhotoUrls(photoPaths);
        return reviews.map(review => ({
          ...review,
          reviewer_profile: review.reviewer_profile ? {
            ...review.reviewer_profile,
            photos: review.reviewer_profile.photos?.map(p => ({
              ...p,
              signedUrl: signedUrls.get(p.storage_path) || undefined,
            })),
          } : undefined,
        }));
      }

      return reviews;
    },
    enabled: !!targetUserId,
  });
}

/**
 * Hook to get vouches for a user
 */
export function useCommunityVouches(userId?: string) {
  const { data: currentUser } = useCurrentUser();
  const targetUserId = userId ?? currentUser?.id;

  return useQuery({
    queryKey: ['community-vouches', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('community_vouches')
        .select(`
          *,
          voucher_profile:profiles!community_vouches_voucher_id_fkey (
            display_name,
            photos (storage_path)
          ),
          voucher_trust_score:trust_scores!community_vouches_voucher_id_fkey (
            tier
          )
        `)
        .eq('vouched_user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CommunityVouches] Error fetching:', error);
        return [];
      }

      // Get signed URLs for voucher photos
      const vouches = (data ?? []) as CommunityVouchData[];
      const photoPaths = vouches
        .flatMap(v => v.voucher_profile?.photos?.map(p => p.storage_path) ?? [])
        .filter(Boolean);

      if (photoPaths.length > 0) {
        const signedUrls = await getSignedPhotoUrls(photoPaths);
        return vouches.map(vouch => ({
          ...vouch,
          voucher_profile: vouch.voucher_profile ? {
            ...vouch.voucher_profile,
            photos: vouch.voucher_profile.photos?.map(p => ({
              ...p,
              signedUrl: signedUrls.get(p.storage_path) || undefined,
            })),
          } : undefined,
        }));
      }

      return vouches;
    },
    enabled: !!targetUserId,
  });
}

/**
 * Hook to leave a date review
 */
export function useLeaveReview() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      reviewedUserId: string;
      rating: number;
      categories: { communication: number; respect: number; authenticity: number; safety: number };
      positives: string[];
      concerns: string[];
      comment?: string;
      isAnonymous: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('date_reviews')
        .insert({
          reviewer_id: user.id,
          reviewed_user_id: input.reviewedUserId,
          rating: input.rating,
          categories: input.categories,
          positives: input.positives,
          concerns: input.concerns,
          comment: input.comment,
          is_anonymous: input.isAnonymous,
          verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['date-reviews', variables.reviewedUserId] });
      queryClient.invalidateQueries({ queryKey: ['trust-score', variables.reviewedUserId] });
    },
  });
}

/**
 * Hook to vouch for a user
 */
export function useVouchForUser() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      vouchedUserId: string;
      relationship: 'dated' | 'friends' | 'event_met' | 'community';
      durationKnown: 'less_than_month' | '1_6_months' | '6_12_months' | 'over_year';
      message?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('community_vouches')
        .insert({
          voucher_id: user.id,
          vouched_user_id: input.vouchedUserId,
          relationship: input.relationship,
          duration_known: input.durationKnown,
          message: input.message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community-vouches', variables.vouchedUserId] });
      queryClient.invalidateQueries({ queryKey: ['trust-score', variables.vouchedUserId] });
    },
  });
}

// ============================================================================
// TASTE PROFILE / SMART MATCHING HOOKS
// ============================================================================

interface TasteProfileData {
  id: string;
  user_id: string;
  attraction_patterns: {
    preferred_age_range: [number, number];
    avg_liked_age: number;
    bio_length_preference: 'short' | 'medium' | 'long';
    preferred_photo_count: number;
    preferred_relationship_structures: string[];
  };
  behavioral_patterns: {
    avg_session_duration_mins: number;
    avg_profiles_viewed_per_session: number;
    typical_active_hours: number[];
    message_style: 'brief' | 'moderate' | 'verbose';
    response_speed: 'quick' | 'moderate' | 'thoughtful';
  };
  total_profiles_viewed: number;
  total_likes: number;
  total_passes: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

interface ProfileViewData {
  id: string;
  viewer_id: string;
  viewed_profile_id: string;
  action: 'view' | 'like' | 'super_like' | 'pass';
  dwell_time_ms: number;
  profile_metadata: {
    age: number;
    bio_length: number;
    photo_count: number;
  };
  created_at: string;
}

// Default taste profile for new users
function getDefaultTasteProfile(userId: string): TasteProfileData {
  return {
    id: '',
    user_id: userId,
    attraction_patterns: {
      preferred_age_range: [25, 45],
      avg_liked_age: 30,
      bio_length_preference: 'medium',
      preferred_photo_count: 3,
      preferred_relationship_structures: [],
    },
    behavioral_patterns: {
      avg_session_duration_mins: 10,
      avg_profiles_viewed_per_session: 15,
      typical_active_hours: [20, 21, 22],
      message_style: 'moderate',
      response_speed: 'moderate',
    },
    total_profiles_viewed: 0,
    total_likes: 0,
    total_passes: 0,
    confidence_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Hook to get taste profile for current user
 */
export function useTasteProfile() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['taste-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_taste_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[TasteProfile] Error fetching:', error);
        return getDefaultTasteProfile(user.id);
      }

      if (!data) {
        return getDefaultTasteProfile(user.id);
      }

      return data as TasteProfileData;
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to get profile views (browsing history)
 */
export function useProfileViews() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ['profile-views', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[ProfileViews] Error fetching:', error);
        return [];
      }

      return (data ?? []) as ProfileViewData[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook to track a profile view
 */
export function useTrackProfileView() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: {
      viewedProfileId: string;
      action: 'view' | 'like' | 'super_like' | 'pass';
      dwellTimeMs: number;
      profileMetadata: { age: number; bio_length: number; photo_count: number };
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profile_views')
        .insert({
          viewer_id: user.id,
          viewed_profile_id: input.viewedProfileId,
          action: input.action,
          dwell_time_ms: input.dwellTimeMs,
          profile_metadata: input.profileMetadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-views'] });
      queryClient.invalidateQueries({ queryKey: ['taste-profile'] });
    },
  });
}

/**
 * Hook to refresh/recalculate taste profile
 */
export function useRefreshTasteProfile() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get all profile views
      const { data: views, error: viewsError } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewer_id', user.id);

      if (viewsError) throw viewsError;

      const profileViews = (views ?? []) as ProfileViewData[];

      if (profileViews.length < 5) {
        // Not enough data to calculate meaningful profile
        return null;
      }

      // Calculate patterns from views
      const likes = profileViews.filter(v => v.action === 'like' || v.action === 'super_like');
      const passes = profileViews.filter(v => v.action === 'pass');

      const likedAges = likes.map(v => v.profile_metadata?.age).filter(Boolean) as number[];
      const avgLikedAge = likedAges.length > 0
        ? likedAges.reduce((a, b) => a + b, 0) / likedAges.length
        : 30;

      const preferredAgeRange: [number, number] = likedAges.length > 0
        ? [Math.min(...likedAges), Math.max(...likedAges)]
        : [25, 45];

      const likedBioLengths = likes.map(v => v.profile_metadata?.bio_length ?? 0);
      const avgBioLength = likedBioLengths.length > 0
        ? likedBioLengths.reduce((a, b) => a + b, 0) / likedBioLengths.length
        : 100;
      const bioLengthPref = avgBioLength < 100 ? 'short' : avgBioLength < 300 ? 'medium' : 'long';

      const likedPhotoCounts = likes.map(v => v.profile_metadata?.photo_count ?? 0);
      const avgPhotoCount = likedPhotoCounts.length > 0
        ? likedPhotoCounts.reduce((a, b) => a + b, 0) / likedPhotoCounts.length
        : 3;

      // Calculate behavioral patterns
      const dwellTimes = profileViews.map(v => v.dwell_time_ms);
      const avgDwellTime = dwellTimes.length > 0
        ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length / 1000 / 60
        : 10;

      const confidence = Math.min(profileViews.length / 50, 1);

      const tasteProfile: TasteProfileData = {
        id: '',
        user_id: user.id,
        attraction_patterns: {
          preferred_age_range: preferredAgeRange,
          avg_liked_age: avgLikedAge,
          bio_length_preference: bioLengthPref as 'short' | 'medium' | 'long',
          preferred_photo_count: Math.round(avgPhotoCount),
          preferred_relationship_structures: [],
        },
        behavioral_patterns: {
          avg_session_duration_mins: Math.round(avgDwellTime * profileViews.length),
          avg_profiles_viewed_per_session: Math.round(profileViews.length / Math.max(1, Math.ceil(profileViews.length / 20))),
          typical_active_hours: [20, 21, 22],
          message_style: 'moderate',
          response_speed: 'moderate',
        },
        total_profiles_viewed: profileViews.length,
        total_likes: likes.length,
        total_passes: passes.length,
        confidence_score: confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Upsert the taste profile
      const { error: upsertError } = await supabase
        .from('user_taste_profiles')
        .upsert({
          user_id: user.id,
          attraction_patterns: tasteProfile.attraction_patterns,
          behavioral_patterns: tasteProfile.behavioral_patterns,
          total_profiles_viewed: tasteProfile.total_profiles_viewed,
          total_likes: tasteProfile.total_likes,
          total_passes: tasteProfile.total_passes,
          confidence_score: tasteProfile.confidence_score,
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('[TasteProfile] Error upserting:', upsertError);
        // Return calculated profile even if upsert fails
      }

      return tasteProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taste-profile'] });
    },
  });
}
