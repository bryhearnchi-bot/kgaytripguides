import React, { useState, useEffect } from 'react';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MapPin, Plus, Trash2, AlertTriangle, Edit2, X, Check } from 'lucide-react'; // Keep Edit2, X, Check for potential future use or if they are used elsewhere
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Keep Select for the delete confirmation dialog or if it's used elsewhere
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'; // Keep Dialog for the delete confirmation

// Assuming StandardDropdown is a custom component, adding its import
import { StandardDropdown } from '@/components/ui/dropdowns';

interface Venue {
  id: number;
  name: string;
  venueTypeId: number;
  venueTypeName?: string;
  description?: string;
}

interface VenueType {
  id: number;
  name: string;
}

interface VenueManagementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  propertyType: 'resort' | 'ship'; // resort or ship
  pendingMode?: boolean; // If true, work with pending venues in state instead of API
  initialPendingVenues?: Array<{ name: string; venueTypeId: number; description?: string }>;
  onPendingVenuesChange?: (
    venues: Array<{ name: string; venueTypeId: number; description?: string }>
  ) => void;
  onSuccess?: () => void;
}

export function VenueManagementModal({
  isOpen,
  onOpenChange,
  propertyId,
  propertyType,
  pendingMode = false,
  initialPendingVenues = [],
  onPendingVenuesChange,
  onSuccess,
}: VenueManagementModalProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const venuesLoadedRef = React.useRef(false);

  // State for adding new venue
  const [newVenueName, setNewVenueName] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // State for delete confirmation
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);

  // Reset ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      venuesLoadedRef.current = false;
      setVenues([]);
    }
  }, [isOpen]);

  // Fetch venue types on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVenueTypes();
    }
  }, [isOpen]);

  // Fetch venues when modal opens or propertyId changes
  useEffect(() => {
    if (isOpen && !pendingMode && propertyId && venueTypes.length > 0 && !venuesLoadedRef.current) {
      venuesLoadedRef.current = true;
      fetchVenues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, propertyId, pendingMode, venueTypes.length]);

  // Handle pending venues once venueTypes are loaded
  useEffect(() => {
    if (isOpen && pendingMode) {
      if (venueTypes.length > 0 && initialPendingVenues.length > 0) {
        const pendingVenuesWithIds = initialPendingVenues.map((v, idx) => ({
          id: -(idx + 1), // Negative IDs for pending venues
          name: v.name,
          venueTypeId: v.venueTypeId,
          description: v.description,
          venueTypeName: venueTypes.find(type => type.id === v.venueTypeId)?.name || 'Unknown Type',
        }));
        setVenues(pendingVenuesWithIds);
      } else if (initialPendingVenues.length === 0) {
        setVenues([]);
      }
    }
    // Use length instead of array to avoid re-renders when array reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingMode, initialPendingVenues.length, venueTypes.length]);

  const fetchVenues = async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const endpoint = `/api/admin/${propertyType}s/${propertyId}/venues`;
      const response = await api.get(endpoint);
      if (response.ok) {
        const data: Venue[] = await response.json();
        // Enrich venues with venueTypeName for display
        // Use a ref or get the current venueTypes to avoid stale closure
        setVenues(prevVenues => {
          // Get current venueTypes from state by using a function that reads current state
          return data.map(venue => ({
            ...venue,
            venueTypeName:
              venueTypes.find(type => type.id === venue.venueTypeId)?.name || 'Unknown Type',
          }));
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load venues',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueTypes = async () => {
    try {
      const response = await api.get('/api/venue-types');
      if (response.ok) {
        const data = await response.json();
        setVenueTypes(data);
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to load venue types',
      });
    }
  };

  const handleAddVenue = async () => {
    if (!newVenueName.trim() || !selectedTypeId) {
      toast.error('Validation Error', {
        description: 'Please fill in venue name and select a type',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newVenueData = {
        name: newVenueName.trim(),
        venueTypeId: selectedTypeId,
      };

      if (pendingMode) {
        const newPendingVenue: Venue = {
          id: -(venues.length + 1), // Negative ID for pending venue
          ...newVenueData,
          venueTypeName:
            venueTypes.find(type => type.id === selectedTypeId)?.name || 'Unknown Type',
        };
        const updatedVenues = [...venues, newPendingVenue];
        setVenues(updatedVenues);
        if (onPendingVenuesChange) {
          onPendingVenuesChange(
            updatedVenues.map(v => ({
              name: v.name,
              venueTypeId: v.venueTypeId,
              description: v.description,
            }))
          );
        }
        toast.success('Success', {
          description: 'Venue added (will be saved when you create the ship/resort)',
        });
      } else {
        const endpoint = `/api/admin/${propertyType}s/${propertyId}/venues`;
        const createResponse = await api.post(endpoint, newVenueData);

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData?.error?.message || 'Failed to create venue');
        }

        // Refresh venues list first
        await fetchVenues();
        toast.success('Success', {
          description: 'Venue created successfully',
        });
        // Call onSuccess after a brief delay to let the modal update
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 100);
        }
      }

      setNewVenueName('');
      setSelectedTypeId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add venue';
      toast.error('Error', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (venue: Venue) => {
    setVenueToDelete(venue);
  };

  const handleConfirmDelete = async () => {
    if (!venueToDelete) return;

    setIsSubmitting(true);
    try {
      if (pendingMode) {
        const updatedVenues = venues.filter(v => v.id !== venueToDelete.id);
        setVenues(updatedVenues);
        if (onPendingVenuesChange) {
          onPendingVenuesChange(
            updatedVenues.map(v => ({
              name: v.name,
              venueTypeId: v.venueTypeId,
              description: v.description,
            }))
          );
        }
        toast.success('Success', {
          description: 'Venue removed',
        });
      } else {
        const endpoint = `/api/admin/${propertyType}s/${propertyId}/venues/${venueToDelete.id}`;
        const response = await api.delete(endpoint);

        if (!response.ok) {
          throw new Error('Failed to delete venue');
        }

        // Refresh venues list first
        await fetchVenues();
        toast.success('Success', {
          description: 'Venue deleted successfully',
        });
        // Call onSuccess after a brief delay to let the modal update
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 100);
        }
      }
      setVenueToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete venue';
      toast.error('Error', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group venues by type for the Accordion
  const groupedVenues = venues.reduce(
    (acc, venue) => {
      const typeName = venue.venueTypeName || 'Uncategorized';
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(venue);
      return acc;
    },
    {} as Record<string, Venue[]>
  );

  return (
    <AdminBottomSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Manage Venues"
      description={`Add or remove venues for this ${propertyType}`}
      icon={<MapPin className="h-5 w-5 text-cyan-400" />}
      primaryAction={{
        label: 'Done',
        onClick: () => onOpenChange(false),
      }}
      maxWidthClassName="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Add New Venue Section */}
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Add New Venue
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <Input
                id="venueName"
                value={newVenueName}
                onChange={e => setNewVenueName(e.target.value)}
                placeholder="e.g., Main Dining Room"
                className="bg-white/5 border-white/10 text-white"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVenue();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueType">Venue Type</Label>
              <StandardDropdown
                variant="single-search"
                placeholder="Select type..."
                searchPlaceholder="Search types..."
                emptyMessage="No types found"
                options={venueTypes.map(type => ({
                  value: type.id.toString(),
                  label: type.name,
                }))}
                value={selectedTypeId?.toString() || ''}
                onChange={value => setSelectedTypeId(Number(value))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleAddVenue}
              disabled={!newVenueName.trim() || !selectedTypeId || isSubmitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add Venue'}
            </Button>
          </div>
        </div>

        {/* Venues List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/90 px-1">Current Venues</h3>

          {loading ? (
            <div className="text-center py-8 text-white/60">Loading venues...</div>
          ) : Object.keys(groupedVenues).length === 0 ? (
            <div className="text-center py-8 text-white/50 bg-white/[0.02] rounded-lg border border-white/5">
              No venues added yet. Add one above to get started.
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {Object.entries(groupedVenues).map(([type, typeVenues]) => (
                <AccordionItem
                  key={type}
                  value={type}
                  className="border border-white/10 rounded-lg bg-white/[0.02] overflow-hidden px-0"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-white/[0.04] hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <span>{type}</span>
                      <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                        {typeVenues.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    <div className="divide-y divide-white/5">
                      {typeVenues.map(venue => (
                        <div
                          key={venue.id}
                          className="flex items-center justify-between p-3 pl-4 hover:bg-white/[0.02] transition-colors group"
                        >
                          <span className="text-sm text-white/80">{venue.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(venue)}
                            className="h-8 w-8 p-0 text-white/30 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!venueToDelete} onOpenChange={open => !open && setVenueToDelete(null)}>
          <DialogContent className="sm:max-w-[425px] bg-[#002147] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Delete Venue
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Are you sure you want to delete "{venueToDelete?.name}"? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => setVenueToDelete(null)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminBottomSheet>
  );
}
