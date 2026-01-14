import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import useDatingStore from '@/lib/state/dating-store';
import { useDiscoverProfiles } from '@/lib/supabase';
import {
  SearchFilters,
  AnySearchResult,
  ProfileSearchResult,
  SearchResultsGroup,
  BrowseCategory,
  QuickFilterType,
  SearchViewMode,
  SearchSortOption,
  DEFAULT_SEARCH_FILTERS,
  Profile,
} from '@/lib/types';

// Import search components
import SearchBar from '@/components/search/SearchBar';
import QuickFilters from '@/components/search/QuickFilters';
import SearchResults from '@/components/search/SearchResults';
import BrowseCategories from '@/components/search/BrowseCategories';
import AdvancedFiltersModal from '@/components/search/AdvancedFiltersModal';
import SavedSearchesModal from '@/components/search/SavedSearchesModal';

export default function SearchScreen() {
  const router = useRouter();

  // Fetch profiles from Supabase
  const { data: profiles = [], isLoading } = useDiscoverProfiles();

  // Store state
  const searchFilters = useDatingStore((s) => s.searchFilters);
  const setSearchFilters = useDatingStore((s) => s.setSearchFilters);
  const toggleQuickFilter = useDatingStore((s) => s.toggleQuickFilter);
  const clearQuickFilters = useDatingStore((s) => s.clearQuickFilters);
  const searchViewMode = useDatingStore((s) => s.searchViewMode);
  const setSearchViewMode = useDatingStore((s) => s.setSearchViewMode);
  const searchSortOption = useDatingStore((s) => s.searchSortOption);
  const setSearchSortOption = useDatingStore((s) => s.setSearchSortOption);
  const addRecentSearch = useDatingStore((s) => s.addRecentSearch);
  const getTrustScore = useDatingStore((s) => s.getTrustScore);
  const recentSearches = useDatingStore((s) => s.recentSearches);
  const savedSearches = useDatingStore((s) => s.savedSearches);
  const saveSearch = useDatingStore((s) => s.saveSearch);
  const deleteSavedSearch = useDatingStore((s) => s.deleteSavedSearch);
  const updateSavedSearch = useDatingStore((s) => s.updateSavedSearch);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showSavedSearchesModal, setShowSavedSearchesModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Transform Supabase profiles to search results
  const searchResults = useMemo((): AnySearchResult[] => {
    if (!searchQuery && searchFilters.quickFilters.length === 0 && !hasSearched) {
      return [];
    }

    // Filter profiles based on search query and filters
    let filtered = profiles.filter((profile: Profile) => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = profile.display_name.toLowerCase().includes(query);
        const matchesCity = profile.city.toLowerCase().includes(query);
        const matchesBio = profile.bio?.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesBio) return false;
      }

      // Quick filters
      if (searchFilters.quickFilters.includes('online_now')) {
        // Mock: randomly consider some profiles as online
        if (Math.random() > 0.3) return false;
      }

      if (searchFilters.quickFilters.includes('verified')) {
        const trustScore = getTrustScore(profile.user_id);
        if (!trustScore || trustScore.overall_score < 50) return false;
      }

      // Note: 'virtual_friendly' is not a valid QuickFilterType, using profile.virtual_only check separately
      if (profile.virtual_only === false && searchFilters.location.includeVirtual === false) {
        // Only filter if explicitly excluding virtual
      }

      // Age filter
      if (searchFilters.basics.ageRange[0] > 18 || searchFilters.basics.ageRange[1] < 65) {
        if (profile.age < searchFilters.basics.ageRange[0] || profile.age > searchFilters.basics.ageRange[1]) {
          return false;
        }
      }

      return true;
    });

    // Sort results
    if (searchSortOption === 'newest') {
      // Mock: reverse order as "newest"
      filtered = [...filtered].reverse();
    } else if (searchSortOption === 'trust_score') {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = getTrustScore(a.user_id)?.overall_score ?? 0;
        const scoreB = getTrustScore(b.user_id)?.overall_score ?? 0;
        return scoreB - scoreA;
      });
    }

    // Convert to search results
    return filtered.map((profile): ProfileSearchResult => {
      const trustScore = getTrustScore(profile.user_id);
      return {
        type: 'profile',
        id: profile.user_id,
        score: Math.random() * 100,
        matchReasons: getMatchReasons(profile),
        profile,
        distance: Math.random() * 50,
        trustTier: trustScore?.tier,
        trustScore: trustScore?.overall_score,
        mutualConnections: Math.floor(Math.random() * 5),
        isOnline: Math.random() > 0.7,
        lastActive: new Date().toISOString(),
      };
    });
  }, [searchQuery, searchFilters, searchSortOption, hasSearched, getTrustScore]);

  // Group results by type
  const groupedResults = useMemo((): SearchResultsGroup[] => {
    const profileResults = searchResults.filter((r): r is ProfileSearchResult => r.type === 'profile');

    if (profileResults.length === 0) return [];

    return [
      {
        type: 'profile',
        label: 'People',
        results: profileResults,
        totalCount: profileResults.length,
      },
    ];
  }, [searchResults]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      // Debounce search
      setTimeout(() => {
        setIsSearching(false);
        setHasSearched(true);
      }, 300);
    }
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      setHasSearched(true);
    }
  }, [searchQuery, addRecentSearch]);

  const handleQuickFilterToggle = useCallback((filter: QuickFilterType) => {
    toggleQuickFilter(filter);
    setHasSearched(true);
  }, [toggleQuickFilter]);

  const handleClearQuickFilters = useCallback(() => {
    clearQuickFilters();
  }, [clearQuickFilters]);

  const handleApplyFilters = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
    setHasSearched(true);
  }, [setSearchFilters]);

  const handleResultPress = useCallback((result: AnySearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (result.type === 'profile') {
      router.push(`/profile/${result.profile.user_id}`);
    }
  }, [router]);

  const handleCategoryPress = useCallback((category: BrowseCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Apply category filters
    setSearchFilters({
      ...DEFAULT_SEARCH_FILTERS,
      ...category.filters,
    });
    setHasSearched(true);
  }, [setSearchFilters]);

  // Saved searches handlers
  const handleSelectSavedSearch = useCallback((search: { filters: SearchFilters; name: string }) => {
    setSearchFilters(search.filters);
    if (search.filters.query) {
      setSearchQuery(search.filters.query);
    }
    setHasSearched(true);
  }, [setSearchFilters]);

  const handleSelectRecentSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
  }, []);

  const handleSaveCurrentSearch = useCallback((name: string) => {
    saveSearch(name, { ...searchFilters, query: searchQuery });
  }, [saveSearch, searchFilters, searchQuery]);

  const handleToggleSavedSearchNotifications = useCallback((searchId: string, enabled: boolean) => {
    updateSavedSearch(searchId, { notificationsEnabled: enabled });
  }, [updateSavedSearch]);

  const showBrowseView = !hasSearched && searchQuery.length === 0;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#18181b', '#09090b', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(300)}
            className="px-4 pt-2 pb-4"
          >
            <Text className="text-white text-2xl font-bold mb-4">Search</Text>

            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearchChange}
              onOpenFilters={() => setShowFiltersModal(true)}
              onOpenSavedSearches={() => setShowSavedSearchesModal(true)}
              placeholder="Search people, events, articles..."
              isSearching={isSearching}
              resultCount={hasSearched ? searchResults.length : undefined}
              groupedResults={groupedResults}
              onSelectResult={handleResultPress}
              showResultsPreview={searchQuery.length > 0}
            />
          </Animated.View>

          {/* Quick Filters */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-4">
            <QuickFilters
              activeFilters={searchFilters.quickFilters}
              onToggleFilter={handleQuickFilterToggle}
              onClearAll={handleClearQuickFilters}
            />
          </Animated.View>

          {/* Content */}
          {showBrowseView ? (
            // Browse Categories View
            <Animated.ScrollView
              entering={FadeInDown.delay(200).duration(300)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <BrowseCategories
                onCategoryPress={handleCategoryPress}
                featuredProfiles={profiles.slice(0, 5).map((p: Profile) => ({
                  id: p.user_id,
                  photo: p.photos?.[0] ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
                  name: p.display_name,
                }))}
              />
            </Animated.ScrollView>
          ) : (
            // Search Results View
            <SearchResults
              results={searchResults}
              groupedResults={groupedResults}
              viewMode={searchViewMode}
              sortOption={searchSortOption}
              isLoading={isSearching}
              onResultPress={handleResultPress}
              onViewModeChange={setSearchViewMode}
              onSortChange={setSearchSortOption}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={searchFilters}
        onApply={handleApplyFilters}
        resultCount={searchResults.length}
      />

      {/* Saved Searches Modal */}
      <SavedSearchesModal
        visible={showSavedSearchesModal}
        onClose={() => setShowSavedSearchesModal(false)}
        savedSearches={savedSearches}
        recentSearches={recentSearches}
        onSelectSavedSearch={handleSelectSavedSearch}
        onSelectRecentSearch={handleSelectRecentSearch}
        onDeleteSavedSearch={deleteSavedSearch}
        onToggleNotifications={handleToggleSavedSearchNotifications}
        onSaveCurrentSearch={handleSaveCurrentSearch}
        currentFilters={hasSearched ? searchFilters : undefined}
      />
    </View>
  );
}

// Helper function to generate match reasons
function getMatchReasons(profile: Profile): string[] {
  const reasons: string[] = [];

  if (profile.open_to_meet) {
    reasons.push('Open to meet');
  }

  if (profile.virtual_only) {
    reasons.push('Virtual friendly');
  }

  if (profile.pace_preference === 'slow') {
    reasons.push('Takes it slow');
  }

  if (profile.response_style === 'quick') {
    reasons.push('Quick responder');
  }

  // Randomly add some reasons for demo
  const possibleReasons = [
    'Shared interests',
    'Similar values',
    'Compatible pace',
    'Mutual connections',
  ];

  for (const reason of possibleReasons) {
    if (Math.random() > 0.7) {
      reasons.push(reason);
    }
  }

  return reasons.slice(0, 3);
}
