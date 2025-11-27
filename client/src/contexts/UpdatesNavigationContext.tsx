import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface UpdatesNavigationContextType {
  // Modal state
  showAddUpdateModal: boolean;
  setShowAddUpdateModal: (show: boolean) => void;
}

const UpdatesNavigationContext = createContext<UpdatesNavigationContextType | null>(null);

export function UpdatesNavigationProvider({ children }: { children: ReactNode }) {
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);

  const value = useMemo(
    () => ({
      showAddUpdateModal,
      setShowAddUpdateModal,
    }),
    [showAddUpdateModal]
  );

  return (
    <UpdatesNavigationContext.Provider value={value}>{children}</UpdatesNavigationContext.Provider>
  );
}

export function useUpdatesNavigation() {
  const context = useContext(UpdatesNavigationContext);
  if (!context) {
    throw new Error('useUpdatesNavigation must be used within an UpdatesNavigationProvider');
  }
  return context;
}
