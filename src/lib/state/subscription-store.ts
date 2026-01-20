import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Subscription,
  SubscriptionTier,
  SubscriptionFeatures,
  SUBSCRIPTION_FEATURES,
  DailyUsage,
  SuperLike,
  ProfileBoost,
  Referral,
  ReferralCode,
} from '../types/monetization';

interface SubscriptionStore {
  // State
  subscription: Subscription | null;
  dailyUsage: DailyUsage | null;
  superLikes: SuperLike[];
  activeBoosts: ProfileBoost[];
  referralCode: ReferralCode | null;
  referrals: Referral[];

  // Subscription actions
  setSubscription: (subscription: Subscription | null) => void;
  cancelSubscription: () => void;
  upgradeTier: (tier: SubscriptionTier) => void;

  // Usage tracking
  setDailyUsage: (usage: DailyUsage) => void;
  incrementLikesUsed: () => void;
  incrementSuperLikesUsed: () => void;
  incrementBoostsUsed: () => void;

  // Super likes
  addSuperLike: (superLike: SuperLike) => void;
  markSuperLikeSeen: (superLikeId: string) => void;

  // Boosts
  addBoost: (boost: ProfileBoost) => void;
  completeBoost: (boostId: string, impressions: number, likesGained: number) => void;

  // Referrals
  setReferralCode: (code: ReferralCode) => void;
  addReferral: (referral: Referral) => void;
  completeReferral: (referralId: string) => void;
  claimReferralReward: (referralId: string, isReferrer: boolean) => void;

  // Feature checks
  canUseLike: () => boolean;
  canUseSuperLike: () => boolean;
  canUseBoost: () => boolean;
  getRemainingLikes: () => number | null; // null = unlimited
  getFeatures: () => SubscriptionFeatures;
  getTier: () => SubscriptionTier;
  isPremium: () => boolean;

  // Admin
  reset: () => void;
}

const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      subscription: null,
      dailyUsage: null,
      superLikes: [],
      activeBoosts: [],
      referralCode: null,
      referrals: [],

      setSubscription: (subscription) => {
        set({ subscription });
      },

      cancelSubscription: () => {
        set((state) => ({
          subscription: state.subscription
            ? {
                ...state.subscription,
                status: 'canceled',
                canceled_at: new Date().toISOString(),
              }
            : null,
        }));
      },

      upgradeTier: (tier) => {
        set((state) => ({
          subscription: state.subscription
            ? {
                ...state.subscription,
                tier,
                updated_at: new Date().toISOString(),
              }
            : null,
        }));
      },

      setDailyUsage: (usage) => {
        set({ dailyUsage: usage });
      },

      incrementLikesUsed: () => {
        set((state) => {
          if (!state.dailyUsage) {
            const today = new Date().toISOString().split('T')[0];
            return {
              dailyUsage: {
                id: `usage-${Date.now()}`,
                user_id: '', // Will be set from current user
                date: today!,
                likes_used: 1,
                super_likes_used: 0,
                boosts_used: 0,
                rewinds_used: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            };
          }

          return {
            dailyUsage: {
              ...state.dailyUsage,
              likes_used: state.dailyUsage.likes_used + 1,
              updated_at: new Date().toISOString(),
            },
          };
        });
      },

      incrementSuperLikesUsed: () => {
        set((state) => ({
          dailyUsage: state.dailyUsage
            ? {
                ...state.dailyUsage,
                super_likes_used: state.dailyUsage.super_likes_used + 1,
                updated_at: new Date().toISOString(),
              }
            : state.dailyUsage,
        }));
      },

      incrementBoostsUsed: () => {
        set((state) => ({
          dailyUsage: state.dailyUsage
            ? {
                ...state.dailyUsage,
                boosts_used: state.dailyUsage.boosts_used + 1,
                updated_at: new Date().toISOString(),
              }
            : state.dailyUsage,
        }));
      },

      addSuperLike: (superLike) => {
        set((state) => ({
          superLikes: [...state.superLikes, superLike],
        }));
      },

      markSuperLikeSeen: (superLikeId) => {
        set((state) => ({
          superLikes: state.superLikes.map((sl) =>
            sl.id === superLikeId ? { ...sl, seen: true } : sl
          ),
        }));
      },

      addBoost: (boost) => {
        set((state) => ({
          activeBoosts: [...state.activeBoosts, boost],
        }));
      },

      completeBoost: (boostId, impressions, likesGained) => {
        set((state) => ({
          activeBoosts: state.activeBoosts.map((boost) =>
            boost.id === boostId
              ? { ...boost, status: 'completed', impressions, likes_gained: likesGained }
              : boost
          ),
        }));
      },

      setReferralCode: (code) => {
        set({ referralCode: code });
      },

      addReferral: (referral) => {
        set((state) => ({
          referrals: [...state.referrals, referral],
        }));
      },

      completeReferral: (referralId) => {
        set((state) => ({
          referrals: state.referrals.map((r) =>
            r.id === referralId
              ? {
                  ...r,
                  status: 'completed' as const,
                  completed_at: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      claimReferralReward: (referralId, isReferrer) => {
        set((state) => ({
          referrals: state.referrals.map((r) => {
            if (r.id !== referralId) return r;

            if (isReferrer) {
              return { ...r, referrer_reward_claimed: true };
            } else {
              return { ...r, referred_reward_claimed: true };
            }
          }),
        }));
      },

      canUseLike: () => {
        const state = get();
        const tier = state.getTier();
        const features = SUBSCRIPTION_FEATURES[tier];

        // Premium/Premium Plus have unlimited likes
        if (features.daily_likes_limit === null) return true;

        // Check daily usage
        if (!state.dailyUsage) return true;

        return state.dailyUsage.likes_used < features.daily_likes_limit;
      },

      canUseSuperLike: () => {
        const state = get();
        const tier = state.getTier();
        const features = SUBSCRIPTION_FEATURES[tier];

        if (features.super_likes_per_month === 0) return false;

        // Check monthly usage (simplified - would need month-based tracking)
        if (!state.dailyUsage) return true;

        return state.dailyUsage.super_likes_used < features.super_likes_per_month;
      },

      canUseBoost: () => {
        const state = get();
        const tier = state.getTier();
        const features = SUBSCRIPTION_FEATURES[tier];

        if (features.profile_boost_per_month === 0) return false;

        // Check if there's an active boost
        const hasActiveBoost = state.activeBoosts.some((boost) => boost.status === 'active');
        if (hasActiveBoost) return false;

        // Check monthly usage (simplified - would need month-based tracking)
        if (!state.dailyUsage) return true;

        return state.dailyUsage.boosts_used < features.profile_boost_per_month;
      },

      getRemainingLikes: () => {
        const state = get();
        const tier = state.getTier();
        const features = SUBSCRIPTION_FEATURES[tier];

        if (features.daily_likes_limit === null) return null; // Unlimited

        if (!state.dailyUsage) return features.daily_likes_limit;

        return Math.max(0, features.daily_likes_limit - state.dailyUsage.likes_used);
      },

      getFeatures: () => {
        const tier = get().getTier();
        return SUBSCRIPTION_FEATURES[tier];
      },

      getTier: () => {
        const state = get();
        if (!state.subscription || state.subscription.status !== 'active') {
          return 'free';
        }
        return state.subscription.tier;
      },

      isPremium: () => {
        const tier = get().getTier();
        return tier === 'premium' || tier === 'premium_plus';
      },

      reset: () =>
        set({
          subscription: null,
          dailyUsage: null,
          superLikes: [],
          activeBoosts: [],
          referralCode: null,
          referrals: [],
        }),
    }),
    {
      name: 'blend-subscription-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        referralCode: state.referralCode,
        // Don't persist usage/boosts - fetch fresh
      }),
    }
  )
);

export default useSubscriptionStore;
