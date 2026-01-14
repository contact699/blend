import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { Users, Wifi } from 'lucide-react-native';
import { ProfileSearchResult } from '@/lib/types';
import { TrustBadgeIcon } from '../TrustBadge';

interface MapMarkerProps {
  result: ProfileSearchResult;
  onPress: () => void;
}

export default function MapMarker({ result, onPress }: MapMarkerProps) {
  const { profile, trustTier, trustScore, isOnline } = result;
  const hasPhoto = profile.photos && profile.photos.length > 0;

  // Don't show marker if profile doesn't have location or doesn't want to be shown on map
  if (!profile.latitude || !profile.longitude || profile.show_on_map === false) {
    return null;
  }

  return (
    <Marker
      coordinate={{
        latitude: profile.latitude,
        longitude: profile.longitude,
      }}
      onPress={onPress}
      tracksViewChanges={false} // Optimization: don't re-render on map changes
    >
      <View className="items-center">
        {/* Profile Photo Circle */}
        <View
          className="rounded-full overflow-hidden border-2"
          style={{
            width: 48,
            height: 48,
            borderColor: isOnline ? '#22c55e' : '#a855f7',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          {hasPhoto ? (
            <Image
              source={{ uri: profile.photos[0] }}
              style={{ width: 48, height: 48 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{ width: 48, height: 48 }}
              className="bg-zinc-700 items-center justify-center"
            >
              <Users size={24} color="#71717a" />
            </View>
          )}

          {/* Online indicator */}
          {isOnline && (
            <View
              className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"
            />
          )}
        </View>

        {/* Trust Score Badge */}
        {trustTier && trustScore !== undefined && (
          <View
            className="absolute -top-1 -right-1 flex-row items-center px-1.5 py-0.5 rounded-full bg-black/80"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 3,
            }}
          >
            <TrustBadgeIcon tier={trustTier} size={12} />
            <Text className="text-white text-[10px] ml-0.5 font-bold">
              {trustScore}
            </Text>
          </View>
        )}

        {/* Virtual Only Badge */}
        {profile.virtual_only && (
          <View
            className="absolute -top-1 -left-1 p-1 rounded-full bg-purple-500/90"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 3,
            }}
          >
            <Wifi size={10} color="#ffffff" />
          </View>
        )}

        {/* Name label below */}
        <View
          className="mt-1 px-2 py-0.5 rounded-full bg-black/70"
          style={{
            maxWidth: 80,
          }}
        >
          <Text
            className="text-white text-xs font-medium text-center"
            numberOfLines={1}
          >
            {profile.display_name}
          </Text>
        </View>
      </View>
    </Marker>
  );
}
