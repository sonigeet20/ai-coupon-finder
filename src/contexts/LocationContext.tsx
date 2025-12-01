import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUserLocation, saveUserLocation, updateUserProfile, LocationData } from '../lib/geolocation';
import { useAuth } from './AuthContext';

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: true,
  error: null,
  refreshLocation: async () => {},
});

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const loc = await getUserLocation();
      setLocation(loc);

      if (user) {
        await saveUserLocation(user.id, loc);
        await updateUserProfile(user.id, loc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, [user]);

  return (
    <LocationContext.Provider value={{ location, loading, error, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
