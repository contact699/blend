import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import MapViewComponent, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Crosshair, MapPin, Navigation } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  AnySearchResult,
  ProfileSearchResult,
  EventSearchResult,
} from '@/lib/types';
import MapMarker from './MapMarker';
import EventMapMarker from './EventMapMarker';
import MapPreviewCard from './MapPreviewCard';

interface MapViewProps {
  results: AnySearchResult[];
  onResultPress: (result: AnySearchResult) => void;
}

const DEFAULT_REGION: Region = {
  latitude: 37.78825, // San Francisco
  longitude: -122.4324,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function MapView({ results, onResultPress }: MapViewProps) {
  const mapRef = useRef<MapViewComponent>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedResult, setSelectedResult] = useState<AnySearchResult | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Filter results by type
  const profileResults = results.filter(
    (r): r is ProfileSearchResult => r.type === 'profile' && r.profile.latitude !== undefined && r.profile.longitude !== undefined
  );
  const eventResults = results.filter(
    (r): r is EventSearchResult => r.type === 'event' && r.event.location?.latitude !== undefined && r.event.location?.longitude !== undefined
  );

  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(coords);
          
          // Center map on user location
          setRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        } catch (error) {
          console.error('Error getting location:', error);
        }
      }
    })();
  }, []);

  const requestLocationPermission = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);
        
        // Animate to user location
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 500);
      } else if (status === 'denied') {
        Alert.alert(
          'Location Permission',
          'Location permission is required to show your position on the map. Please enable it in Settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 500);
    } else {
      requestLocationPermission();
    }
  }, [userLocation, requestLocationPermission]);

  const handleMarkerPress = useCallback((result: AnySearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedResult(result);
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedResult(null);
  }, []);

  const handleViewProfile = useCallback(() => {
    if (selectedResult) {
      onResultPress(selectedResult);
    }
  }, [selectedResult, onResultPress]);

  const totalMarkers = profileResults.length + eventResults.length;

  return (
    <View className="flex-1 bg-zinc-900">
      {/* Location permission banner */}
      {locationPermission !== 'granted' && (
        <Animated.View
          entering={FadeIn}
          className="absolute top-4 left-4 right-4 z-10 bg-purple-500/90 rounded-2xl p-4"
        >
          <View className="flex-row items-center mb-2">
            <MapPin size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">
              Enable Location
            </Text>
          </View>
          <Text className="text-white/90 text-sm mb-3">
            Allow location access to see your position and find nearby profiles
          </Text>
          <Pressable
            onPress={requestLocationPermission}
            disabled={isLoadingLocation}
            className="bg-white rounded-full py-2 px-4 items-center"
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <Text className="text-purple-600 font-semibold">
                Enable Location
              </Text>
            )}
          </Pressable>
        </Animated.View>
      )}

      {/* Map */}
      <MapViewComponent
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ flex: 1 }}
        initialRegion={DEFAULT_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={locationPermission === 'granted'}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        loadingBackgroundColor="#18181b"
        // Dark mode map style (would need custom JSON styling for full dark theme)
        customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
      >
        {/* Profile Markers */}
        {profileResults.map((result) => (
          <MapMarker
            key={result.id}
            result={result}
            onPress={() => handleMarkerPress(result)}
          />
        ))}

        {/* Event Markers */}
        {eventResults.map((result) => (
          <EventMapMarker
            key={result.id}
            result={result}
            onPress={() => handleMarkerPress(result)}
          />
        ))}
      </MapViewComponent>

      {/* Current Location Button */}
      {locationPermission === 'granted' && (
        <Pressable
          onPress={centerOnUserLocation}
          className="absolute bottom-32 right-4 w-14 h-14 bg-purple-500 rounded-full items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Navigation size={24} color="#ffffff" />
        </Pressable>
      )}

      {/* Results Count */}
      <View
        className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-full"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <View className="flex-row items-center">
          <Crosshair size={16} color="#a855f7" />
          <Text className="text-white text-sm ml-2 font-medium">
            {totalMarkers} {totalMarkers === 1 ? 'result' : 'results'} on map
          </Text>
        </View>
      </View>

      {/* Preview Card */}
      {selectedResult && (
        <MapPreviewCard
          result={selectedResult}
          onViewProfile={handleViewProfile}
          onClose={handleClosePreview}
        />
      )}

      {/* No results message */}
      {totalMarkers === 0 && (
        <Animated.View
          entering={FadeIn.delay(300)}
          exiting={FadeOut}
          className="absolute top-1/2 left-1/2"
          style={{ transform: [{ translateX: -100 }, { translateY: -50 }] }}
        >
          <View className="w-64 bg-zinc-800/90 rounded-2xl p-6 items-center">
            <MapPin size={40} color="#71717a" />
            <Text className="text-white font-semibold text-lg mt-3 text-center">
              No results in this area
            </Text>
            <Text className="text-zinc-400 text-sm mt-2 text-center">
              Try zooming out or adjusting your filters
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Dark map style for Android (Google Maps)
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1b1b1b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];
