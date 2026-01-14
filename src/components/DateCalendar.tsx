import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Moon,
  Bell,
  X,
  Heart,
  Users,
} from 'lucide-react-native';
import { ScheduledDate } from '@/lib/types';

interface DateCalendarProps {
  dates: ScheduledDate[];
  onAddDate: (date: Omit<ScheduledDate, 'id' | 'user_id' | 'created_at' | 'reminder_sent'>) => void;
  onDeleteDate: (dateId: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DateEvent {
  date: ScheduledDate;
  color: string;
}

const PARTNER_COLORS = [
  '#c084fc', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#84cc16', // Lime
  '#06b6d4', // Cyan
];

function getPartnerColor(partnerId: string, partnerColorMap: Map<string, string>): string {
  if (!partnerColorMap.has(partnerId)) {
    const colorIndex = partnerColorMap.size % PARTNER_COLORS.length;
    partnerColorMap.set(partnerId, PARTNER_COLORS[colorIndex]);
  }
  return partnerColorMap.get(partnerId)!;
}

function DateBadge({ event, onPress }: { event: DateEvent; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-0.5 left-0.5 right-0.5"
      style={{ maxHeight: 20 }}
    >
      <View
        className="rounded px-1 py-0.5"
        style={{ backgroundColor: event.color + '80' }}
      >
        <Text className="text-white text-[8px] font-medium" numberOfLines={1}>
          {event.date.partner_name}
        </Text>
      </View>
    </Pressable>
  );
}

function AddDateModal({
  visible,
  onClose,
  onSave,
  selectedDate,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (date: Omit<ScheduledDate, 'id' | 'user_id' | 'created_at' | 'reminder_sent'>) => void;
  selectedDate: Date;
}) {
  const [partnerName, setPartnerName] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isOvernight, setIsOvernight] = useState(false);

  const handleSave = () => {
    if (!partnerName.trim() || !title.trim()) return;

    onSave({
      partner_id: `partner-${Date.now()}`,
      partner_name: partnerName.trim(),
      title: title.trim(),
      date: selectedDate.toISOString().split('T')[0],
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      location: location || undefined,
      notes: notes || undefined,
      is_overnight: isOvernight,
    });

    // Reset form
    setPartnerName('');
    setTitle('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setNotes('');
    setIsOvernight(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/80 justify-end">
        <Animated.View
          entering={FadeIn}
          className="bg-zinc-900 rounded-t-3xl p-6 max-h-[85%]"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-bold text-xl">Schedule Date</Text>
            <Pressable onPress={onClose} className="p-2">
              <X size={24} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Date</Text>
              <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center">
                <Calendar size={18} color="#c084fc" />
                <Text className="text-white ml-3">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Partner Name *</Text>
              <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center border border-zinc-700">
                <Users size={18} color="#9ca3af" />
                <TextInput
                  value={partnerName}
                  onChangeText={setPartnerName}
                  placeholder="Who is this date with?"
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white ml-3"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Title *</Text>
              <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center border border-zinc-700">
                <Heart size={18} color="#9ca3af" />
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Dinner date, Movie night"
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white ml-3"
                />
              </View>
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-zinc-400 text-sm mb-2">Start Time</Text>
                <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center border border-zinc-700">
                  <Clock size={18} color="#9ca3af" />
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="7:00 PM"
                    placeholderTextColor="#6b7280"
                    className="flex-1 text-white ml-3"
                  />
                </View>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-zinc-400 text-sm mb-2">End Time</Text>
                <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center border border-zinc-700">
                  <Clock size={18} color="#9ca3af" />
                  <TextInput
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="10:00 PM"
                    placeholderTextColor="#6b7280"
                    className="flex-1 text-white ml-3"
                  />
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Location</Text>
              <View className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center border border-zinc-700">
                <MapPin size={18} color="#9ca3af" />
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Restaurant, home, etc."
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-white ml-3"
                />
              </View>
            </View>

            <Pressable
              onPress={() => setIsOvernight(!isOvernight)}
              className="mb-4 flex-row items-center justify-between bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-700"
            >
              <View className="flex-row items-center">
                <Moon size={18} color="#9ca3af" />
                <Text className="text-white ml-3">Overnight</Text>
              </View>
              <View
                className={`w-12 h-7 rounded-full ${
                  isOvernight ? 'bg-purple-500' : 'bg-zinc-600'
                } justify-center`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white ${
                    isOvernight ? 'ml-6' : 'ml-1'
                  }`}
                />
              </View>
            </Pressable>

            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2">Notes</Text>
              <View className="bg-zinc-800 rounded-xl px-4 py-3 border border-zinc-700">
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any notes..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                  className="text-white"
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
              </View>
            </View>
          </ScrollView>

          <Pressable
            onPress={handleSave}
            disabled={!partnerName.trim() || !title.trim()}
          >
            <LinearGradient
              colors={['#c084fc', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                opacity: !partnerName.trim() || !title.trim() ? 0.5 : 1,
              }}
            >
              <Text className="text-white font-bold text-lg">Schedule Date</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function DateCalendar({ dates, onAddDate, onDeleteDate }: DateCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const partnerColorMap = useMemo(() => new Map<string, string>(), []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map dates to calendar days
  const dateEvents = useMemo(() => {
    const events: { [day: number]: DateEvent[] } = {};
    dates.forEach((date) => {
      const dateObj = new Date(date.date);
      if (dateObj.getFullYear() === year && dateObj.getMonth() === month) {
        const day = dateObj.getDate();
        if (!events[day]) events[day] = [];
        events[day].push({
          date,
          color: getPartnerColor(date.partner_id, partnerColorMap),
        });
      }
    });
    return events;
  }, [dates, year, month, partnerColorMap]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return dates.filter((d) => d.date === dateStr);
  }, [selectedDate, dates]);

  return (
    <View className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-zinc-800">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
            <Calendar size={20} color="#c084fc" />
          </View>
          <Text className="text-white font-semibold text-lg">Date Calendar</Text>
        </View>
        <Pressable
          onPress={() => {
            setSelectedDate(new Date());
            setShowAddModal(true);
          }}
          className="w-9 h-9 rounded-full bg-purple-500/20 items-center justify-center"
        >
          <Plus size={18} color="#c084fc" />
        </Pressable>
      </View>

      {/* Month navigation */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={prevMonth} className="p-2">
          <ChevronLeft size={20} color="#c084fc" />
        </Pressable>
        <Text className="text-white font-semibold text-base">
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={nextMonth} className="p-2">
          <ChevronRight size={20} color="#c084fc" />
        </Pressable>
      </View>

      {/* Day headers */}
      <View className="flex-row px-2 pb-2">
        {DAYS.map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-zinc-500 text-xs font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap px-2 pb-4">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <View key={`empty-${i}`} className="w-[14.28%] aspect-square p-1" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasEvents = !!dateEvents[day]?.length;
          const isSelected =
            selectedDate?.getFullYear() === year &&
            selectedDate?.getMonth() === month &&
            selectedDate?.getDate() === day;

          return (
            <Pressable
              key={day}
              onPress={() => setSelectedDate(new Date(year, month, day))}
              className="w-[14.28%] aspect-square p-0.5"
            >
              <View
                className={`flex-1 rounded-lg items-center justify-center relative ${
                  isSelected
                    ? 'bg-purple-500'
                    : isToday(day)
                    ? 'border border-purple-500'
                    : hasEvents
                    ? 'bg-zinc-800'
                    : ''
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-white' : isToday(day) ? 'text-purple-400' : 'text-zinc-300'
                  }`}
                >
                  {day}
                </Text>
                {hasEvents && !isSelected && (
                  <View className="absolute bottom-1 flex-row">
                    {dateEvents[day].slice(0, 3).map((event, idx) => (
                      <View
                        key={event.date.id}
                        className="w-1.5 h-1.5 rounded-full mx-0.5"
                        style={{ backgroundColor: event.color }}
                      />
                    ))}
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Selected date events */}
      {selectedDate && (
        <Animated.View entering={FadeInDown} className="border-t border-zinc-800 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-semibold">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="flex-row items-center px-3 py-1.5 rounded-full bg-purple-500/20"
            >
              <Plus size={14} color="#c084fc" />
              <Text className="text-purple-400 text-sm ml-1">Add</Text>
            </Pressable>
          </View>

          {selectedDayEvents.length === 0 ? (
            <View className="py-4 items-center">
              <Text className="text-zinc-500 text-sm">No dates scheduled</Text>
            </View>
          ) : (
            selectedDayEvents.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={SlideInRight.delay(index * 50)}
                className="flex-row items-center bg-zinc-800/50 rounded-xl p-3 mb-2"
              >
                <View
                  className="w-1 h-full rounded-full mr-3"
                  style={{ backgroundColor: getPartnerColor(event.partner_id, partnerColorMap) }}
                />
                <View className="flex-1">
                  <Text className="text-white font-medium">{event.title}</Text>
                  <Text className="text-zinc-400 text-sm">{event.partner_name}</Text>
                  <View className="flex-row items-center mt-1">
                    {event.start_time && (
                      <View className="flex-row items-center mr-3">
                        <Clock size={12} color="#9ca3af" />
                        <Text className="text-zinc-500 text-xs ml-1">{event.start_time}</Text>
                      </View>
                    )}
                    {event.location && (
                      <View className="flex-row items-center mr-3">
                        <MapPin size={12} color="#9ca3af" />
                        <Text className="text-zinc-500 text-xs ml-1">{event.location}</Text>
                      </View>
                    )}
                    {event.is_overnight && (
                      <View className="flex-row items-center">
                        <Moon size={12} color="#c084fc" />
                        <Text className="text-purple-400 text-xs ml-1">Overnight</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => onDeleteDate(event.id)}
                  className="p-2"
                >
                  <X size={16} color="#6b7280" />
                </Pressable>
              </Animated.View>
            ))
          )}
        </Animated.View>
      )}

      <AddDateModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={onAddDate}
        selectedDate={selectedDate || new Date()}
      />
    </View>
  );
}
