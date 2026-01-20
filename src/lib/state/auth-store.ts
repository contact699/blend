import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore {
  // State
  isOnboarded: boolean;
  currentUserId: string;

  // Actions
  setOnboarded: (value: boolean) => void;
  setCurrentUserId: (userId: string) => void;
  reset: () => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isOnboarded: false,
      currentUserId: '',

      setOnboarded: (value) => set({ isOnboarded: value }),

      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      reset: () =>
        set({
          isOnboarded: false,
          currentUserId: '',
        }),
    }),
    {
      name: 'blend-auth-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAuthStore;
