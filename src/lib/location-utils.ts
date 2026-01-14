/**
 * Location utilities for privacy-focused coordinate handling
 */

/**
 * Fuzz coordinates to reduce precision for privacy
 * Reduces precision to 2 decimal places (~1.1 km accuracy)
 * This prevents exact location tracking while maintaining general area information
 * 
 * @param latitude - Original latitude
 * @param longitude - Original longitude
 * @returns Fuzzed coordinates with reduced precision
 * 
 * @example
 * const { latitude, longitude } = fuzzCoordinates(37.7749, -122.4194);
 * // Returns approximately { latitude: 37.77, longitude: -122.42 }
 */
export function fuzzCoordinates(
  latitude: number,
  longitude: number,
  precision: number = 2
): { latitude: number; longitude: number } {
  const multiplier = Math.pow(10, precision);
  
  return {
    latitude: Math.round(latitude * multiplier) / multiplier,
    longitude: Math.round(longitude * multiplier) / multiplier,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 * 
 * Note: This assumes spherical Earth geometry and has reduced accuracy at extreme latitudes.
 * For more precise calculations over long distances, consider using an ellipsoidal model.
 * 
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert miles to kilometers
 */
export function milesToKilometers(miles: number): number {
  return miles * 1.60934;
}

/**
 * Convert kilometers to miles
 */
export function kilometersToMiles(kilometers: number): number {
  return kilometers * 0.621371;
}

/**
 * Check if coordinates are within a radius
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusMiles;
}

/**
 * Get approximate city name from coordinates (placeholder)
 * In production, this would use a reverse geocoding service
 */
export function getCityFromCoordinates(
  latitude: number,
  longitude: number
): string {
  // Placeholder implementation
  // In production, use a reverse geocoding API like Google Maps Geocoding API
  return 'Unknown City';
}
