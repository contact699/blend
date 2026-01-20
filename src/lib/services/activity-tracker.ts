/**
 * Activity Tracking Service
 * Automatically tracks user activity for trust signals
 */

import { supabase } from '@/lib/supabase';
import { ActivityMetrics, ActivityStatus } from '@/lib/types/trust-signals';

class ActivityTracker {
  private userId: string | null = null;
  private lastPingTime: number = 0;
  private pingInterval: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize activity tracker for current user
   */
  initialize(userId: string): void {
    this.userId = userId;
    this.updateLastActive();

    // Set up periodic pings
    setInterval(() => {
      this.updateLastActive();
    }, this.pingInterval);
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(): Promise<void> {
    if (!this.userId) return;

    const now = Date.now();
    if (now - this.lastPingTime < this.pingInterval) return;

    try {
      const { error } = await supabase
        .from('activity_metrics')
        .upsert({
          user_id: this.userId,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      this.lastPingTime = now;
    } catch (error) {
      console.error('Failed to update last active:', error);
    }
  }

  /**
   * Track message sent (for response rate calculation)
   */
  async trackMessageSent(recipientId: string): Promise<void> {
    if (!this.userId) return;

    try {
      // Increment message count
      const { data: metrics } = await supabase
        .from('activity_metrics')
        .select('message_count')
        .eq('user_id', this.userId)
        .single();

      const newCount = (metrics?.message_count || 0) + 1;

      await supabase
        .from('activity_metrics')
        .upsert({
          user_id: this.userId,
          message_count: newCount,
          updated_at: new Date().toISOString(),
        });

      // Update last active
      this.updateLastActive();
    } catch (error) {
      console.error('Failed to track message:', error);
    }
  }

  /**
   * Track event attendance
   */
  async trackEventAttendance(eventId: string): Promise<void> {
    if (!this.userId) return;

    try {
      const { data: metrics } = await supabase
        .from('activity_metrics')
        .select('event_attendance_count')
        .eq('user_id', this.userId)
        .single();

      const newCount = (metrics?.event_attendance_count || 0) + 1;

      await supabase
        .from('activity_metrics')
        .upsert({
          user_id: this.userId,
          event_attendance_count: newCount,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to track event attendance:', error);
    }
  }

  /**
   * Track profile view received
   */
  async trackProfileViewReceived(viewerUserId: string): Promise<void> {
    if (!this.userId) return;

    try {
      const { data: metrics } = await supabase
        .from('activity_metrics')
        .select('profile_views_received')
        .eq('user_id', this.userId)
        .single();

      const newCount = (metrics?.profile_views_received || 0) + 1;

      await supabase
        .from('activity_metrics')
        .upsert({
          user_id: this.userId,
          profile_views_received: newCount,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to track profile view:', error);
    }
  }

  /**
   * Calculate response rate
   * Based on messages where user responded within 24 hours
   */
  async calculateResponseRate(userId?: string): Promise<number | null> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) return null;

    try {
      // Get all conversations
      const { data: conversations } = await supabase
        .from('messages')
        .select('from_user_id, to_user_id, created_at')
        .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`)
        .order('created_at', { ascending: true });

      if (!conversations || conversations.length === 0) return null;

      // Group by conversation partner
      const conversationMap = new Map<string, Array<{ isFrom: boolean; timestamp: string }>>();

      conversations.forEach((msg) => {
        const partnerId =
          msg.from_user_id === targetUserId ? msg.to_user_id : msg.from_user_id;
        const isFrom = msg.from_user_id === targetUserId;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }

        conversationMap.get(partnerId)!.push({
          isFrom,
          timestamp: msg.created_at,
        });
      });

      // Calculate response rate
      let totalMessages = 0;
      let respondedWithin24h = 0;

      conversationMap.forEach((messages) => {
        for (let i = 0; i < messages.length - 1; i++) {
          const current = messages[i];
          const next = messages[i + 1];

          // If current is received and next is sent
          if (!current.isFrom && next.isFrom) {
            totalMessages++;

            const timeDiff =
              new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
            const hours = timeDiff / (1000 * 60 * 60);

            if (hours <= 24) {
              respondedWithin24h++;
            }
          }
        }
      });

      if (totalMessages === 0) return null;

      const rate = (respondedWithin24h / totalMessages) * 100;

      // Update in database
      await supabase
        .from('activity_metrics')
        .upsert({
          user_id: targetUserId,
          response_rate: rate,
          updated_at: new Date().toISOString(),
        });

      return Math.round(rate);
    } catch (error) {
      console.error('Failed to calculate response rate:', error);
      return null;
    }
  }

  /**
   * Calculate average response time in hours
   */
  async calculateAverageResponseTime(userId?: string): Promise<number | null> {
    const targetUserId = userId || this.userId;
    if (!targetUserId) return null;

    try {
      const { data: conversations } = await supabase
        .from('messages')
        .select('from_user_id, to_user_id, created_at')
        .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`)
        .order('created_at', { ascending: true });

      if (!conversations || conversations.length === 0) return null;

      const conversationMap = new Map<string, Array<{ isFrom: boolean; timestamp: string }>>();

      conversations.forEach((msg) => {
        const partnerId =
          msg.from_user_id === targetUserId ? msg.to_user_id : msg.from_user_id;
        const isFrom = msg.from_user_id === targetUserId;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }

        conversationMap.get(partnerId)!.push({
          isFrom,
          timestamp: msg.created_at,
        });
      });

      const responseTimes: number[] = [];

      conversationMap.forEach((messages) => {
        for (let i = 0; i < messages.length - 1; i++) {
          const current = messages[i];
          const next = messages[i + 1];

          if (!current.isFrom && next.isFrom) {
            const timeDiff =
              new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
            const hours = timeDiff / (1000 * 60 * 60);
            responseTimes.push(hours);
          }
        }
      });

      if (responseTimes.length === 0) return null;

      const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      // Update in database
      await supabase
        .from('activity_metrics')
        .upsert({
          user_id: targetUserId,
          average_response_time_hours: Math.round(avgHours * 100) / 100,
          updated_at: new Date().toISOString(),
        });

      return Math.round(avgHours * 100) / 100;
    } catch (error) {
      console.error('Failed to calculate average response time:', error);
      return null;
    }
  }

  /**
   * Get activity status based on last active time
   */
  getActivityStatus(lastActiveAt: string): ActivityStatus {
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      return {
        status: 'active_now',
        label: 'Active now',
        color: '#10b981',
      };
    } else if (diffHours < 24) {
      return {
        status: 'active_today',
        label: 'Active today',
        color: '#3b82f6',
      };
    } else if (diffDays < 7) {
      return {
        status: 'active_this_week',
        label: 'Active this week',
        color: '#8b5cf6',
      };
    } else if (diffDays < 30) {
      return {
        status: 'active_this_month',
        label: 'Active this month',
        color: '#6b7280',
      };
    } else {
      return {
        status: 'inactive',
        label: 'Inactive',
        color: '#ef4444',
      };
    }
  }

  /**
   * Get formatted response time string
   */
  getResponseTimeLabel(hours: number | null): string {
    if (hours === null) return 'No data yet';

    if (hours < 1) return 'Within an hour';
    if (hours < 24) return `~${Math.round(hours)} hours`;
    const days = Math.round(hours / 24);
    return `~${days} ${days === 1 ? 'day' : 'days'}`;
  }

  /**
   * Get account age in days
   */
  getAccountAgeDays(createdAt: string): number {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get account age label
   */
  getAccountAgeLabel(days: number): string {
    if (days < 7) return 'New member';
    if (days < 30) return `${days} days`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  /**
   * Cleanup on logout
   */
  cleanup(): void {
    this.userId = null;
    this.lastPingTime = 0;
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker();
