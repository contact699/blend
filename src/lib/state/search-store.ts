import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SearchFilters,
  SavedSearch,
  QuickFilterType,
  SearchSortOption,
  SearchViewMode,
  DEFAULT_SEARCH_FILTERS,
} from '../types';

interface SearchStore {
  // State
  searchFilters: SearchFilters;
  savedSearches: SavedSearch[];
  recentSearches: string[];
  searchHistory: { query: string; timestamp: string }[];
  searchViewMode: SearchViewMode;
  searchSortOption: SearchSortOption;

  // Filter actions
  setSearchFilters: (filters: SearchFilters) => void;
  updateSearchFilters: (updates: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  toggleQuickFilter: (filter: QuickFilterType) => void;
  clearQuickFilters: () => void;

  // View actions
  setSearchViewMode: (mode: SearchViewMode) => void;
  setSearchSortOption: (option: SearchSortOption) => void;

  // Recent searches
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Saved searches
  saveSearch: (currentUserId: string, name: string, filters: SearchFilters, notificationsEnabled?: boolean) => SavedSearch;
  updateSavedSearch: (searchId: string, updates: Partial<SavedSearch>) => void;
  deleteSavedSearch: (searchId: string) => void;
  getSavedSearches: (currentUserId: string) => SavedSearch[];

  // Admin
  reset: () => void;
}

const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      searchFilters: DEFAULT_SEARCH_FILTERS,
      savedSearches: [],
      recentSearches: [],
      searchHistory: [],
      searchViewMode: 'card' as SearchViewMode,
      searchSortOption: 'distance' as SearchSortOption,

      setSearchFilters: (filters) => {
        set({ searchFilters: filters });
      },

      updateSearchFilters: (updates) => {
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...updates },
        }));
      },

      resetSearchFilters: () => {
        set({ searchFilters: DEFAULT_SEARCH_FILTERS });
      },

      toggleQuickFilter: (filter) => {
        set((state) => {
          const current = state.searchFilters.quickFilters;
          const updated = current.includes(filter)
            ? current.filter((f) => f !== filter)
            : [...current, filter];
          return {
            searchFilters: { ...state.searchFilters, quickFilters: updated },
          };
        });
      },

      clearQuickFilters: () => {
        set((state) => ({
          searchFilters: { ...state.searchFilters, quickFilters: [] },
        }));
      },

      setSearchViewMode: (mode) => {
        set({ searchViewMode: mode });
      },

      setSearchSortOption: (option) => {
        set({ searchSortOption: option });
      },

      addRecentSearch: (query) => {
        if (!query.trim()) return;
        const state = get();
        const now = new Date().toISOString();

        // Remove duplicates and add to front
        const filteredRecent = state.recentSearches.filter(
          (q) => q.toLowerCase() !== query.toLowerCase()
        );
        const updatedRecent = [query, ...filteredRecent].slice(0, 10);

        // Add to history
        const historyEntry = { query, timestamp: now };
        const updatedHistory = [historyEntry, ...state.searchHistory].slice(0, 50);

        set({
          recentSearches: updatedRecent,
          searchHistory: updatedHistory,
        });
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      saveSearch: (currentUserId, name, filters, notificationsEnabled = false) => {
        const now = new Date().toISOString();

        const newSavedSearch: SavedSearch = {
          id: `saved-search-${Date.now()}`,
          user_id: currentUserId,
          name,
          filters,
          notificationsEnabled,
          created_at: now,
          last_used_at: now,
        };

        set((state) => ({ savedSearches: [...state.savedSearches, newSavedSearch] }));
        return newSavedSearch;
      },

      updateSavedSearch: (searchId, updates) => {
        set((state) => ({
          savedSearches: state.savedSearches.map((s) =>
            s.id === searchId ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSavedSearch: (searchId) => {
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== searchId),
        }));
      },

      getSavedSearches: (currentUserId) => {
        const state = get();
        return state.savedSearches.filter((s) => s.user_id === currentUserId);
      },

      reset: () =>
        set({
          searchFilters: DEFAULT_SEARCH_FILTERS,
          savedSearches: [],
          recentSearches: [],
          searchHistory: [],
          searchViewMode: 'card' as SearchViewMode,
          searchSortOption: 'distance' as SearchSortOption,
        }),
    }),
    {
      name: 'blend-search-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useSearchStore;
