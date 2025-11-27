import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface FAQNavigationContextType {
  // Modal state
  showAddFAQModal: boolean;
  setShowAddFAQModal: (show: boolean) => void;
}

const FAQNavigationContext = createContext<FAQNavigationContextType | null>(null);

export function FAQNavigationProvider({ children }: { children: ReactNode }) {
  const [showAddFAQModal, setShowAddFAQModal] = useState(false);

  const value = useMemo(
    () => ({
      showAddFAQModal,
      setShowAddFAQModal,
    }),
    [showAddFAQModal]
  );

  return <FAQNavigationContext.Provider value={value}>{children}</FAQNavigationContext.Provider>;
}

export function useFAQNavigation() {
  const context = useContext(FAQNavigationContext);
  if (!context) {
    throw new Error('useFAQNavigation must be used within a FAQNavigationProvider');
  }
  return context;
}
