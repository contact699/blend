/**
 * RevenueCat Integration Service
 * Handles subscription purchases and status syncing
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { SubscriptionTier, Subscription } from '@/lib/types/monetization';
import useSubscriptionStore from '@/lib/state/subscription-store';

// Product IDs (must match App Store Connect / Google Play Console)
const PRODUCT_IDS = {
  premium_monthly: 'blend_premium_monthly',
  premium_yearly: 'blend_premium_yearly',
  premium_plus_monthly: 'blend_premium_plus_monthly',
  premium_plus_yearly: 'blend_premium_plus_yearly',
  super_like_pack_10: 'blend_super_likes_10',
  boost_single: 'blend_boost_single',
} as const;

class RevenueService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once at app startup
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure with API keys from environment
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      });

      if (!apiKey) {
        console.warn('RevenueCat API key not configured');
        return;
      }

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Initialize SDK
      Purchases.configure({ apiKey });

      // Set user ID for cross-platform subscription tracking
      await Purchases.logIn(userId);

      // Sync initial subscription status
      await this.syncSubscriptionStatus();

      this.initialized = true;
      console.log('✅ RevenueCat initialized');
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(
    pkg: PurchasesPackage
  ): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await this.syncSubscriptionStatus(customerInfo);
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('Purchase failed:', error);

      // User cancelled
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      await this.syncSubscriptionStatus(customerInfo);
      return { success: true };
    } catch (error: any) {
      console.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Sync subscription status with local store
   */
  async syncSubscriptionStatus(customerInfo?: CustomerInfo): Promise<void> {
    try {
      const info = customerInfo ?? (await this.getCustomerInfo());
      if (!info) return;

      const { activeSubscriptions, allPurchasedProductIdentifiers, entitlements } = info;

      // Check for active premium entitlements
      const premiumEntitlement = entitlements.active['premium'];
      const premiumPlusEntitlement = entitlements.active['premium_plus'];

      let tier: SubscriptionTier = 'free';
      let subscription: Subscription | null = null;

      if (premiumPlusEntitlement) {
        tier = 'premium_plus';
        subscription = this.mapEntitlementToSubscription(premiumPlusEntitlement, 'premium_plus');
      } else if (premiumEntitlement) {
        tier = 'premium';
        subscription = this.mapEntitlementToSubscription(premiumEntitlement, 'premium');
      }

      // Update local subscription store
      useSubscriptionStore.getState().setSubscription(subscription);

      console.log('✅ Subscription synced:', tier);
    } catch (error) {
      console.error('Failed to sync subscription:', error);
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const info = await this.getCustomerInfo();
    if (!info) return false;

    const { entitlements } = info;
    return !!(entitlements.active['premium'] || entitlements.active['premium_plus']);
  }

  /**
   * Get subscription tier
   */
  async getSubscriptionTier(): Promise<SubscriptionTier> {
    const info = await this.getCustomerInfo();
    if (!info) return 'free';

    const { entitlements } = info;

    if (entitlements.active['premium_plus']) return 'premium_plus';
    if (entitlements.active['premium']) return 'premium';
    return 'free';
  }

  /**
   * Cancel subscription (redirect to system settings)
   */
  async cancelSubscription(): Promise<void> {
    try {
      // RevenueCat doesn't handle cancellation directly
      // Users must cancel via App Store / Play Store
      // @ts-expect-error - Method name may vary by react-native-purchases version
      await Purchases.showManagementURL?.();
    } catch (error) {
      console.error('Failed to show management URL:', error);
    }
  }

  /**
   * Purchase one-time item (Super Likes, Boost)
   */
  async purchaseItem(
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) {
        return { success: false, error: 'No offerings available' };
      }

      // Find the product in available packages
      const pkg = offerings.availablePackages.find(
        (p) => p.product.identifier === productId
      );

      if (!pkg) {
        return { success: false, error: 'Product not found' };
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('✅ Item purchased:', productId);
      return { success: true };
    } catch (error: any) {
      console.error('Purchase failed:', error);

      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Map RevenueCat entitlement to Subscription object
   */
  private mapEntitlementToSubscription(
    entitlement: any,
    tier: 'premium' | 'premium_plus'
  ): Subscription {
    const productId = entitlement.productIdentifier;
    const billingCycle = productId.includes('yearly') ? 'yearly' : 'monthly';

    // Pricing
    const amount =
      tier === 'premium'
        ? billingCycle === 'monthly'
          ? 2499
          : 24999
        : billingCycle === 'monthly'
          ? 3999
          : 39999;

    return {
      id: entitlement.identifier,
      user_id: '', // Will be set by subscription store
      tier,
      status: 'active',
      billing_cycle: billingCycle,
      amount,
      currency: 'USD',
      provider: Platform.OS === 'ios' ? 'apple' : 'google',
      provider_subscription_id: productId,
      provider_customer_id: entitlement.originalPurchaseDate ?? '',
      started_at: entitlement.originalPurchaseDate ?? new Date().toISOString(),
      current_period_start: entitlement.latestPurchaseDate ?? new Date().toISOString(),
      current_period_end: entitlement.expirationDate ?? new Date().toISOString(),
      canceled_at: entitlement.unsubscribeDetectedAt ?? null,
      trial_end: null,
      created_at: entitlement.originalPurchaseDate ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Logout user (call when user signs out)
   */
  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
      this.initialized = false;
      console.log('✅ RevenueCat logged out');
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }
}

// Export singleton instance
export const revenueService = new RevenueService();
export { PRODUCT_IDS };
