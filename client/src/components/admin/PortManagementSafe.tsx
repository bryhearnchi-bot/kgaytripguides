import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface Port {
  id: number;
  name: string;
  country: string;
  region?: string;
  port_type: 'port' | 'sea_day' | 'embark' | 'disembark';
  coordinates?: { lat: number; lng: number } | null;
  description?: string;
  image_url?: string;
}

export default function PortManagementSafe() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ports with error handling
  const { data: ports = [], isLoading, error } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/ports', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch ports: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched ports:', data);
        return data;
      } catch (err) {
        console.error('Error fetching ports:', err);
        throw err;
      }
    },
  });

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>Error loading ports: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading ports...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter ports safely
  const filteredPorts = ports.filter(port => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    // Safe property checks
    const nameMatch = port.name && port.name.toLowerCase().includes(searchLower);
    const countryMatch = port.country && port.country.toLowerCase().includes(searchLower);
    const regionMatch = port.region && port.region.toLowerCase().includes(searchLower);

    return nameMatch || countryMatch || regionMatch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Port Management (Safe Mode)</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Port
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search ports..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Port List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPorts.map((port) => (
          <Card key={port.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{port.name || 'Unnamed Port'}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {port.country || 'Unknown Country'}
                    {port.region && ` • ${port.region}`}
                  </p>
                </div>
                <Badge variant="outline">
                  {port.port_type || 'port'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500">
                  {port.coordinates ? (
                    <>
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>Mapped</span>
                    </>
                  ) : (
                    <span>No coordinates</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredPorts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            {searchQuery ? 'No ports found matching your search.' : 'No ports found.'}
          </CardContent>
        </Card>
      )}

      {/* Debug info */}
      <div className="text-xs text-gray-400">
        Total ports: {ports.length} | Filtered: {filteredPorts.length}
      </div>
    </div>
  );
}