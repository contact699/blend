import React from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Calendar, MapPin } from 'lucide-react-native';
import { EventSearchResult } from '@/lib/types';

interface EventMapMarkerProps {
  result: EventSearchResult;
  onPress: () => void;
}

export default function EventMapMarker({ result, onPress }: EventMapMarkerProps) {
  const { event } = result;

  // Don't show marker if event doesn't have location or is virtual
  if (!event.location?.latitude || !event.location?.longitude || event.location?.is_virtual) {
    return null;
  }

  return (
    <Marker
      coordinate={{
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View className="items-center">
        {/* Event Pin */}
        <View
          className="rounded-full overflow-hidden border-2 border-amber-500 bg-amber-500 items-center justify-center"
          style={{
            width: 48,
            height: 48,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Calendar size={24} color="#ffffff" />
        </View>

        {/* Attendee Count Badge */}
        {event.current_attendees > 0 && (
          <View
            className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-black/80"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 3,
            }}
          >
            <Text className="text-white text-[10px] font-bold">
              {event.current_attendees}
            </Text>
          </View>
        )}

        {/* Event Title label below */}
        <View
          className="mt-1 px-2 py-0.5 rounded-full bg-amber-500/90"
          style={{
            maxWidth: 100,
          }}
        >
          <Text
            className="text-white text-xs font-medium text-center"
            numberOfLines={1}
          >
            {event.title}
          </Text>
        </View>
      </View>
    </Marker>
  );
}
