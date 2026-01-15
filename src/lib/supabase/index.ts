// Supabase Security Module
// Export all security-related utilities

export { supabase, getCurrentUser, getSession, onAuthStateChange } from './client';

export {
  useCurrentUser,
  useCurrentProfile,
  useProfile,
  useUpdateProfile,
  useUploadPhoto,
  useDeletePhoto,
  useMatches,
  useMatch,
  useThreadMessages,
  useSendMessage,
  useMarkMessagesRead,
  useLikesReceived,
  useSendPind,
  usePindsReceived,
  useBlockUser,
  useReportUser,
  useDiscoverProfiles,
  // Partner Links
  usePartnerLinks,
  usePartnerLinkRequests,
  useAddPartnerLink,
  useRespondToPartnerLink,
  useRemovePartnerLink,
  // Events
  useEvents,
  useEvent,
  useCreateEvent,
  // Trust Score
  useTrustScore,
  useDateReviews,
  useCommunityVouches,
  useLeaveReview,
  useVouchForUser,
  // Taste Profile / Smart Matching
  useTasteProfile,
  useProfileViews,
  useTrackProfileView,
  useRefreshTasteProfile,
} from './hooks';

export {
  stripExifData,
  uploadPhoto,
  getSignedPhotoUrl,
  getSignedPhotoUrls,
  deletePhoto,
  validateImage,
  securePhotoUpload,
} from './photos';

// Type adapters for transforming Supabase data to App types
export {
  // Utility functions
  nullToUndefined,
  undefinedToNull,
  parseDate,
  // Profile adapters
  transformProfile,
  transformProfiles,
  extractPhotoUrl,
  getFirstPhotoUrl,
  hasPhotos,
  // Event adapters
  transformEvent,
  transformEvents,
  // Message adapters
  transformMessage,
  transformMessages,
  // Match adapters
  transformMatch,
  transformMatches,
  // Thread adapters
  transformChatThread,
  transformChatThreads,
  // Like & Pind adapters
  transformLike,
  transformLikes,
  transformPind,
  transformPinds,
  // Partner adapters
  transformLinkedPartner,
  // Type guards
  isSupabaseProfile,
  isAppProfile,
  ensureAppProfile,
} from './adapters';

// Supabase types for use in hooks
export type {
  SupabasePhoto,
  SupabaseProfile,
  SupabaseProfileIntent,
  SupabasePromptResponse,
  SupabaseEvent,
  SupabaseMessage,
  SupabaseMatch,
  SupabaseChatThread,
  SupabaseLike,
  SupabasePind,
  SupabaseLinkedPartner,
} from './adapters';

export type { Database } from './types';
