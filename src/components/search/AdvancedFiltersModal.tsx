import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  Heart,
  Shield,
  Sparkles,
  Clock,
  Users,
  Ban,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import {
  SearchFilters,
  DEFAULT_SEARCH_FILTERS,
  GENDER_OPTIONS,
  SEEKING_OPTIONS,
  CONNECTION_OPTIONS,
  SITUATION_OPTIONS,
  VALUE_OPTIONS,
  INTEREST_TAGS,
  GenderIdentity,
  SeekingType,
  ConnectionType,
  CurrentSituation,
  RelationshipStructure,
  TrustTier,
} from '@/lib/types';
import { RELATIONSHIP_STRUCTURES } from '@/lib/mock-data';

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  resultCount?: number;
}

type SectionId = 'location' | 'basics' | 'relationship' | 'trust' | 'compatibility' | 'activity' | 'dealbreakers';

export default function AdvancedFiltersModal({
  visible,
  onClose,
  filters,
  onApply,
  resultCount,
}: AdvancedFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['location', 'relationship']));

  // Reset to filters prop when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const toggleSection = (section: SectionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalFilters(DEFAULT_SEARCH_FILTERS);
  };

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApply(localFilters);
    onClose();
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.location.city) count++;
    if (localFilters.location.radiusMiles !== 50) count++;
    if (localFilters.basics.genderIdentities.length > 0) count++;
    if (localFilters.basics.ageRange[0] !== 18 || localFilters.basics.ageRange[1] !== 65) count++;
    if (localFilters.relationship.seekingTypes.length > 0) count++;
    if (localFilters.relationship.relationshipStyles.length > 0) count++;
    if (localFilters.relationship.connectionTypes.length > 0) count++;
    if (localFilters.trust.minTrustScore) count++;
    if (localFilters.trust.requirePhotoVerification) count++;
    if (localFilters.compatibility.values.length > 0) count++;
    if (localFilters.compatibility.interests.length > 0) count++;
    if (localFilters.activity.activeWithinDays) count++;
    if (localFilters.dealbreakers.excludeNoPhotos) count++;
    if (localFilters.dealbreakers.excludeLowTrustScores) count++;
    return count;
  }, [localFilters]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#18181b', '#09090b', '#000000']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800"
          >
            <Pressable onPress={onClose} className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center">
              <X size={22} color="white" />
            </Pressable>
            <View className="items-center">
              <Text className="text-white text-lg font-semibold">Filters</Text>
              {activeFilterCount > 0 && (
                <Text className="text-purple-400 text-xs">{activeFilterCount} active</Text>
              )}
            </View>
            <Pressable onPress={handleReset} className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center">
              <RotateCcw size={18} color="#71717a" />
            </Pressable>
          </Animated.View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          >
            {/* Location Section */}
            <FilterSection
              id="location"
              title="Location"
              icon={<MapPin size={18} color="#a855f7" />}
              isExpanded={expandedSections.has('location')}
              onToggle={() => toggleSection('location')}
            >
              <View className="space-y-4">
                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Distance</Text>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold">
                      {localFilters.location.radiusMiles >= 100 ? '100+' : localFilters.location.radiusMiles} miles
                    </Text>
                  </View>
                  <Slider
                    value={localFilters.location.radiusMiles}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        location: { ...localFilters.location, radiusMiles: Math.round(value) },
                      })
                    }
                    minimumValue={5}
                    maximumValue={100}
                    step={5}
                    minimumTrackTintColor="#a855f7"
                    maximumTrackTintColor="#3f3f46"
                    thumbTintColor="#a855f7"
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Include virtual connections</Text>
                  <Switch
                    value={localFilters.location.includeVirtual}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        location: { ...localFilters.location, includeVirtual: value },
                      })
                    }
                    trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  />
                </View>
              </View>
            </FilterSection>

            {/* Basics Section */}
            <FilterSection
              id="basics"
              title="Basics"
              icon={<User size={18} color="#3b82f6" />}
              isExpanded={expandedSections.has('basics')}
              onToggle={() => toggleSection('basics')}
            >
              <View className="space-y-4">
                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Age Range</Text>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold">
                      {localFilters.basics.ageRange[0]} - {localFilters.basics.ageRange[1]}
                    </Text>
                  </View>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-zinc-500 text-xs mb-1">Min</Text>
                      <Slider
                        value={localFilters.basics.ageRange[0]}
                        onValueChange={(value) =>
                          setLocalFilters({
                            ...localFilters,
                            basics: {
                              ...localFilters.basics,
                              ageRange: [Math.round(value), Math.max(Math.round(value), localFilters.basics.ageRange[1])],
                            },
                          })
                        }
                        minimumValue={18}
                        maximumValue={65}
                        step={1}
                        minimumTrackTintColor="#a855f7"
                        maximumTrackTintColor="#3f3f46"
                        thumbTintColor="#a855f7"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-zinc-500 text-xs mb-1">Max</Text>
                      <Slider
                        value={localFilters.basics.ageRange[1]}
                        onValueChange={(value) =>
                          setLocalFilters({
                            ...localFilters,
                            basics: {
                              ...localFilters.basics,
                              ageRange: [Math.min(localFilters.basics.ageRange[0], Math.round(value)), Math.round(value)],
                            },
                          })
                        }
                        minimumValue={18}
                        maximumValue={65}
                        step={1}
                        minimumTrackTintColor="#a855f7"
                        maximumTrackTintColor="#3f3f46"
                        thumbTintColor="#a855f7"
                      />
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Gender Identity</Text>
                  <MultiSelectChips
                    options={GENDER_OPTIONS}
                    selected={localFilters.basics.genderIdentities}
                    onToggle={(id) => {
                      const current = localFilters.basics.genderIdentities;
                      const updated = current.includes(id as GenderIdentity)
                        ? current.filter((g) => g !== id)
                        : [...current, id as GenderIdentity];
                      setLocalFilters({
                        ...localFilters,
                        basics: { ...localFilters.basics, genderIdentities: updated },
                      });
                    }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Pronouns required on profile</Text>
                  <Switch
                    value={localFilters.basics.pronounsRequired}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        basics: { ...localFilters.basics, pronounsRequired: value },
                      })
                    }
                    trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  />
                </View>
              </View>
            </FilterSection>

            {/* Relationship Structure Section */}
            <FilterSection
              id="relationship"
              title="Relationship Structure"
              icon={<Heart size={18} color="#ec4899" />}
              isExpanded={expandedSections.has('relationship')}
              onToggle={() => toggleSection('relationship')}
            >
              <View className="space-y-4">
                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Looking For</Text>
                  <MultiSelectChips
                    options={SEEKING_OPTIONS}
                    selected={localFilters.relationship.seekingTypes}
                    onToggle={(id) => {
                      const current = localFilters.relationship.seekingTypes;
                      const updated = current.includes(id as SeekingType)
                        ? current.filter((s) => s !== id)
                        : [...current, id as SeekingType];
                      setLocalFilters({
                        ...localFilters,
                        relationship: { ...localFilters.relationship, seekingTypes: updated },
                      });
                    }}
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Relationship Style</Text>
                  <MultiSelectChips
                    options={RELATIONSHIP_STRUCTURES.map((s) => ({ id: s.id, label: `${s.emoji} ${s.label}` }))}
                    selected={localFilters.relationship.relationshipStyles}
                    onToggle={(id) => {
                      const current = localFilters.relationship.relationshipStyles;
                      const updated = current.includes(id as RelationshipStructure)
                        ? current.filter((s) => s !== id)
                        : [...current, id as RelationshipStructure];
                      setLocalFilters({
                        ...localFilters,
                        relationship: { ...localFilters.relationship, relationshipStyles: updated },
                      });
                    }}
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Connection Type</Text>
                  <MultiSelectChips
                    options={CONNECTION_OPTIONS}
                    selected={localFilters.relationship.connectionTypes}
                    onToggle={(id) => {
                      const current = localFilters.relationship.connectionTypes;
                      const updated = current.includes(id as ConnectionType)
                        ? current.filter((c) => c !== id)
                        : [...current, id as ConnectionType];
                      setLocalFilters({
                        ...localFilters,
                        relationship: { ...localFilters.relationship, connectionTypes: updated },
                      });
                    }}
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Current Situation</Text>
                  <MultiSelectChips
                    options={SITUATION_OPTIONS}
                    selected={localFilters.relationship.currentSituations}
                    onToggle={(id) => {
                      const current = localFilters.relationship.currentSituations;
                      const updated = current.includes(id as CurrentSituation)
                        ? current.filter((s) => s !== id)
                        : [...current, id as CurrentSituation];
                      setLocalFilters({
                        ...localFilters,
                        relationship: { ...localFilters.relationship, currentSituations: updated },
                      });
                    }}
                  />
                </View>
              </View>
            </FilterSection>

            {/* Trust & Verification Section */}
            <FilterSection
              id="trust"
              title="Trust & Verification"
              icon={<Shield size={18} color="#22c55e" />}
              isExpanded={expandedSections.has('trust')}
              onToggle={() => toggleSection('trust')}
            >
              <View className="space-y-4">
                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Minimum Trust Score</Text>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold">
                      {localFilters.trust.minTrustScore ?? 'Any'}
                    </Text>
                  </View>
                  <Slider
                    value={localFilters.trust.minTrustScore ?? 0}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        trust: { ...localFilters.trust, minTrustScore: value > 0 ? Math.round(value) : undefined },
                      })
                    }
                    minimumValue={0}
                    maximumValue={90}
                    step={5}
                    minimumTrackTintColor="#22c55e"
                    maximumTrackTintColor="#3f3f46"
                    thumbTintColor="#22c55e"
                  />
                </View>

                <View className="space-y-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white">Photo verification required</Text>
                    <Switch
                      value={localFilters.trust.requirePhotoVerification}
                      onValueChange={(value) =>
                        setLocalFilters({
                          ...localFilters,
                          trust: { ...localFilters.trust, requirePhotoVerification: value },
                        })
                      }
                      trackColor={{ false: '#3f3f46', true: '#22c55e' }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white">Must have reviews</Text>
                    <Switch
                      value={localFilters.trust.mustHaveReviews}
                      onValueChange={(value) =>
                        setLocalFilters({
                          ...localFilters,
                          trust: { ...localFilters.trust, mustHaveReviews: value },
                        })
                      }
                      trackColor={{ false: '#3f3f46', true: '#22c55e' }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-white">Event hosts only</Text>
                    <Switch
                      value={localFilters.trust.isEventHost}
                      onValueChange={(value) =>
                        setLocalFilters({
                          ...localFilters,
                          trust: { ...localFilters.trust, isEventHost: value },
                        })
                      }
                      trackColor={{ false: '#3f3f46', true: '#22c55e' }}
                    />
                  </View>
                </View>
              </View>
            </FilterSection>

            {/* Compatibility Section */}
            <FilterSection
              id="compatibility"
              title="Compatibility"
              icon={<Sparkles size={18} color="#f59e0b" />}
              isExpanded={expandedSections.has('compatibility')}
              onToggle={() => toggleSection('compatibility')}
            >
              <View className="space-y-4">
                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Values</Text>
                  <MultiSelectChips
                    options={VALUE_OPTIONS.map((v) => ({ id: v, label: v }))}
                    selected={localFilters.compatibility.values}
                    onToggle={(id) => {
                      const current = localFilters.compatibility.values;
                      const updated = current.includes(id)
                        ? current.filter((v) => v !== id)
                        : [...current, id];
                      setLocalFilters({
                        ...localFilters,
                        compatibility: { ...localFilters.compatibility, values: updated },
                      });
                    }}
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Interests</Text>
                  <MultiSelectChips
                    options={INTEREST_TAGS.map((t) => ({ id: t, label: t }))}
                    selected={localFilters.compatibility.interests}
                    onToggle={(id) => {
                      const current = localFilters.compatibility.interests;
                      const updated = current.includes(id)
                        ? current.filter((i) => i !== id)
                        : [...current, id];
                      setLocalFilters({
                        ...localFilters,
                        compatibility: { ...localFilters.compatibility, interests: updated },
                      });
                    }}
                  />
                </View>
              </View>
            </FilterSection>

            {/* Activity Section */}
            <FilterSection
              id="activity"
              title="Activity"
              icon={<Clock size={18} color="#3b82f6" />}
              isExpanded={expandedSections.has('activity')}
              onToggle={() => toggleSection('activity')}
            >
              <View className="space-y-4">
                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Active Within</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { value: undefined, label: 'Any' },
                      { value: 1, label: '24 hours' },
                      { value: 7, label: 'Week' },
                      { value: 30, label: 'Month' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.label}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLocalFilters({
                            ...localFilters,
                            activity: { ...localFilters.activity, activeWithinDays: opt.value },
                          });
                        }}
                        className={`px-4 py-2 rounded-full border ${
                          localFilters.activity.activeWithinDays === opt.value
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-zinc-800 border-zinc-700'
                        }`}
                      >
                        <Text
                          className={
                            localFilters.activity.activeWithinDays === opt.value
                              ? 'text-blue-400'
                              : 'text-zinc-400'
                          }
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-zinc-400 text-sm mb-2">Minimum Response Rate</Text>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold">
                      {localFilters.activity.minResponseRate
                        ? `${Math.round(localFilters.activity.minResponseRate * 100)}%`
                        : 'Any'}
                    </Text>
                  </View>
                  <Slider
                    value={(localFilters.activity.minResponseRate ?? 0) * 100}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        activity: {
                          ...localFilters.activity,
                          minResponseRate: value > 0 ? value / 100 : undefined,
                        },
                      })
                    }
                    minimumValue={0}
                    maximumValue={100}
                    step={10}
                    minimumTrackTintColor="#3b82f6"
                    maximumTrackTintColor="#3f3f46"
                    thumbTintColor="#3b82f6"
                  />
                </View>
              </View>
            </FilterSection>

            {/* Dealbreakers Section */}
            <FilterSection
              id="dealbreakers"
              title="Dealbreakers"
              icon={<Ban size={18} color="#ef4444" />}
              isExpanded={expandedSections.has('dealbreakers')}
              onToggle={() => toggleSection('dealbreakers')}
            >
              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Exclude profiles without photos</Text>
                  <Switch
                    value={localFilters.dealbreakers.excludeNoPhotos}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        dealbreakers: { ...localFilters.dealbreakers, excludeNoPhotos: value },
                      })
                    }
                    trackColor={{ false: '#3f3f46', true: '#ef4444' }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Exclude incomplete profiles</Text>
                  <Switch
                    value={localFilters.dealbreakers.excludeIncompleteProfiles}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        dealbreakers: { ...localFilters.dealbreakers, excludeIncompleteProfiles: value },
                      })
                    }
                    trackColor={{ false: '#3f3f46', true: '#ef4444' }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Exclude low trust scores</Text>
                  <Switch
                    value={localFilters.dealbreakers.excludeLowTrustScores}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        dealbreakers: { ...localFilters.dealbreakers, excludeLowTrustScores: value },
                      })
                    }
                    trackColor={{ false: '#3f3f46', true: '#ef4444' }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Exclude already passed</Text>
                  <Switch
                    value={localFilters.dealbreakers.excludeAlreadyPassed}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        dealbreakers: { ...localFilters.dealbreakers, excludeAlreadyPassed: value },
                      })
                    }
                    trackColor={{ false: '#3f3f46', true: '#ef4444' }}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Exclude already matched</Text>
                  <Switch
                    value={localFilters.dealbreakers.excludeAlreadyMatched}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        dealbreakers: { ...localFilters.dealbreakers, excludeAlreadyMatched: value },
                      })
                    }
                    trackColor={{ false: '#3f3f46', true: '#ef4444' }}
                  />
                </View>
              </View>
            </FilterSection>
          </ScrollView>

          {/* Apply Button */}
          <View className="absolute bottom-0 left-0 right-0 p-4 pb-8">
            <BlurView intensity={80} tint="dark" className="rounded-2xl overflow-hidden">
              <Pressable onPress={handleApply}>
                <LinearGradient
                  colors={['#a855f7', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Check size={20} color="white" />
                  <Text className="text-white font-semibold text-lg">
                    Apply Filters {resultCount !== undefined ? `(${resultCount})` : ''}
                  </Text>
                </LinearGradient>
              </Pressable>
            </BlurView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

interface FilterSectionProps {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, icon, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <View className="mb-4">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between p-4 bg-zinc-900/80 rounded-t-2xl border border-zinc-800"
        style={{ borderBottomWidth: isExpanded ? 0 : 1, borderBottomLeftRadius: isExpanded ? 0 : 16, borderBottomRightRadius: isExpanded ? 0 : 16 }}
      >
        <View className="flex-row items-center gap-3">
          {icon}
          <Text className="text-white font-semibold">{title}</Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color="#71717a" />
        ) : (
          <ChevronDown size={20} color="#71717a" />
        )}
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="p-4 bg-zinc-900/60 rounded-b-2xl border border-t-0 border-zinc-800"
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}

interface MultiSelectChipsProps {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function MultiSelectChips({ options, selected, onToggle }: MultiSelectChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <Pressable
            key={option.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(option.id);
            }}
            className={`px-3 py-2 rounded-full border ${
              isSelected
                ? 'bg-purple-500/20 border-purple-500'
                : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            <Text
              className={`text-sm ${
                isSelected ? 'text-purple-400' : 'text-zinc-400'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
