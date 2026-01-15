import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  X,
  Camera,
  Calendar,
  Clock,
  MapPin,
  Users,
  Globe,
  Lock,
  Eye,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { EVENT_CATEGORIES } from '@/lib/static-data';
import { EventCategory, EventVisibility, EventLocation } from '@/lib/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CreateEventScreen() {
  const router = useRouter();
  const createEvent = useDatingStore((s) => s.createEvent);
  const currentUserId = useDatingStore((s) => s.currentUserId);
  const currentProfile = useDatingStore((s) => s.currentProfile);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [requiresApproval, setRequiresApproval] = useState(false);

  const [step, setStep] = useState(1);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const isStep1Valid = title.length > 0 && category !== null;
  const isStep2Valid = description.length > 0;
  const isStep3Valid = isVirtual
    ? virtualLink.length > 0
    : locationName.length > 0 && locationCity.length > 0;
  const isStep4Valid = startDate.length > 0 && startTime.length > 0;

  const handleCreate = () => {
    if (!category || !currentProfile) return;

    // Build host info from current profile
    const host = {
      user_id: currentUserId,
      display_name: currentProfile.display_name,
      photo: currentProfile.photos[0],
      reputation_stars: 3, // Will be calculated from trust score
      events_hosted: 0, // Will be fetched from Supabase
    };

    const location: EventLocation = {
      name: isVirtual ? 'Virtual Event' : locationName,
      address: isVirtual ? 'Online' : locationAddress,
      city: isVirtual ? 'Virtual' : locationCity,
      latitude: 37.7749,
      longitude: -122.4194,
      is_virtual: isVirtual,
      virtual_link: isVirtual ? virtualLink : undefined,
    };

    const newEvent = createEvent({
      host_id: currentUserId,
      host,
      title,
      description,
      cover_image: coverImage ?? 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      category,
      tags,
      location,
      start_date: startDate || new Date().toISOString().split('T')[0],
      start_time: startTime || '18:00',
      end_time: endTime || undefined,
      timezone: 'America/Los_Angeles',
      max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
      visibility,
      requires_approval: requiresApproval,
      status: 'draft',
      is_featured: false,
      is_recurring: false,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    router.push(`/event/${newEvent.id}`);
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#18181b', '#09090b', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800/50"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center"
          >
            <X size={22} color="white" />
          </Pressable>
          <Text className="text-white text-lg font-bold">Create Event</Text>
          <View className="w-10" />
        </Animated.View>

        {/* Progress Steps */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          className="flex-row items-center px-5 py-4"
        >
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <Pressable
                onPress={() => setStep(s)}
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  step >= s ? 'bg-purple-500' : 'bg-zinc-800'
                }`}
              >
                {step > s ? (
                  <Check size={16} color="white" />
                ) : (
                  <Text
                    className={`font-semibold ${
                      step >= s ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    {s}
                  </Text>
                )}
              </Pressable>
              {s < 4 && (
                <View
                  className={`flex-1 h-0.5 mx-2 ${
                    step > s ? 'bg-purple-500' : 'bg-zinc-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Text className="text-white text-xl font-bold mb-2">
                  Basic Info
                </Text>
                <Text className="text-zinc-400 text-sm mb-6">
                  Give your event a name and category
                </Text>

                {/* Cover Image */}
                <Pressable
                  onPress={pickImage}
                  className="h-44 rounded-2xl overflow-hidden mb-6 border border-zinc-800 border-dashed"
                >
                  {coverImage ? (
                    <Image
                      source={{ uri: coverImage }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-zinc-900/50">
                      <Camera size={32} color="#71717a" />
                      <Text className="text-zinc-500 mt-2">Add cover photo</Text>
                    </View>
                  )}
                </Pressable>

                {/* Title */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Event Title *</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Give your event a catchy name"
                    placeholderTextColor="#52525b"
                    className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                  />
                </View>

                {/* Category */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Category *</Text>
                  <Pressable
                    onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                    className="flex-row items-center justify-between bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5"
                  >
                    {category ? (
                      <Text className="text-white">
                        {EVENT_CATEGORIES.find((c) => c.id === category)?.emoji}{' '}
                        {EVENT_CATEGORIES.find((c) => c.id === category)?.label}
                      </Text>
                    ) : (
                      <Text className="text-zinc-500">Select a category</Text>
                    )}
                    <ChevronDown size={20} color="#71717a" />
                  </Pressable>

                  {showCategoryPicker && (
                    <View className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      {EVENT_CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            setCategory(cat.id);
                            setShowCategoryPicker(false);
                          }}
                          className={`flex-row items-center px-4 py-3 border-b border-zinc-800/50 ${
                            category === cat.id ? 'bg-purple-500/10' : ''
                          }`}
                        >
                          <Text className="text-lg mr-2">{cat.emoji}</Text>
                          <Text
                            className={`flex-1 ${
                              category === cat.id
                                ? 'text-purple-400 font-medium'
                                : 'text-white'
                            }`}
                          >
                            {cat.label}
                          </Text>
                          {category === cat.id && (
                            <Check size={18} color="#a855f7" />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Step 2: Description & Tags */}
            {step === 2 && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Text className="text-white text-xl font-bold mb-2">
                  Details
                </Text>
                <Text className="text-zinc-400 text-sm mb-6">
                  Tell people what to expect
                </Text>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Description *</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe your event, what to expect, what to bring..."
                    placeholderTextColor="#52525b"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white min-h-[150px]"
                  />
                </View>

                {/* Tags */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Tags</Text>
                  <View className="flex-row items-center">
                    <TextInput
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={addTag}
                      placeholder="Add tags (e.g., poly-friendly)"
                      placeholderTextColor="#52525b"
                      className="flex-1 bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3 text-white mr-2"
                    />
                    <Pressable
                      onPress={addTag}
                      className="w-12 h-12 rounded-xl bg-purple-500/20 items-center justify-center"
                    >
                      <Text className="text-purple-400 text-xl">+</Text>
                    </Pressable>
                  </View>
                  <View className="flex-row flex-wrap mt-3">
                    {tags.map((tag) => (
                      <Pressable
                        key={tag}
                        onPress={() => removeTag(tag)}
                        className="flex-row items-center bg-zinc-800 rounded-full px-3 py-1.5 mr-2 mb-2"
                      >
                        <Text className="text-zinc-300 text-sm">{tag}</Text>
                        <X size={14} color="#71717a" className="ml-1" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Text className="text-white text-xl font-bold mb-2">
                  Location
                </Text>
                <Text className="text-zinc-400 text-sm mb-6">
                  Where will your event take place?
                </Text>

                {/* Virtual Toggle */}
                <View className="flex-row items-center justify-between bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 mb-4">
                  <View className="flex-row items-center">
                    <Globe size={20} color="#a855f7" />
                    <Text className="text-white ml-3">Virtual Event</Text>
                  </View>
                  <Pressable
                    onPress={() => setIsVirtual(!isVirtual)}
                    className={`w-12 h-7 rounded-full ${
                      isVirtual ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <Animated.View
                      style={{
                        width: 23,
                        height: 23,
                        borderRadius: 12,
                        backgroundColor: 'white',
                        marginTop: 2,
                        marginLeft: isVirtual ? 25 : 2,
                      }}
                    />
                  </Pressable>
                </View>

                {isVirtual ? (
                  <View className="mb-4">
                    <Text className="text-zinc-400 text-sm mb-2">
                      Meeting Link *
                    </Text>
                    <TextInput
                      value={virtualLink}
                      onChangeText={setVirtualLink}
                      placeholder="https://zoom.us/j/..."
                      placeholderTextColor="#52525b"
                      className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                    />
                  </View>
                ) : (
                  <>
                    <View className="mb-4">
                      <Text className="text-zinc-400 text-sm mb-2">
                        Venue Name *
                      </Text>
                      <TextInput
                        value={locationName}
                        onChangeText={setLocationName}
                        placeholder="e.g., The Velvet Lounge"
                        placeholderTextColor="#52525b"
                        className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-zinc-400 text-sm mb-2">Address</Text>
                      <TextInput
                        value={locationAddress}
                        onChangeText={setLocationAddress}
                        placeholder="123 Main Street"
                        placeholderTextColor="#52525b"
                        className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-zinc-400 text-sm mb-2">City *</Text>
                      <TextInput
                        value={locationCity}
                        onChangeText={setLocationCity}
                        placeholder="San Francisco"
                        placeholderTextColor="#52525b"
                        className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                      />
                    </View>
                  </>
                )}
              </Animated.View>
            )}

            {/* Step 4: Date, Time & Settings */}
            {step === 4 && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Text className="text-white text-xl font-bold mb-2">
                  Date & Settings
                </Text>
                <Text className="text-zinc-400 text-sm mb-6">
                  When is your event?
                </Text>

                {/* Date */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Date *</Text>
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2024-02-15"
                    placeholderTextColor="#52525b"
                    className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                  />
                </View>

                {/* Time */}
                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2">
                    <Text className="text-zinc-400 text-sm mb-2">Start Time *</Text>
                    <TextInput
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="18:00"
                      placeholderTextColor="#52525b"
                      className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-zinc-400 text-sm mb-2">End Time</Text>
                    <TextInput
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="22:00"
                      placeholderTextColor="#52525b"
                      className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                    />
                  </View>
                </View>

                {/* Max Attendees */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">
                    Max Attendees (optional)
                  </Text>
                  <TextInput
                    value={maxAttendees}
                    onChangeText={setMaxAttendees}
                    placeholder="Leave empty for unlimited"
                    placeholderTextColor="#52525b"
                    keyboardType="number-pad"
                    className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 text-white"
                  />
                </View>

                {/* Visibility */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Visibility</Text>
                  <View className="flex-row">
                    {(
                      [
                        { id: 'public', label: 'Public', icon: Globe },
                        { id: 'friends_only', label: 'Friends', icon: Eye },
                        { id: 'invite_only', label: 'Invite Only', icon: Lock },
                      ] as const
                    ).map((opt) => (
                      <Pressable
                        key={opt.id}
                        onPress={() => setVisibility(opt.id)}
                        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl mr-2 last:mr-0 border ${
                          visibility === opt.id
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-zinc-900/80 border-zinc-800/50'
                        }`}
                      >
                        <opt.icon
                          size={16}
                          color={visibility === opt.id ? '#a855f7' : '#71717a'}
                        />
                        <Text
                          className={`ml-2 text-sm ${
                            visibility === opt.id
                              ? 'text-purple-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Requires Approval */}
                <Pressable
                  onPress={() => setRequiresApproval(!requiresApproval)}
                  className="flex-row items-center justify-between bg-zinc-900/80 border border-zinc-800/50 rounded-xl px-4 py-3.5 mb-4"
                >
                  <View className="flex-row items-center flex-1">
                    <Lock size={20} color="#71717a" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white">Require Approval</Text>
                      <Text className="text-zinc-500 text-xs">
                        Review RSVPs before accepting
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-md items-center justify-center ${
                      requiresApproval ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    {requiresApproval && <Check size={16} color="white" />}
                  </View>
                </Pressable>
              </Animated.View>
            )}

            <View className="h-32" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Actions */}
        <View className="px-5 pb-4">
          <View className="flex-row">
            {step > 1 && (
              <Pressable
                onPress={() => setStep(step - 1)}
                className="flex-1 py-4 rounded-2xl bg-zinc-800 items-center mr-3"
              >
                <Text className="text-white font-semibold">Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (step < 4) {
                  setStep(step + 1);
                } else {
                  handleCreate();
                }
              }}
              disabled={
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !isStep2Valid) ||
                (step === 3 && !isStep3Valid) ||
                (step === 4 && !isStep4Valid)
              }
              className="flex-1"
            >
              <LinearGradient
                colors={
                  (step === 1 && !isStep1Valid) ||
                  (step === 2 && !isStep2Valid) ||
                  (step === 3 && !isStep3Valid) ||
                  (step === 4 && !isStep4Valid)
                    ? ['#3f3f46', '#27272a']
                    : ['#c084fc', '#a855f7']
                }
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                }}
              >
                <Text className="text-white font-bold">
                  {step < 4 ? 'Continue' : 'Create Event'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
