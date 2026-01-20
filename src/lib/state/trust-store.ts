import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TrustScore,
  TrustTier,
  TrustBadge,
  TrustDimension,
  TrustScoreChange,
  DateReview,
  CommunityVouch,
  TrustReport,
  TrustSettings,
  TrustNotification,
} from '../types';

interface TrustStore {
  // State
  trustScores: Record<string, TrustScore>;
  dateReviews: DateReview[];
  communityVouches: CommunityVouch[];
  trustReports: TrustReport[];
  trustSettings: TrustSettings | null;
  trustNotifications: TrustNotification[];

  // Trust score actions
  getTrustScore: (userId: string) => TrustScore | null;
  initializeTrustScore: (userId: string) => TrustScore;
  updateTrustScore: (userId: string, dimension: keyof TrustScore['dimensions'], change: number, reason: string) => void;

  // Date review actions
  submitDateReview: (review: Omit<DateReview, 'id' | 'created_at' | 'verified'>) => void;
  getReviewsForUser: (userId: string) => DateReview[];
  getMyReviews: (currentUserId: string) => DateReview[];

  // Vouch actions
  submitVouch: (vouch: Omit<CommunityVouch, 'id' | 'created_at' | 'voucher_trust_tier'>) => void;
  getVouchesForUser: (userId: string) => CommunityVouch[];

  // Report actions
  submitTrustReport: (report: Omit<TrustReport, 'id' | 'created_at' | 'status'>) => void;

  // Settings actions
  updateTrustSettings: (currentUserId: string, settings: Partial<TrustSettings>) => void;
  getTrustSettings: () => TrustSettings | null;

  // Notification actions
  markTrustNotificationRead: (notificationId: string) => void;
  getUnreadTrustNotifications: (currentUserId: string) => TrustNotification[];

  // Helpers
  canMessageUser: (currentUserId: string, targetUserId: string) => boolean;
  calculateTrustTier: (score: number) => TrustTier;
  checkAndAwardBadges: (userId: string) => TrustBadge[];

  // Admin
  reset: () => void;
}

const useTrustStore = create<TrustStore>()(
  persist(
    (set, get) => ({
      trustScores: {},
      dateReviews: [],
      communityVouches: [],
      trustReports: [],
      trustSettings: null,
      trustNotifications: [],

      getTrustScore: (userId) => {
        const state = get();
        return state.trustScores[userId] ?? null;
      },

      initializeTrustScore: (userId) => {
        const state = get();
        const existing = state.trustScores[userId];
        if (existing) return existing;

        const now = new Date().toISOString();
        const createDimension = (name: string, description: string): TrustDimension => ({
          id: `dim-${name}-${userId}`,
          name,
          score: 50,
          weight: 1 / 6,
          description,
          factors: [],
        });

        const newTrustScore: TrustScore = {
          user_id: userId,
          overall_score: 25,
          tier: 'newcomer',
          badges: [],
          dimensions: {
            behavior: createDimension('Behavior', 'How you interact on the app'),
            community: createDimension('Community', 'Feedback from other users'),
            reliability: createDimension('Reliability', 'Showing up and following through'),
            safety: createDimension('Safety', 'Respecting boundaries and consent'),
            engagement: createDimension('Engagement', 'Contributing to the community'),
            transparency: createDimension('Transparency', 'Profile completeness and honesty'),
          },
          stats: {
            dates_completed: 0,
            events_attended: 0,
            events_hosted: 0,
            reviews_received: 0,
            average_rating: 0,
            vouches_received: 0,
            vouches_given: 0,
            reports_received: 0,
            reports_upheld: 0,
            response_rate: 0,
            message_quality_score: 0,
            profile_completeness: 0,
            days_on_platform: 0,
            last_active: now,
          },
          history: [],
          created_at: now,
          updated_at: now,
        };

        set((state) => ({
          trustScores: { ...state.trustScores, [userId]: newTrustScore },
        }));

        return newTrustScore;
      },

      updateTrustScore: (userId, dimension, change, reason) => {
        const state = get();
        let trustScore = state.trustScores[userId];
        if (!trustScore) {
          trustScore = get().initializeTrustScore(userId);
        }

        const now = new Date().toISOString();
        const previousScore = trustScore.overall_score;

        // Update the specific dimension
        const updatedDimension = {
          ...trustScore.dimensions[dimension],
          score: Math.max(0, Math.min(100, trustScore.dimensions[dimension].score + change)),
        };

        // Calculate new overall score
        const dimensions = { ...trustScore.dimensions, [dimension]: updatedDimension };
        const overallScore = Math.round(
          Object.values(dimensions).reduce((sum, d) => sum + d.score * d.weight, 0)
        );

        // Determine new tier
        const newTier = get().calculateTrustTier(overallScore);

        // Create history entry
        const historyEntry: TrustScoreChange = {
          id: `change-${Date.now()}`,
          timestamp: now,
          previous_score: previousScore,
          new_score: overallScore,
          reason,
          dimension_affected: dimension,
          factor: reason,
        };

        const updatedTrustScore: TrustScore = {
          ...trustScore,
          dimensions,
          overall_score: overallScore,
          tier: newTier,
          history: [...trustScore.history.slice(-50), historyEntry],
          updated_at: now,
        };

        set((state) => ({
          trustScores: { ...state.trustScores, [userId]: updatedTrustScore },
        }));

        // Check for tier upgrade notification
        if (newTier !== trustScore.tier) {
          const notification: TrustNotification = {
            id: `trust-notif-${Date.now()}`,
            user_id: userId,
            type: overallScore > previousScore ? 'tier_upgraded' : 'score_decreased',
            title: overallScore > previousScore ? 'Trust Tier Upgraded!' : 'Trust Score Changed',
            body:
              overallScore > previousScore
                ? `You've reached ${newTier} status!`
                : `Your trust score has changed.`,
            read: false,
            created_at: now,
          };
          set((state) => ({ trustNotifications: [...state.trustNotifications, notification] }));
        }

        // Check and award badges
        get().checkAndAwardBadges(userId);
      },

      submitDateReview: (reviewData) => {
        const now = new Date().toISOString();

        const newReview: DateReview = {
          ...reviewData,
          id: `review-${Date.now()}`,
          created_at: now,
          verified: false,
        };

        set((state) => ({ dateReviews: [...state.dateReviews, newReview] }));

        // Update the reviewed user's trust score
        const ratingDelta = (reviewData.rating - 3) * 3; // -6 to +6
        get().updateTrustScore(
          reviewData.reviewed_user_id,
          'community',
          ratingDelta,
          `Date review: ${reviewData.rating}/5 stars`
        );

        // Update stats
        const state = get();
        const trustScore = state.trustScores[reviewData.reviewed_user_id];
        if (trustScore) {
          const reviews = state.dateReviews.filter(
            (r) => r.reviewed_user_id === reviewData.reviewed_user_id
          );
          const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0) + reviewData.rating;
          const avgRating = totalRatings / (reviews.length + 1);

          const updatedScore: TrustScore = {
            ...trustScore,
            stats: {
              ...trustScore.stats,
              reviews_received: trustScore.stats.reviews_received + 1,
              average_rating: avgRating,
              dates_completed: trustScore.stats.dates_completed + (reviewData.met_in_person ? 1 : 0),
            },
          };

          set((state) => ({
            trustScores: { ...state.trustScores, [reviewData.reviewed_user_id]: updatedScore },
          }));
        }

        // Send notification
        const notification: TrustNotification = {
          id: `trust-notif-${Date.now()}`,
          user_id: reviewData.reviewed_user_id,
          type: 'review_received',
          title: 'New Review',
          body: reviewData.is_anonymous
            ? 'Someone left you a review!'
            : `${reviewData.reviewer_name} left you a review`,
          read: false,
          created_at: now,
        };
        set((state) => ({ trustNotifications: [...state.trustNotifications, notification] }));
      },

      getReviewsForUser: (userId) => {
        const state = get();
        return state.dateReviews.filter((r) => r.reviewed_user_id === userId);
      },

      getMyReviews: (currentUserId) => {
        const state = get();
        return state.dateReviews.filter((r) => r.reviewer_id === currentUserId);
      },

      submitVouch: (vouchData) => {
        const state = get();
        const now = new Date().toISOString();

        // Get voucher's trust tier
        const voucherTrustScore = state.trustScores[vouchData.voucher_id];
        const voucherTier: TrustTier = voucherTrustScore?.tier ?? 'newcomer';

        const newVouch: CommunityVouch = {
          ...vouchData,
          id: `vouch-${Date.now()}`,
          voucher_trust_tier: voucherTier,
          created_at: now,
        };

        set((state) => ({ communityVouches: [...state.communityVouches, newVouch] }));

        // Update trust score - vouches from higher tier users count more
        const tierMultiplier: Record<TrustTier, number> = {
          newcomer: 1,
          member: 1.5,
          trusted: 2,
          verified: 3,
          ambassador: 4,
        };
        const vouchValue = 3 * tierMultiplier[voucherTier];

        get().updateTrustScore(
          vouchData.vouched_user_id,
          'community',
          vouchValue,
          `Vouched by ${vouchData.voucher_name}`
        );

        // Update stats
        const trustScore = state.trustScores[vouchData.vouched_user_id];
        if (trustScore) {
          const updatedScore: TrustScore = {
            ...trustScore,
            stats: {
              ...trustScore.stats,
              vouches_received: trustScore.stats.vouches_received + 1,
            },
          };
          set((state) => ({
            trustScores: { ...state.trustScores, [vouchData.vouched_user_id]: updatedScore },
          }));
        }

        // Send notification
        const notification: TrustNotification = {
          id: `trust-notif-${Date.now()}`,
          user_id: vouchData.vouched_user_id,
          type: 'vouch_received',
          title: 'New Vouch!',
          body: `${vouchData.voucher_name} vouched for you`,
          read: false,
          created_at: now,
        };
        set((state) => ({ trustNotifications: [...state.trustNotifications, notification] }));
      },

      getVouchesForUser: (userId) => {
        const state = get();
        return state.communityVouches.filter((v) => v.vouched_user_id === userId);
      },

      submitTrustReport: (reportData) => {
        const now = new Date().toISOString();

        const newReport: TrustReport = {
          ...reportData,
          id: `report-${Date.now()}`,
          status: 'pending',
          created_at: now,
        };

        set((state) => ({ trustReports: [...state.trustReports, newReport] }));

        // Immediate trust impact
        const severityImpact: Record<string, number> = {
          low: -2,
          medium: -5,
          high: -10,
          critical: -20,
        };

        get().updateTrustScore(
          reportData.reported_user_id,
          'safety',
          severityImpact[reportData.severity] ?? -5,
          `Report received: ${reportData.type}`
        );

        // Update stats
        const state = get();
        const trustScore = state.trustScores[reportData.reported_user_id];
        if (trustScore) {
          const updatedScore: TrustScore = {
            ...trustScore,
            stats: {
              ...trustScore.stats,
              reports_received: trustScore.stats.reports_received + 1,
            },
          };
          set((state) => ({
            trustScores: { ...state.trustScores, [reportData.reported_user_id]: updatedScore },
          }));
        }
      },

      updateTrustSettings: (currentUserId, settings) => {
        const state = get();
        const currentSettings = state.trustSettings ?? {
          user_id: currentUserId,
          min_trust_to_message: 'newcomer' as TrustTier,
          show_trust_score: true,
          allow_anonymous_reviews: true,
          notify_on_trust_change: true,
        };

        set({
          trustSettings: { ...currentSettings, ...settings },
        });
      },

      getTrustSettings: () => {
        const state = get();
        return state.trustSettings;
      },

      markTrustNotificationRead: (notificationId) => {
        set((state) => ({
          trustNotifications: state.trustNotifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      getUnreadTrustNotifications: (currentUserId) => {
        const state = get();
        return state.trustNotifications.filter((n) => !n.read && n.user_id === currentUserId);
      },

      canMessageUser: (currentUserId, targetUserId) => {
        const state = get();
        const targetSettings = state.trustSettings;
        if (!targetSettings) return true;

        const myTrustScore = state.trustScores[currentUserId];
        const myTier = myTrustScore?.tier ?? 'newcomer';

        const tierOrder: TrustTier[] = ['newcomer', 'member', 'trusted', 'verified', 'ambassador'];
        const myTierIndex = tierOrder.indexOf(myTier);
        const requiredTierIndex = tierOrder.indexOf(targetSettings.min_trust_to_message);

        return myTierIndex >= requiredTierIndex;
      },

      calculateTrustTier: (score) => {
        if (score >= 90) return 'ambassador';
        if (score >= 75) return 'verified';
        if (score >= 50) return 'trusted';
        if (score >= 25) return 'member';
        return 'newcomer';
      },

      checkAndAwardBadges: (userId) => {
        const state = get();
        const trustScore = state.trustScores[userId];
        if (!trustScore) return [];

        const newBadges: TrustBadge[] = [];
        const currentBadges = new Set(trustScore.badges);

        // Check for Safe Dater badge
        const reviews = state.dateReviews.filter((r) => r.reviewed_user_id === userId);
        const positiveReviews = reviews.filter((r) => r.rating >= 4);
        if (positiveReviews.length >= 5 && !currentBadges.has('safe_dater')) {
          newBadges.push('safe_dater');
        }

        // Check for Community Vouched badge
        const vouches = state.communityVouches.filter((v) => v.vouched_user_id === userId);
        const trustedVouches = vouches.filter((v) =>
          ['trusted', 'verified', 'ambassador'].includes(v.voucher_trust_tier)
        );
        if (trustedVouches.length >= 3 && !currentBadges.has('community_vouched')) {
          newBadges.push('community_vouched');
        }

        // Check for Reliable badge
        if (trustScore.stats.dates_completed >= 5 && !currentBadges.has('reliable')) {
          newBadges.push('reliable');
        }

        // Check for Event Host badge
        if (trustScore.stats.events_hosted >= 3 && !currentBadges.has('event_host')) {
          newBadges.push('event_host');
        }

        // Check for Long Term Member
        if (trustScore.stats.days_on_platform >= 365 && !currentBadges.has('long_term_member')) {
          newBadges.push('long_term_member');
        }

        // Check for Great Communicator
        if (trustScore.stats.response_rate >= 0.9 && !currentBadges.has('great_communicator')) {
          newBadges.push('great_communicator');
        }

        // Check for Respectful
        if (
          trustScore.stats.reports_upheld === 0 &&
          trustScore.stats.dates_completed >= 3 &&
          !currentBadges.has('respectful')
        ) {
          newBadges.push('respectful');
        }

        // Award new badges
        if (newBadges.length > 0) {
          const updatedScore: TrustScore = {
            ...trustScore,
            badges: [...trustScore.badges, ...newBadges],
          };
          set((state) => ({
            trustScores: { ...state.trustScores, [userId]: updatedScore },
          }));

          // Send notifications
          const now = new Date().toISOString();
          const badgeNotifications: TrustNotification[] = newBadges.map((badge) => ({
            id: `trust-notif-badge-${Date.now()}-${badge}`,
            user_id: userId,
            type: 'badge_earned' as const,
            title: 'Badge Earned!',
            body: `You earned the "${badge.replace(/_/g, ' ')}" badge`,
            read: false,
            created_at: now,
          }));
          set((state) => ({ trustNotifications: [...state.trustNotifications, ...badgeNotifications] }));
        }

        return newBadges;
      },

      reset: () =>
        set({
          trustScores: {},
          dateReviews: [],
          communityVouches: [],
          trustReports: [],
          trustSettings: null,
          trustNotifications: [],
        }),
    }),
    {
      name: 'blend-trust-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useTrustStore;
