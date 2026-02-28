/**
 * Location Service
 *
 * Wraps expo-location to provide GPS coordinates and reverse geocoding
 * for auto-attaching location to waste complaints.
 */

import * as Location from 'expo-location';
import { type GeoLocation } from './complaint-store';

/**
 * Request location permission and get current GPS coordinates.
 * Returns null if permission is denied or location is unavailable.
 */
export async function getCurrentLocation(): Promise<GeoLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const geo: GeoLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };

    // Try reverse geocoding for a human-readable address
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const parts = [
          address.street,
          address.district,
          address.city,
          address.region,
        ].filter(Boolean);
        geo.address = parts.join(', ') || undefined;
      }
    } catch (geocodeError) {
      console.warn('Reverse geocoding failed:', geocodeError);
    }

    return geo;
  } catch (error) {
    console.error('Failed to get location:', error);
    return null;
  }
}

/**
 * Check if location permissions are already granted.
 */
export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Format coordinates for display.
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
