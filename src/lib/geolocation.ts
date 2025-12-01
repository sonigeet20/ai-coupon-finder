import { supabase } from './supabase';

export interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const getUserLocation = async (): Promise<LocationData> => {
  try {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      });
    });

    const { latitude, longitude } = position.coords;

    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location details');
    }

    const data = await response.json();

    return {
      city: data.city || data.locality || data.principalSubdivision || 'Unknown',
      country: data.countryName || 'Unknown',
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('Error fetching location, falling back to IP-based location:', error);

    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error('Failed to fetch IP-based location');
      }
      const data = await response.json();

      return {
        city: data.city || 'Unknown',
        country: data.country_name || 'Unknown',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      };
    } catch (fallbackError) {
      console.error('Fallback location failed:', fallbackError);
      throw new Error('Unable to determine your location');
    }
  }
};

export const saveUserLocation = async (userId: string, location: LocationData) => {
  try {
    const { error } = await supabase
      .from('user_locations')
      .insert({
        user_id: userId,
        city: location.city,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving user location:', error);
  }
};

export const updateUserProfile = async (userId: string, location: LocationData) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        preferred_location: location.city,
        latitude: location.latitude,
        longitude: location.longitude,
        country: location.country,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
