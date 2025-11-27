import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import type { TripTalent } from '@/types/wizard';

interface TalentNavigationContextType {
  // Filter state
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (category: string) => void;

  // Modal state
  showAddTalentModal: boolean;
  setShowAddTalentModal: (show: boolean) => void;

  // Computed values
  categoryFilterOptions: { value: string; label: string }[];
  filteredTalent: TripTalent[];
  totalTalent: number;
}

const TalentNavigationContext = createContext<TalentNavigationContextType | null>(null);

export function TalentNavigationProvider({ children }: { children: ReactNode }) {
  const { state } = useTripWizard();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [showAddTalentModal, setShowAddTalentModal] = useState(false);

  // Get talent from state
  const tripTalent = useMemo(() => {
    return Array.isArray(state.tripTalent) ? state.tripTalent : [];
  }, [state.tripTalent]);

  // Build filter options for PillDropdown
  const categoryFilterOptions = useMemo(() => {
    const categoryCounts: { [category: string]: number } = {};
    tripTalent.forEach(t => {
      const category = t.talentCategoryName || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const options = [
      { value: 'all', label: `All Talent (${tripTalent.length})` },
      ...Object.entries(categoryCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, count]) => ({
          value: category,
          label: `${category} (${count})`,
        })),
    ];

    return options;
  }, [tripTalent]);

  // Filter talent by selected category
  const filteredTalent = useMemo(() => {
    if (selectedCategoryFilter === 'all') {
      return [...tripTalent].sort((a, b) => a.name.localeCompare(b.name));
    }
    return tripTalent
      .filter(t => (t.talentCategoryName || 'Uncategorized') === selectedCategoryFilter)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tripTalent, selectedCategoryFilter]);

  const totalTalent = tripTalent.length;

  const value = useMemo(
    () => ({
      selectedCategoryFilter,
      setSelectedCategoryFilter,
      showAddTalentModal,
      setShowAddTalentModal,
      categoryFilterOptions,
      filteredTalent,
      totalTalent,
    }),
    [selectedCategoryFilter, showAddTalentModal, categoryFilterOptions, filteredTalent, totalTalent]
  );

  return (
    <TalentNavigationContext.Provider value={value}>{children}</TalentNavigationContext.Provider>
  );
}

export function useTalentNavigation() {
  const context = useContext(TalentNavigationContext);
  if (!context) {
    throw new Error('useTalentNavigation must be used within a TalentNavigationProvider');
  }
  return context;
}
