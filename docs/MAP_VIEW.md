# Map View Feature

## Overview
The Map View feature allows users to discover profiles and events based on their geographic location using an interactive map interface.

## Components

### MapView.tsx
Main map component that displays:
- User's current location (with permission)
- Nearby profiles as custom markers
- Nearby events as distinct markers
- Dark theme styling for the map
- Location permission handling

### MapMarker.tsx
Custom marker component for profile markers:
- Circular profile photo
- Trust score badge overlay
- Online status indicator (green dot)
- Virtual-only badge for virtual profiles
- Name label below marker

### EventMapMarker.tsx
Custom marker component for event markers:
- Calendar icon in amber color
- Attendee count badge
- Event title label
- Distinct styling from profile markers

### MapPreviewCard.tsx
Animated preview card that appears when a marker is tapped:
- Profile preview with photo, bio, tags
- Event preview with details and attendee count
- "View Profile/Event" button
- Close button
- Smooth slide-up animation

## Features

### Location Permissions
- Automatic permission request on first use
- Permission banner with "Enable Location" button
- Graceful handling of denied permissions
- User location indicator on map

### Privacy Controls
- `show_on_map` flag to control visibility
- Fuzzy location coordinates (approximate area, not exact)
- Only shows profiles that opted in to map view
- Respects blocked users

### Map Controls
- Current location button to re-center map
- Results counter showing number of markers
- Zoom and pan gestures
- Dark theme map styling (Android)

### Data Layer
- `useNearbyProfiles` hook - Queries profiles within radius using Haversine formula
- `useNearbyEvents` hook - Placeholder for future event queries
- Database schema includes latitude, longitude, show_on_map fields

## Database Schema

```sql
-- Added to profiles table
latitude DECIMAL(10, 8),
longitude DECIMAL(11, 8),
show_on_map BOOLEAN DEFAULT true,
```

## TypeScript Types

```typescript
export interface Profile {
  // ... existing fields
  latitude?: number;
  longitude?: number;
  show_on_map?: boolean;
}
```

## Usage

Users can toggle to Map View from the search results screen using the view mode toggle (Card/List/Map icons).

### Prerequisites
- Location permission granted
- Profile has latitude/longitude coordinates
- Profile has `show_on_map` set to true

### User Flow
1. Navigate to Search screen
2. Toggle to Map View using the map icon
3. Grant location permission if prompted
4. View nearby profiles and events as markers
5. Tap marker to see preview card
6. Tap "View Profile/Event" to see full details

## Performance Considerations

### Current Implementation
- Markers use `tracksViewChanges={false}` to prevent unnecessary re-renders
- Results are filtered client-side for mock data
- Database queries use spatial filtering for real data

### Future Optimizations
- Implement marker clustering for dense areas (e.g., using react-native-maps-super-cluster)
- Debounce map region changes to reduce queries
- Lazy load markers as user pans
- Cache nearby results with React Query
- Only fetch visible region + buffer

## Platform Notes

### iOS
- Uses Apple Maps by default
- Custom map styling not supported (iOS uses system theme)
- Requires location permission in Info.plist

### Android
- Uses Google Maps (PROVIDER_GOOGLE)
- Custom dark theme styling applied
- Requires Google Maps API key in app.json

## Testing

To test the Map View:
1. Ensure mock profiles have location data (SF Bay Area coordinates added)
2. Navigate to Search screen
3. Apply filters or search for profiles
4. Toggle to Map View
5. Grant location permission when prompted
6. Verify markers appear for profiles with coordinates
7. Tap markers to see preview cards
8. Use current location button to re-center

## Future Enhancements

- [ ] Marker clustering for dense areas
- [ ] Radius indicator showing search distance
- [ ] Filter markers by trust score, online status, etc.
- [ ] Heat map view for popular areas
- [ ] Save favorite locations
- [ ] Navigation integration
- [ ] Offline map support
