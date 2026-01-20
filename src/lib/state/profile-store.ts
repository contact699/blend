import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types';

interface ProfileStore {
  // State
  currentProfile: Profile | null;

  // Actions
  setCurrentProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  reset: () => void;
}

const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      currentProfile: null,

      setCurrentProfile: (profile) => set({ currentProfile: profile }),

      updateProfile: (updates) =>
        set((state) => {
          if (state.currentProfile) {
            return { currentProfile: { ...state.currentProfile, ...updates } };
          }
          // If no profile exists, we'll need user_id from auth-store
          // This should rarely happen - profile should be created first
          console.warn('updateProfile called without existing profile');
          return state;
        }),

      reset: () => set({ currentProfile: null }),
    }),
    {
      name: 'blend-profile-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useProfileStore;
