// Utility functions for trip-related operations

interface TripTypeSetting {
  id: number;
  category: string;
  key: string;
  label: string;
  value: string;
  metadata: {
    buttonText?: string;
    description?: string;
  };
  isActive: boolean;
  orderIndex: number;
}

/**
 * Get the appropriate button text based on trip type
 * @param tripType The trip type (cruise, vacation, event, resort)
 * @param tripTypes Optional array of trip type settings for better performance
 * @returns The button text to display
 */
export function getTripButtonText(tripType?: string, tripTypes?: TripTypeSetting[]): string {
  if (!tripType) {
    return 'View Trip Guide';
  }

  // If trip types are provided, find the matching one
  if (tripTypes) {
    const typeConfig = tripTypes.find(type => type.key === tripType || type.value === tripType);
    if (typeConfig?.metadata?.buttonText) {
      return typeConfig.metadata.buttonText;
    }
  }

  // Fallback mapping for common trip types
  const buttonTextMap: Record<string, string> = {
    cruise: 'View Cruise Guide',
    vacation: 'View Vacation Guide', 
    event: 'View Event Guide',
    resort: 'View Resort Guide'
  };

  return buttonTextMap[tripType] || 'View Trip Guide';
}

/**
 * Get trip type label for display
 * @param tripType The trip type key
 * @param tripTypes Optional array of trip type settings
 * @returns The display label
 */
export function getTripTypeLabel(tripType?: string, tripTypes?: TripTypeSetting[]): string {
  if (!tripType) {
    return 'Trip';
  }

  if (tripTypes) {
    const typeConfig = tripTypes.find(type => type.key === tripType || type.value === tripType);
    if (typeConfig?.label) {
      return typeConfig.label;
    }
  }

  // Fallback - capitalize first letter
  return tripType.charAt(0).toUpperCase() + tripType.slice(1);
}