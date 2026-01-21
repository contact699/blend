import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import {
  Users,
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle,
  Heart,
  Video,
  Phone,
  CreditCard,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { TrustSignalFilters as TrustSignalFiltersType } from '@/lib/types/trust-signals';
import { haptics } from '@/lib/haptics';

interface TrustSignalFiltersProps {
  filters: TrustSignalFiltersType;
  onChange: (filters: TrustSignalFiltersType) => void;
}

export default function TrustSignalFilters({ filters, onChange }: TrustSignalFiltersProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    haptics.tap();
    setExpanded(expanded === section ? null : section);
  };

  const updateFilter = (key: keyof TrustSignalFiltersType, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const FilterSection = ({
    id,
    title,
    icon,
    children,
  }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const isExpanded = expanded === id;

    return (
      <View className="mb-3">
        <Pressable
          onPress={() => toggleSection(id)}
          className="flex-row items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
          accessibilityRole="button"
          accessibilityLabel={`Toggle ${title} filters`}
        >
          <View className="flex-row items-center">
            {icon}
            <Text className="text-white font-semibold ml-3">{title}</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color="#9ca3af" />
          ) : (
            <ChevronDown size={20} color="#9ca3af" />
          )}
        </Pressable>

        {isExpanded && <View className="mt-2 px-4">{children}</View>}
      </View>
    );
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="px-5 py-4">
        <Text className="text-white text-lg font-bold mb-4">Trust Signal Filters</Text>

        {/* Community Vouches */}
        <FilterSection
          id="vouches"
          title="Community Vouches"
          icon={<Users size={20} color="#a855f7" />}
        >
          <View className="py-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400">Minimum Vouches</Text>
              <Text className="text-white font-bold">
                {filters.min_vouches || 0}
              </Text>
            </View>
            <Slider
              value={filters.min_vouches || 0}
              onValueChange={(value: number) => updateFilter('min_vouches', Math.round(value))}
              minimumValue={0}
              maximumValue={10}
              step={1}
              minimumTrackTintColor="#a855f7"
              maximumTrackTintColor="#3f3f46"
              thumbTintColor="#a855f7"
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-500 text-xs">0 (Any)</Text>
              <Text className="text-gray-500 text-xs">10+</Text>
            </View>
          </View>
        </FilterSection>

        {/* Account Age */}
        <FilterSection
          id="account_age"
          title="Account Age"
          icon={<Calendar size={20} color="#3b82f6" />}
        >
          <View className="py-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400">Minimum Age</Text>
              <Text className="text-white font-bold">
                {filters.min_account_age_days
                  ? filters.min_account_age_days >= 365
                    ? `${Math.floor(filters.min_account_age_days / 365)} year${
                        Math.floor(filters.min_account_age_days / 365) > 1 ? 's' : ''
                      }`
                    : filters.min_account_age_days >= 30
                      ? `${Math.floor(filters.min_account_age_days / 30)} month${
                          Math.floor(filters.min_account_age_days / 30) > 1 ? 's' : ''
                        }`
                      : `${filters.min_account_age_days} days`
                  : 'Any'}
              </Text>
            </View>
            <Slider
              value={filters.min_account_age_days || 0}
              onValueChange={(value: number) => updateFilter('min_account_age_days', Math.round(value))}
              minimumValue={0}
              maximumValue={365}
              step={7}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="#3f3f46"
              thumbTintColor="#3b82f6"
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-500 text-xs">Any</Text>
              <Text className="text-gray-500 text-xs">1 year</Text>
            </View>
          </View>
        </FilterSection>

        {/* Activity Status */}
        <FilterSection
          id="activity"
          title="Activity Status"
          icon={<Clock size={20} color="#10b981" />}
        >
          <View className="py-4 space-y-2">
            {[
              { value: 'day', label: 'Active within 1 day' },
              { value: 'week', label: 'Active within 1 week' },
              { value: 'month', label: 'Active within 1 month' },
            ].map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  haptics.tap();
                  updateFilter(
                    'must_be_active_within',
                    filters.must_be_active_within === option.value
                      ? undefined
                      : (option.value as 'day' | 'week' | 'month')
                  );
                }}
                className={`rounded-xl p-4 border ${
                  filters.must_be_active_within === option.value
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-zinc-800/60 border-zinc-700/50'
                }`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: filters.must_be_active_within === option.value }}
              >
                <Text
                  className={
                    filters.must_be_active_within === option.value
                      ? 'text-white font-medium'
                      : 'text-gray-400'
                  }
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </FilterSection>

        {/* Response Rate */}
        <FilterSection
          id="response_rate"
          title="Response Rate"
          icon={<MessageCircle size={20} color="#06b6d4" />}
        >
          <View className="py-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400">Minimum Response Rate</Text>
              <Text className="text-white font-bold">
                {filters.min_response_rate ? `${filters.min_response_rate}%` : 'Any'}
              </Text>
            </View>
            <Slider
              value={filters.min_response_rate || 0}
              onValueChange={(value) => updateFilter('min_response_rate', Math.round(value))}
              minimumValue={0}
              maximumValue={100}
              step={10}
              minimumTrackTintColor="#06b6d4"
              maximumTrackTintColor="#3f3f46"
              thumbTintColor="#06b6d4"
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-500 text-xs">Any</Text>
              <Text className="text-gray-500 text-xs">100%</Text>
            </View>
          </View>
        </FilterSection>

        {/* Profile Completeness */}
        <FilterSection
          id="completeness"
          title="Profile Completeness"
          icon={<CheckCircle size={20} color="#f59e0b" />}
        >
          <View className="py-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400">Minimum Completeness</Text>
              <Text className="text-white font-bold">
                {filters.min_profile_completeness ? `${filters.min_profile_completeness}%` : 'Any'}
              </Text>
            </View>
            <Slider
              value={filters.min_profile_completeness || 0}
              onValueChange={(value) =>
                updateFilter('min_profile_completeness', Math.round(value))
              }
              minimumValue={0}
              maximumValue={100}
              step={10}
              minimumTrackTintColor="#f59e0b"
              maximumTrackTintColor="#3f3f46"
              thumbTintColor="#f59e0b"
            />
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-500 text-xs">Any</Text>
              <Text className="text-gray-500 text-xs">100%</Text>
            </View>
          </View>
        </FilterSection>

        {/* Verification Toggles */}
        <FilterSection
          id="verifications"
          title="Verifications"
          icon={<Sparkles size={20} color="#8b5cf6" />}
        >
          <View className="py-4 space-y-2">
            <ToggleFilter
              label="Video Profile Required"
              icon={<Video size={18} color="#8b5cf6" />}
              value={filters.must_have_video || false}
              onChange={(value) => updateFilter('must_have_video', value)}
            />
            <ToggleFilter
              label="Photo Verified"
              icon={<CheckCircle size={18} color="#3b82f6" />}
              value={filters.must_be_photo_verified || false}
              onChange={(value) => updateFilter('must_be_photo_verified', value)}
            />
            <ToggleFilter
              label="Phone Verified"
              icon={<Phone size={18} color="#06b6d4" />}
              value={filters.must_be_phone_verified || false}
              onChange={(value) => updateFilter('must_be_phone_verified', value)}
            />
            <ToggleFilter
              label="ID Verified"
              icon={<CreditCard size={18} color="#a855f7" />}
              value={filters.must_be_id_verified || false}
              onChange={(value) => updateFilter('must_be_id_verified', value)}
            />
            <ToggleFilter
              label="AI Verified"
              icon={<Sparkles size={18} color="#10b981" />}
              value={filters.must_be_ai_verified || false}
              onChange={(value) => updateFilter('must_be_ai_verified', value)}
            />
          </View>
        </FilterSection>

        {/* Other Filters */}
        <FilterSection
          id="other"
          title="Other Criteria"
          icon={<Heart size={20} color="#ec4899" />}
        >
          <View className="py-4">
            {/* Minimum Events */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-400">Minimum Events Attended</Text>
                <Text className="text-white font-bold">
                  {filters.min_event_attendance || 0}
                </Text>
              </View>
              <Slider
                value={filters.min_event_attendance || 0}
                onValueChange={(value) => updateFilter('min_event_attendance', Math.round(value))}
                minimumValue={0}
                maximumValue={10}
                step={1}
                minimumTrackTintColor="#ec4899"
                maximumTrackTintColor="#3f3f46"
                thumbTintColor="#ec4899"
              />
              <View className="flex-row justify-between mt-1">
                <Text className="text-gray-500 text-xs">Any</Text>
                <Text className="text-gray-500 text-xs">10+</Text>
              </View>
            </View>

            {/* Minimum Partners */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-400">Minimum Partner Links</Text>
                <Text className="text-white font-bold">
                  {filters.min_partner_links || 0}
                </Text>
              </View>
              <Slider
                value={filters.min_partner_links || 0}
                onValueChange={(value) => updateFilter('min_partner_links', Math.round(value))}
                minimumValue={0}
                maximumValue={5}
                step={1}
                minimumTrackTintColor="#ec4899"
                maximumTrackTintColor="#3f3f46"
                thumbTintColor="#ec4899"
              />
              <View className="flex-row justify-between mt-1">
                <Text className="text-gray-500 text-xs">Any</Text>
                <Text className="text-gray-500 text-xs">5+</Text>
              </View>
            </View>
          </View>
        </FilterSection>

        {/* Reset Button */}
        <Pressable
          onPress={() => {
            haptics.tap();
            onChange({});
          }}
          className="bg-zinc-800 py-4 rounded-xl items-center mt-4"
          accessibilityRole="button"
          accessibilityLabel="Reset all filters"
        >
          <Text className="text-gray-300 font-medium">Reset All Filters</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// Toggle Filter Component
function ToggleFilter({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onChange(!value);
      }}
      className={`rounded-xl p-4 border ${
        value ? 'bg-purple-500/20 border-purple-500' : 'bg-zinc-800/60 border-zinc-700/50'
      }`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {icon}
          <Text className={`ml-3 ${value ? 'text-white font-medium' : 'text-gray-400'}`}>
            {label}
          </Text>
        </View>
        <View
          className={`w-6 h-6 rounded border-2 items-center justify-center ${
            value ? 'bg-purple-500 border-purple-500' : 'border-zinc-600'
          }`}
        >
          {value && <CheckCircle size={16} color="white" />}
        </View>
      </View>
    </Pressable>
  );
}
