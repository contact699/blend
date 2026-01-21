import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Shield,
  Calendar,
  Check,
  Plus,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  X,
} from 'lucide-react-native';
import { STITestRecord } from '@/lib/types';
import { useMostRecentSTITest, useAddSTIRecord } from '@/lib/supabase';

// Helper to map test names to database enum values
function mapTestNameToType(testName: string): 'full_panel' | 'hiv' | 'syphilis' | 'chlamydia' | 'gonorrhea' | 'herpes' | 'hpv' | 'hepatitis_b' | 'hepatitis_c' | 'trich' | 'other' {
  const mapping: Record<string, any> = {
    'HIV': 'hiv',
    'HSV-1': 'herpes',
    'HSV-2': 'herpes',
    'Herpes': 'herpes',
    'Syphilis': 'syphilis',
    'Chlamydia': 'chlamydia',
    'Gonorrhea': 'gonorrhea',
    'HPV': 'hpv',
    'Hepatitis B': 'hepatitis_b',
    'Hepatitis C': 'hepatitis_c',
    'Trichomoniasis': 'trich',
    'Full Panel': 'full_panel',
  };
  return mapping[testName] || 'other';
}

const COMMON_TESTS = [
  'HIV',
  'HSV-1',
  'HSV-2',
  'Chlamydia',
  'Gonorrhea',
  'Syphilis',
  'HPV',
  'Hepatitis B',
  'Hepatitis C',
  'Trichomoniasis',
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysSince(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function daysUntil(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function AddTestModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (record: Omit<STITestRecord, 'id' | 'user_id'>) => void;
}) {
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [allNegative, setAllNegative] = useState(true);
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'matches_only' | 'private'>('matches_only');

  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleSave = () => {
    if (selectedTests.length === 0) return;

    const nextTestDate = new Date(testDate);
    nextTestDate.setMonth(nextTestDate.getMonth() + 3);

    onSave({
      test_date: testDate,
      next_test_date: nextTestDate.toISOString().split('T')[0],
      tests_included: selectedTests,
      all_negative: allNegative,
      notes: notes || undefined,
      visibility,
      verified: false,
    });

    // Reset
    setSelectedTests([]);
    setAllNegative(true);
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/80 justify-end">
        <Animated.View
          entering={FadeIn}
          className="bg-zinc-900 rounded-t-3xl p-6 max-h-[90%]"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-bold text-xl">Add Test Results</Text>
            <Pressable onPress={onClose} className="p-2">
              <X size={24} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Test Date */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2">Test Date</Text>
              <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center border border-zinc-700">
                <Calendar size={18} color="#c084fc" />
                <TextInput
                  value={testDate}
                  onChangeText={setTestDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white ml-3"
                />
              </View>
            </View>

            {/* Tests included */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-3">Tests Included</Text>
              <View className="flex-row flex-wrap gap-2">
                {COMMON_TESTS.map((test) => {
                  const isSelected = selectedTests.includes(test);
                  return (
                    <Pressable
                      key={test}
                      onPress={() => toggleTest(test)}
                      className={`px-3 py-2 rounded-lg border ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-zinc-800 border-zinc-700'
                      }`}
                    >
                      <Text className={isSelected ? 'text-purple-400' : 'text-zinc-400'}>
                        {test}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* All negative toggle */}
            <Pressable
              onPress={() => setAllNegative(!allNegative)}
              className="flex-row items-center justify-between bg-zinc-800 rounded-xl px-4 py-4 mb-6 border border-zinc-700"
            >
              <View className="flex-row items-center">
                <Check size={20} color={allNegative ? '#22c55e' : '#9ca3af'} />
                <Text className="text-white ml-3 font-medium">All tests negative</Text>
              </View>
              <View
                className={`w-12 h-7 rounded-full justify-center ${
                  allNegative ? 'bg-green-500' : 'bg-zinc-600'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white ${allNegative ? 'ml-6' : 'ml-1'}`}
                />
              </View>
            </Pressable>

            {/* Visibility */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-3">Who can see this?</Text>
              <View className="flex-row gap-2">
                {[
                  { value: 'public', label: 'Everyone' },
                  { value: 'matches_only', label: 'Matches Only' },
                  { value: 'private', label: 'Just Me' },
                ].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setVisibility(option.value as typeof visibility)}
                    className={`flex-1 py-3 rounded-xl border ${
                      visibility === option.value
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-zinc-800 border-zinc-700'
                    }`}
                  >
                    <Text
                      className={`text-center text-sm ${
                        visibility === option.value ? 'text-purple-400 font-medium' : 'text-zinc-400'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2">Notes (optional)</Text>
              <View className="bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-700">
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any notes about this test..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                  className="text-white"
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
              </View>
            </View>
          </ScrollView>

          <Pressable onPress={handleSave} disabled={selectedTests.length === 0}>
            <LinearGradient
              colors={['#c084fc', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                opacity: selectedTests.length === 0 ? 0.5 : 1,
              }}
            >
              <Text className="text-white font-bold text-lg">Save Test Results</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function STISafety() {
  const router = useRouter();
  const { data: record, isLoading } = useMostRecentSTITest();
  const addSTIRecord = useAddSTIRecord();
  const [showAddModal, setShowAddModal] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="px-6 py-4 flex-row items-center border-b border-zinc-800">
          <Pressable onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <Text className="text-white font-bold text-lg">STI Safety</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c084fc" />
        </View>
      </SafeAreaView>
    );
  }

  // If no record exists, show empty state encouraging user to add their first test
  if (!record) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="px-6 py-4 flex-row items-center border-b border-zinc-800">
          <Pressable onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={24} color="white" />
          </Pressable>
          <Text className="text-white font-bold text-lg">STI Safety</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Shield size={64} color="#c084fc" />
          <Text className="text-white text-xl font-bold mt-4">No Test Records Yet</Text>
          <Text className="text-zinc-400 text-center mt-2">
            Track your STI testing history to share your status with matches
          </Text>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="mt-6 bg-purple-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Add First Test</Text>
          </Pressable>
        </View>
        <AddTestModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={async (newRecord) => {
            try {
              await addSTIRecord.mutateAsync({
                test_date: newRecord.test_date,
                test_type: mapTestNameToType(newRecord.test_type),
                result: 'negative', // Default to negative, user can update later
                notes: newRecord.notes,
                shared_with_matches: newRecord.share_with_matches ?? false,
              });
              setShowAddModal(false);
            } catch (error) {
              console.error('[STI Safety] Error adding record:', error);
              Alert.alert('Error', 'Failed to save test record. Please try again.');
            }
          }}
        />
      </SafeAreaView>
    );
  }

  const daysSinceTest = daysSince(record.test_date);
  const daysUntilNext = record.next_test_date ? daysUntil(record.next_test_date) : null;

  const getStatusColor = () => {
    if (daysSinceTest > 90) return '#ef4444'; // Red - overdue
    if (daysSinceTest > 60) return '#eab308'; // Yellow - getting close
    return '#22c55e'; // Green - recent
  };

  const getStatusText = () => {
    if (daysSinceTest > 90) return 'Overdue for testing';
    if (daysSinceTest > 60) return 'Consider scheduling next test';
    return 'Up to date';
  };

  const handleSaveNewRecord = async (newRecord: {
    test_date: string;
    test_type: string;
    notes?: string;
    share_with_matches?: boolean;
  }) => {
    try {
      await addSTIRecord.mutateAsync({
        test_date: newRecord.test_date,
        test_type: mapTestNameToType(newRecord.test_type),
        result: 'negative', // Default to negative, user can update later
        notes: newRecord.notes,
        shared_with_matches: newRecord.share_with_matches ?? false,
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('[STI Safety] Error adding record:', error);
      Alert.alert('Error', 'Failed to save test record. Please try again.');
    }
  };

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
          <Text className="text-white font-bold text-xl ml-4">STI Safety</Text>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Status Card */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={{ borderRadius: 24, padding: 24, marginBottom: 24 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: getStatusColor() + '30' }}
                  >
                    <Shield size={24} color={getStatusColor()} />
                  </View>
                  <View className="ml-4">
                    <Text className="text-zinc-400 text-sm">Last tested</Text>
                    <Text className="text-white font-bold text-lg">
                      {formatDate(record.test_date)}
                    </Text>
                  </View>
                </View>
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: getStatusColor() + '20' }}
                >
                  <Text className="text-sm font-medium" style={{ color: getStatusColor() }}>
                    {daysSinceTest} days ago
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-4">
                {record.all_negative ? (
                  <>
                    <Check size={20} color="#22c55e" />
                    <Text className="text-green-400 font-medium ml-2">All tests negative</Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} color="#eab308" />
                    <Text className="text-yellow-400 font-medium ml-2">See notes</Text>
                  </>
                )}
              </View>

              <Text className="text-zinc-500 text-sm" style={{ color: getStatusColor() }}>
                {getStatusText()}
              </Text>

              {daysUntilNext !== null && daysUntilNext > 0 && (
                <View className="flex-row items-center mt-3 pt-3 border-t border-zinc-700/50">
                  <Clock size={16} color="#9ca3af" />
                  <Text className="text-zinc-400 text-sm ml-2">
                    Next test in {daysUntilNext} days
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Tests included */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Tests Included</Text>
            <View className="flex-row flex-wrap gap-2">
              {record.tests_included.map((test: string) => (
                <View
                  key={test}
                  className="px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
                >
                  <Text className="text-zinc-300">{test}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Visibility setting */}
          <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Visibility</Text>
            <View className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 flex-row items-center">
              {record.visibility === 'private' ? (
                <EyeOff size={20} color="#9ca3af" />
              ) : (
                <Eye size={20} color="#c084fc" />
              )}
              <Text className="text-white ml-3 flex-1">
                {record.visibility === 'public'
                  ? 'Visible to everyone'
                  : record.visibility === 'matches_only'
                  ? 'Visible to matches only'
                  : 'Only visible to you'}
              </Text>
            </View>
          </Animated.View>

          {/* Tips */}
          <Animated.View entering={FadeInDown.delay(400)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Safety Tips</Text>
            <View className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
              <View className="flex-row items-start mb-3">
                <View className="w-6 h-6 rounded-full bg-purple-500/20 items-center justify-center mt-0.5">
                  <Text className="text-purple-400 text-xs font-bold">1</Text>
                </View>
                <Text className="text-zinc-300 text-sm ml-3 flex-1">
                  Get tested every 3 months when dating multiple partners
                </Text>
              </View>
              <View className="flex-row items-start mb-3">
                <View className="w-6 h-6 rounded-full bg-purple-500/20 items-center justify-center mt-0.5">
                  <Text className="text-purple-400 text-xs font-bold">2</Text>
                </View>
                <Text className="text-zinc-300 text-sm ml-3 flex-1">
                  Share results with all partners before intimacy
                </Text>
              </View>
              <View className="flex-row items-start">
                <View className="w-6 h-6 rounded-full bg-purple-500/20 items-center justify-center mt-0.5">
                  <Text className="text-purple-400 text-xs font-bold">3</Text>
                </View>
                <Text className="text-zinc-300 text-sm ml-3 flex-1">
                  Use barriers consistently and communicate about safer sex
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Add new test button */}
          <Pressable onPress={() => setShowAddModal(true)}>
            <LinearGradient
              colors={['#c084fc', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Plus size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Add Test Results</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>

        <AddTestModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveNewRecord}
        />
      </SafeAreaView>
    </View>
  );
}
