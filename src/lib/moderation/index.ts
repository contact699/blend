/**
 * Content Moderation Module
 * 
 * Provides hooks and utilities for the moderation system:
 * - Queue management
 * - User actions (warn, suspend, ban)
 * - Appeal handling
 * - Stats dashboard
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useCurrentUser } from '../supabase/hooks';

// ============================================================================
// TYPES
// ============================================================================

export type ItemType = 'report' | 'photo' | 'message' | 'profile' | 'event';
export type QueueStatus = 'pending' | 'in_review' | 'resolved' | 'escalated' | 'dismissed';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type ModeratorRole = 'moderator' | 'admin' | 'super_admin';
export type ActionType = 
  | 'warning'
  | 'content_removed'
  | 'profile_hidden'
  | 'suspended_24h'
  | 'suspended_7d'
  | 'suspended_30d'
  | 'permanent_ban'
  | 'unbanned'
  | 'appeal_approved'
  | 'appeal_denied'
  | 'note_added';

export interface QueueItem {
  id: string;
  item_type: ItemType;
  item_id: string;
  reporter_id: string | null;
  target_user_id: string;
  status: QueueStatus;
  priority: Priority;
  reason: string;
  details: string | null;
  evidence: Record<string, unknown> | null;
  auto_flagged: boolean;
  auto_flag_reason: string | null;
  confidence_score: number | null;
  assigned_to: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution: string | null;
  action_taken: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  reporter?: { display_name: string };
  target_user?: { 
    display_name: string; 
    email: string;
    warning_count: number;
  };
}

export interface ModerationAction {
  id: string;
  queue_item_id: string | null;
  target_user_id: string;
  moderator_id: string;
  action_type: ActionType;
  reason: string;
  details: string | null;
  expires_at: string | null;
  content_type: string | null;
  content_id: string | null;
  content_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export interface ModerationStats {
  pending_reports: number;
  urgent_reports: number;
  in_review: number;
  pending_appeals: number;
  suspended_users: number;
  banned_users: number;
  actions_today: number;
  reports_today: number;
}

export interface Appeal {
  id: string;
  user_id: string;
  action_id: string;
  appeal_text: string;
  status: 'pending' | 'under_review' | 'approved' | 'denied';
  reviewed_by: string | null;
  reviewed_at: string | null;
  response: string | null;
  created_at: string;
}

// ============================================================================
// MODERATOR CHECK
// ============================================================================

/**
 * Check if current user is a moderator
 */
export function useIsModerator() {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['is-moderator', user?.id],
    queryFn: async () => {
      if (!user) return { isModerator: false, role: null };
      
      const { data, error } = await supabase
        .from('moderators')
        .select('role, permissions')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        return { isModerator: false, role: null, permissions: null };
      }
      
      return {
        isModerator: true,
        role: data.role as ModeratorRole,
        permissions: data.permissions,
      };
    },
    enabled: !!user,
  });
}

// ============================================================================
// MODERATION QUEUE
// ============================================================================

/**
 * Get moderation queue items
 */
export function useModerationQueue(filters?: {
  status?: QueueStatus;
  priority?: Priority;
  itemType?: ItemType;
}) {
  return useQuery({
    queryKey: ['moderation-queue', filters],
    queryFn: async () => {
      let query = supabase
        .from('moderation_queue')
        .select(`
          *,
          reporter:reporter_id(display_name),
          target_user:target_user_id(display_name, email, warning_count)
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.itemType) {
        query = query.eq('item_type', filters.itemType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as QueueItem[];
    },
  });
}

/**
 * Get a single queue item with full details
 */
export function useQueueItem(itemId: string) {
  return useQuery({
    queryKey: ['queue-item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select(`
          *,
          reporter:reporter_id(display_name, email),
          target_user:target_user_id(display_name, email, warning_count, is_suspended, is_banned)
        `)
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      return data as QueueItem;
    },
    enabled: !!itemId,
  });
}

/**
 * Assign queue item to self
 */
export function useAssignToSelf() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (itemId: string) => {
      // First get moderator ID
      const { data: mod } = await supabase
        .from('moderators')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      
      const { error } = await supabase
        .from('moderation_queue')
        .update({ 
          assigned_to: mod.id,
          status: 'in_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
    },
  });
}

/**
 * Resolve a queue item
 */
export function useResolveItem() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (input: {
      itemId: string;
      resolution: string;
      actionTaken: string;
      internalNotes?: string;
    }) => {
      const { data: mod } = await supabase
        .from('moderators')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      
      const { error } = await supabase
        .from('moderation_queue')
        .update({
          status: 'resolved',
          reviewed_by: mod.id,
          reviewed_at: new Date().toISOString(),
          resolution: input.resolution,
          action_taken: input.actionTaken,
          internal_notes: input.internalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
    },
  });
}

/**
 * Dismiss a queue item (no action needed)
 */
export function useDismissItem() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (input: { itemId: string; reason: string }) => {
      const { data: mod } = await supabase
        .from('moderators')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      
      const { error } = await supabase
        .from('moderation_queue')
        .update({
          status: 'dismissed',
          reviewed_by: mod.id,
          reviewed_at: new Date().toISOString(),
          resolution: input.reason,
          action_taken: 'None - dismissed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
    },
  });
}

// ============================================================================
// USER ACTIONS
// ============================================================================

/**
 * Issue a warning to a user
 */
export function useWarnUser() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (input: {
      targetUserId: string;
      reason: string;
      queueItemId?: string;
      warningLevel?: 1 | 2 | 3;
    }) => {
      const { data: mod } = await supabase
        .from('moderators')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      
      // Create moderation action
      const { data: action, error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          queue_item_id: input.queueItemId,
          target_user_id: input.targetUserId,
          moderator_id: mod.id,
          action_type: 'warning',
          reason: input.reason,
        })
        .select()
        .single();
      
      if (actionError) throw actionError;
      
      // Create warning record
      const { error: warningError } = await supabase
        .from('user_warnings')
        .insert({
          user_id: input.targetUserId,
          action_id: action.id,
          warning_level: input.warningLevel ?? 1,
          reason: input.reason,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        });
      
      if (warningError) throw warningError;
      
      return action;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
    },
  });
}

/**
 * Suspend a user
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (input: {
      targetUserId: string;
      reason: string;
      duration: '24h' | '7d' | '30d';
      queueItemId?: string;
    }) => {
      const { data: mod } = await supabase
        .from('moderators')
        .select('id, permissions')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      if (!mod.permissions?.suspend_users) {
        throw new Error('No permission to suspend users');
      }
      
      // Calculate expiry
      const durationMs = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const expiresAt = new Date(Date.now() + durationMs[input.duration]).toISOString();
      
      // Update user
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_suspended: true,
          suspended_until: expiresAt,
          suspension_reason: input.reason,
        })
        .eq('id', input.targetUserId);
      
      if (userError) throw userError;
      
      // Create moderation action
      const actionType = `suspended_${input.duration}` as ActionType;
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          queue_item_id: input.queueItemId,
          target_user_id: input.targetUserId,
          moderator_id: mod.id,
          action_type: actionType,
          reason: input.reason,
          expires_at: expiresAt,
        });
      
      if (actionError) throw actionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
    },
  });
}

/**
 * Ban a user permanently
 */
export function useBanUser() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (input: {
      targetUserId: string;
      reason: string;
      queueItemId?: string;
    }) => {
      const { data: mod } = await supabase
        .from('moderators')
        .select('id, permissions')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      if (!mod.permissions?.ban_users) {
        throw new Error('No permission to ban users');
      }
      
      // Update user
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: input.reason,
          is_active: false,
        })
        .eq('id', input.targetUserId);
      
      if (userError) throw userError;
      
      // Create moderation action
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          queue_item_id: input.queueItemId,
          target_user_id: input.targetUserId,
          moderator_id: mod.id,
          action_type: 'permanent_ban',
          reason: input.reason,
        });
      
      if (actionError) throw actionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
    },
  });
}

/**
 * Remove content (message, photo, etc.)
 */
export function useRemoveContent() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (input: {
      targetUserId: string;
      contentType: 'message' | 'photo' | 'profile' | 'event';
      contentId: string;
      reason: string;
      contentSnapshot?: Record<string, unknown>;
      queueItemId?: string;
    }) => {
      const { data: mod } = await supabase
        .from('moderators')
        .select('id, permissions')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      if (!mod.permissions?.delete_content) {
        throw new Error('No permission to delete content');
      }
      
      // Delete the actual content based on type
      if (input.contentType === 'message') {
        await supabase.from('messages').delete().eq('id', input.contentId);
      } else if (input.contentType === 'photo') {
        await supabase.from('photos').delete().eq('id', input.contentId);
      }
      
      // Create moderation action with snapshot
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          queue_item_id: input.queueItemId,
          target_user_id: input.targetUserId,
          moderator_id: mod.id,
          action_type: 'content_removed',
          reason: input.reason,
          content_type: input.contentType,
          content_id: input.contentId,
          content_snapshot: input.contentSnapshot,
        });
      
      if (actionError) throw actionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
    },
  });
}

// ============================================================================
// APPEALS
// ============================================================================

/**
 * Get pending appeals
 */
export function useAppeals(status?: Appeal['status']) {
  return useQuery({
    queryKey: ['appeals', status],
    queryFn: async () => {
      let query = supabase
        .from('moderation_appeals')
        .select(`
          *,
          user:user_id(display_name, email),
          action:action_id(action_type, reason, created_at)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Appeal[];
    },
  });
}

/**
 * Review an appeal
 */
export function useReviewAppeal() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (input: {
      appealId: string;
      approved: boolean;
      response: string;
    }) => {
      const { data: mod } = await supabase
        .from('moderators')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!mod) throw new Error('Not a moderator');
      
      const { error } = await supabase
        .from('moderation_appeals')
        .update({
          status: input.approved ? 'approved' : 'denied',
          reviewed_by: mod.id,
          reviewed_at: new Date().toISOString(),
          response: input.response,
        })
        .eq('id', input.appealId);
      
      if (error) throw error;
      
      // If approved, create an action to reverse the original
      if (input.approved) {
        const { data: appeal } = await supabase
          .from('moderation_appeals')
          .select('action_id, user_id')
          .eq('id', input.appealId)
          .single();
        
        if (appeal) {
          await supabase.from('moderation_actions').insert({
            target_user_id: appeal.user_id,
            moderator_id: mod.id,
            action_type: 'appeal_approved',
            reason: input.response,
          });
          
          // Remove suspension if applicable
          await supabase
            .from('users')
            .update({
              is_suspended: false,
              suspended_until: null,
              suspension_reason: null,
            })
            .eq('id', appeal.user_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeals'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
    },
  });
}

// ============================================================================
// STATS
// ============================================================================

/**
 * Get moderation dashboard stats
 */
export function useModerationStats() {
  return useQuery({
    queryKey: ['moderation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as ModerationStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Get action history for a user
 */
export function useUserActionHistory(userId: string) {
  return useQuery({
    queryKey: ['user-action-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_actions')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ModerationAction[];
    },
    enabled: !!userId,
  });
}
