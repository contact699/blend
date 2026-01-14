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
  useUpdateEventAttendance,
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

export type { Database } from './types';
