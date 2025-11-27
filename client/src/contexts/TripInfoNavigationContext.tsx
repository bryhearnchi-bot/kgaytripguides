import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface TripInfoNavigationContextType {
  // Modal state
  showAddSectionModal: boolean;
  setShowAddSectionModal: (show: boolean) => void;
}

const TripInfoNavigationContext = createContext<TripInfoNavigationContextType | null>(null);

export function TripInfoNavigationProvider({ children }: { children: ReactNode }) {
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  const value = useMemo(
    () => ({
      showAddSectionModal,
      setShowAddSectionModal,
    }),
    [showAddSectionModal]
  );

  return (
    <TripInfoNavigationContext.Provider value={value}>
      {children}
    </TripInfoNavigationContext.Provider>
  );
}

export function useTripInfoNavigation() {
  const context = useContext(TripInfoNavigationContext);
  if (!context) {
    throw new Error('useTripInfoNavigation must be used within a TripInfoNavigationProvider');
  }
  return context;
}
