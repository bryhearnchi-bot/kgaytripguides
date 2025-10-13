import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

interface Location {
  id: number;
  name: string;
  city?: string;
  stateProvince?: string;
  country: string;
  countryCode?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LocationsContextType {
  locations: Location[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export function LocationsProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/locations');

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status}`);
      }

      const data = await response.json();
      setLocations(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <LocationsContext.Provider value={{ locations, loading, error, refetch: fetchLocations }}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationsProvider');
  }
  return context;
}
