import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Heart,
  Calendar,
  FileText,
  Shield,
  Users,
  BookOpen,
  Sparkles,
  Check,
  ChevronRight,
  Plus,
  Link,
  UserPlus,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import PolyculeMap from '@/components/PolyculeMap';
import DateCalendar from '@/components/DateCalendar';
import AgreementBuilder from '@/components/AgreementBuilder';
import MeetThePartners from '@/components/MeetThePartners';
import { supabase, useCurrentProfile, useCurrentUser } from '@/lib/supabase';
import { ScheduledDate, RelationshipAgreement, Polycule, PolyculeConnection, PartnerProfile } from '@/lib/types';

type FeatureSection = 'map' | 'calendar' | 'agreement' | 'partners' | null;

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  onPress,
  badge,
}: {
  icon: typeof Heart;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-zinc-800/50 rounded-2xl p-4 mb-3 border border-zinc-700/50 active:bg-zinc-800"
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon size={24} color={color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white font-semibold text-base">{title}</Text>
            {badge && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/20">
                <Text className="text-purple-400 text-xs font-medium">{badge}</Text>
              </View>
            )}
          </View>
          <Text className="text-zinc-400 text-sm mt-0.5">{description}</Text>
        </View>
        <ChevronRight size={20} color="#6b7280" />
      </View>
    </Pressable>
  );
}

export default function MyRelationships() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: profile } = useCurrentProfile();
  const [expandedSection, setExpandedSection] = useState<FeatureSection>(null);
  const [showAgreementBuilder, setShowAgreementBuilder] = useState(false);
  const [dates, setDates] = useState<ScheduledDate[]>([]); // Will be fetched from Supabase
  const [agreement, setAgreement] = useState<RelationshipAgreement | null>(null);

  // Fetch linked partners from database
  const { data: linkedPartners } = useQuery({
    queryKey: ['linked-partners', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('linked_partners')
        .select('*')
        .eq('profile_id', profile.id);

      if (error) {
        console.error('[Relationships] Error fetching linked partners:', error);
        return [];
      }

      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  // Build polycule from linked partners
  const polycule: Polycule = {
    id: 'user-polycule',
    user_id: currentUser?.id ?? 'me',
    structure: 'non_hierarchical',
    visibility: 'matches_only',
    members: [
      // Current user (me)
      {
        id: 'me',
        name: 'Me',
        photo: undefined,
        relationship_type: 'anchor',
        connection_strength: 'primary',
        connected_to: linkedPartners?.map((p) => p.id) ?? [],
        is_on_blend: true,
        link_status: 'confirmed',
      },
      // Linked partners
      ...(linkedPartners ?? []).map((partner): PolyculeConnection => ({
        id: partner.id,
        name: partner.name,
        photo: partner.photo_storage_path ?? undefined,
        relationship_type: 'partner',
        connection_strength: 'primary',
        connected_to: ['me'],
        is_on_blend: false,
        link_status: 'confirmed',
      })),
    ],
    updated_at: new Date().toISOString(),
  };

  const handleAddDate = (
    newDate: Omit<ScheduledDate, 'id' | 'user_id' | 'created_at' | 'reminder_sent'>
  ) => {
    setDates((prev) => [
      ...prev,
      {
        ...newDate,
        id: `date-${Date.now()}`,
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        reminder_sent: false,
      },
    ]);
  };

  const handleDeleteDate = (dateId: string) => {
    setDates((prev) => prev.filter((d) => d.id !== dateId));
  };

  const handleSaveAgreement = (newAgreement: RelationshipAgreement) => {
    setAgreement(newAgreement);
    setShowAgreementBuilder(false);
  };

  // Build partner profiles from linked partners for MeetThePartners component
  const partnerProfiles: PartnerProfile[] = (linkedPartners ?? []).map((partner) => ({
    id: partner.id,
    name: partner.name,
    age: 0, // Will be populated when linked partner syncs with Blend profile
    photo: partner.photo_storage_path ?? undefined,
    relationship_type: 'Partner',
    relationship_duration: 'Recently linked',
    bio: '',
    involvement_level: 'aware_only' as const,
    can_message: false,
  }));

  // TODO: Fetch STI record from Supabase with useQuery
  // For now, show placeholder if no data
  const daysSinceTest = null; // Will be: stiRecord ? Math.floor((Date.now() - new Date(stiRecord.test_date).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
          >
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <Text className="text-white font-bold text-xl ml-4">My Relationships</Text>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Hero Section */}
          <View className="mb-6">
            <LinearGradient
              colors={['#7c3aed', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center mb-2">
                <Heart size={24} color="white" fill="white" />
                <Text className="text-white font-bold text-lg ml-2">Relationship Hub</Text>
              </View>
              <Text className="text-white/80 text-sm leading-relaxed">
                Manage your connections, agreements, and schedule all in one place. These tools help
                you practice ethical non-monogamy with clarity and care.
              </Text>
            </LinearGradient>
          </View>

          {/* Polycule Map Section */}
          {expandedSection === 'map' ? (
            <View className="mb-6">
              <Pressable
                onPress={() => setExpandedSection(null)}
                className="flex-row items-center mb-4"
              >
                <ChevronLeft size={20} color="#c084fc" />
                <Text className="text-purple-400 ml-1">Back to overview</Text>
              </Pressable>
              <PolyculeMap polycule={polycule} isEditable />
              {/* Link Partners Button */}
              <Pressable
                onPress={() => router.push('/link-partner')}
                className="mt-4 bg-purple-500/20 border border-purple-500/50 rounded-xl p-4 flex-row items-center justify-center"
              >
                <UserPlus size={20} color="#c084fc" />
                <Text className="text-purple-300 font-medium ml-2">Link a Partner</Text>
              </Pressable>
            </View>
          ) : (
            <FeatureCard
              icon={Heart}
              title="Polycule Map"
              description="Visualize your relationship network"
              color="#c084fc"
              onPress={() => setExpandedSection('map')}
              badge={`${polycule.members.length} connections`}
            />
          )}

          {/* Calendar Section */}
          {expandedSection === 'calendar' ? (
            <View className="mb-6">
              <Pressable
                onPress={() => setExpandedSection(null)}
                className="flex-row items-center mb-4"
              >
                <ChevronLeft size={20} color="#c084fc" />
                <Text className="text-purple-400 ml-1">Back to overview</Text>
              </Pressable>
              <DateCalendar
                dates={dates}
                onAddDate={handleAddDate}
                onDeleteDate={handleDeleteDate}
              />
            </View>
          ) : (
            <FeatureCard
              icon={Calendar}
              title="Date Calendar"
              description="Schedule dates with all your partners"
              color="#45B7D1"
              onPress={() => setExpandedSection('calendar')}
              badge={`${dates.length} upcoming`}
            />
          )}

          {/* Agreement Section */}
          {expandedSection === 'agreement' ? (
            <View className="mb-6">
              <Pressable
                onPress={() => setExpandedSection(null)}
                className="flex-row items-center mb-4"
              >
                <ChevronLeft size={20} color="#c084fc" />
                <Text className="text-purple-400 ml-1">Back to overview</Text>
              </Pressable>
              {agreement ? (
                <View className="bg-zinc-900/50 rounded-3xl p-4 border border-zinc-800">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center mr-3">
                        <FileText size={20} color="#22c55e" />
                      </View>
                      <View>
                        <Text className="text-white font-semibold">{agreement.title}</Text>
                        <Text className="text-zinc-400 text-sm">
                          {agreement.sections.length} sections
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setShowAgreementBuilder(true)}
                      className="px-3 py-1.5 bg-zinc-800 rounded-full"
                    >
                      <Text className="text-zinc-300 text-sm">Edit</Text>
                    </Pressable>
                  </View>
                  {agreement.sections.map((section) => (
                    <View
                      key={section.id}
                      className="py-3 border-t border-zinc-800 flex-row items-center"
                    >
                      <Check size={16} color="#22c55e" />
                      <Text className="text-zinc-300 ml-3">{section.title}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowAgreementBuilder(true)}
                  className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 items-center"
                >
                  <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center mb-4">
                    <Plus size={32} color="#c084fc" />
                  </View>
                  <Text className="text-white font-semibold text-lg mb-1">
                    Create an Agreement
                  </Text>
                  <Text className="text-zinc-500 text-sm text-center">
                    Set boundaries, rules, and expectations with your partners
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <FeatureCard
              icon={FileText}
              title="Relationship Agreement"
              description="Set boundaries and rules together"
              color="#22c55e"
              onPress={() => setExpandedSection('agreement')}
              badge={agreement ? `${agreement.sections.length} rules` : 'New'}
            />
          )}

          {/* Meet the Partners Section */}
          {expandedSection === 'partners' ? (
            <View className="mb-6">
              <Pressable
                onPress={() => setExpandedSection(null)}
                className="flex-row items-center mb-4"
              >
                <ChevronLeft size={20} color="#c084fc" />
                <Text className="text-purple-400 ml-1">Back to overview</Text>
              </Pressable>
              <MeetThePartners partners={partnerProfiles} isEditable />
            </View>
          ) : (
            <FeatureCard
              icon={Users}
              title="Meet My Partners"
              description="Introduce your relationship network"
              color="#ec4899"
              onPress={() => setExpandedSection('partners')}
              badge={partnerProfiles.length > 0 ? `${partnerProfiles.length} partners` : undefined}
            />
          )}

          {/* Quick Links */}
          <View className="mt-6">
            <Text className="text-zinc-500 text-xs font-medium mb-3">QUICK LINKS</Text>

            <Pressable
              onPress={() => router.push('/sti-safety')}
              className="flex-row items-center bg-zinc-800/30 rounded-xl p-4 mb-2"
            >
              <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                <Shield size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">STI Safety</Text>
                <Text className="text-zinc-500 text-sm">
                  {daysSinceTest !== null ? `Last tested ${daysSinceTest} days ago` : 'Track your testing'}
                </Text>
              </View>
              <ChevronRight size={18} color="#6b7280" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/consent-checklist')}
              className="flex-row items-center bg-zinc-800/30 rounded-xl p-4 mb-2"
            >
              <View className="w-10 h-10 rounded-xl bg-teal-500/20 items-center justify-center mr-3">
                <Check size={20} color="#14b8a6" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Consent Checklist</Text>
                <Text className="text-zinc-500 text-sm">Set your preferences</Text>
              </View>
              <ChevronRight size={18} color="#6b7280" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/quiz')}
              className="flex-row items-center bg-zinc-800/30 rounded-xl p-4 mb-2"
            >
              <View className="w-10 h-10 rounded-xl bg-amber-500/20 items-center justify-center mr-3">
                <Sparkles size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Compatibility Quiz</Text>
                <Text className="text-zinc-500 text-sm">Discover your ENM style</Text>
              </View>
              <ChevronRight size={18} color="#6b7280" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/education')}
              className="flex-row items-center bg-zinc-800/30 rounded-xl p-4"
            >
              <View className="w-10 h-10 rounded-xl bg-purple-500/20 items-center justify-center mr-3">
                <BookOpen size={20} color="#c084fc" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">Education Hub</Text>
                <Text className="text-zinc-500 text-sm">Learn about ENM</Text>
              </View>
              <ChevronRight size={18} color="#6b7280" />
            </Pressable>
          </View>
        </ScrollView>

        {/* Agreement Builder Modal */}
        <Modal visible={showAgreementBuilder} animationType="slide">
          <SafeAreaView className="flex-1 bg-zinc-900">
            <AgreementBuilder
              agreement={agreement}
              onSave={handleSaveAgreement}
              onCancel={() => setShowAgreementBuilder(false)}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
