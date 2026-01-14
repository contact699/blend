import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Users,
  Info,
} from 'lucide-react-native';
import useDatingStore from '@/lib/state/dating-store';
import { EventChatMessage } from '@/lib/types';

export default function EventChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const events = useDatingStore((s) => s.events);
  const eventChats = useDatingStore((s) => s.eventChats);
  const currentUserId = useDatingStore((s) => s.currentUserId);
  const sendEventMessage = useDatingStore((s) => s.sendEventMessage);

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);
  const chat = useMemo(
    () => eventChats.find((c) => c.event_id === id),
    [eventChats, id]
  );

  const [message, setMessage] = useState('');

  useEffect(() => {
    // Scroll to bottom on new messages
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chat?.messages.length]);

  const handleSend = () => {
    if (!message.trim() || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendEventMessage(id, message.trim());
    setMessage('');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!chat?.messages) return [];

    const groups: { date: string; messages: EventChatMessage[] }[] = [];
    let currentDate = '';

    chat.messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.created_at, messages: [msg] });
      } else {
        groups[groups.length - 1]?.messages.push(msg);
      }
    });

    return groups;
  }, [chat?.messages]);

  if (!event) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Event not found</Text>
      </View>
    );
  }

  const goingCount = event.attendees.filter(
    (a) => a.rsvp_status === 'going'
  ).length;

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
          className="border-b border-zinc-800/50"
        >
          <BlurView intensity={60} tint="dark">
            <View className="flex-row items-center px-4 py-3">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center mr-3"
              >
                <ArrowLeft size={22} color="white" />
              </Pressable>

              <Pressable
                onPress={() => router.push(`/event/${id}`)}
                className="flex-1 flex-row items-center"
              >
                <Image
                  source={{ uri: event.cover_image }}
                  className="w-10 h-10 rounded-xl"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold" numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View className="flex-row items-center">
                    <Users size={12} color="#71717a" />
                    <Text className="text-zinc-500 text-xs ml-1">
                      {goingCount} going
                    </Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push(`/event/${id}`)}
                className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center"
              >
                <Info size={20} color="white" />
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          >
            {/* Welcome message if no messages */}
            {(!chat?.messages || chat.messages.length === 0) && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                className="items-center py-12"
              >
                <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center mb-4">
                  <Users size={32} color="#a855f7" />
                </View>
                <Text className="text-white text-lg font-semibold mb-2">
                  Event Chat
                </Text>
                <Text className="text-zinc-500 text-center px-8">
                  This is the group chat for "{event.title}". Only attendees who
                  are going can see and send messages here.
                </Text>
              </Animated.View>
            )}

            {/* Message Groups */}
            {groupedMessages.map((group, groupIndex) => (
              <View key={group.date}>
                {/* Date Separator */}
                <Animated.View
                  entering={FadeIn.delay(groupIndex * 50).duration(300)}
                  className="items-center my-4"
                >
                  <View className="bg-zinc-800/50 px-3 py-1 rounded-full">
                    <Text className="text-zinc-500 text-xs">
                      {formatDate(group.date)}
                    </Text>
                  </View>
                </Animated.View>

                {/* Messages */}
                {group.messages.map((msg, msgIndex) => {
                  const isMe = msg.sender_id === currentUserId;
                  const showAvatar =
                    msgIndex === 0 ||
                    group.messages[msgIndex - 1]?.sender_id !== msg.sender_id;

                  return (
                    <Animated.View
                      key={msg.id}
                      entering={SlideInRight.delay(
                        groupIndex * 50 + msgIndex * 30
                      ).duration(300)}
                      className={`flex-row mb-2 ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isMe && showAvatar && (
                        <Image
                          source={{
                            uri:
                              msg.sender_photo ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                          }}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      {!isMe && !showAvatar && <View className="w-10" />}

                      <View
                        className={`max-w-[75%] ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                        {!isMe && showAvatar && (
                          <Text className="text-zinc-500 text-xs mb-1 ml-1">
                            {msg.sender_name}
                          </Text>
                        )}
                        <View
                          className={`px-4 py-2.5 rounded-2xl ${
                            isMe
                              ? 'bg-purple-500 rounded-br-md'
                              : 'bg-zinc-800 rounded-bl-md'
                          }`}
                        >
                          {msg.media_url && (
                            <Image
                              source={{ uri: msg.media_url }}
                              className="w-48 h-32 rounded-xl mb-2"
                              resizeMode="cover"
                            />
                          )}
                          <Text className="text-white">{msg.content}</Text>
                        </View>
                        <Text className="text-zinc-600 text-xs mt-1 mx-1">
                          {formatTime(msg.created_at)}
                        </Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Input Bar */}
          <Animated.View entering={FadeInUp.duration(300)}>
            <BlurView intensity={60} tint="dark">
              <SafeAreaView edges={['bottom']}>
                <View className="flex-row items-center px-4 py-3">
                  <Pressable className="w-10 h-10 rounded-full bg-zinc-800/50 items-center justify-center mr-2">
                    <ImageIcon size={20} color="#71717a" />
                  </Pressable>

                  <View className="flex-1 flex-row items-center bg-zinc-800/50 rounded-full px-4 py-2">
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Message the group..."
                      placeholderTextColor="#52525b"
                      className="flex-1 text-white"
                      multiline
                      maxLength={1000}
                    />
                  </View>

                  <Pressable
                    onPress={handleSend}
                    disabled={!message.trim()}
                    className="ml-2"
                  >
                    <LinearGradient
                      colors={
                        message.trim()
                          ? ['#c084fc', '#a855f7']
                          : ['#3f3f46', '#27272a']
                      }
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Send size={18} color="white" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </SafeAreaView>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
