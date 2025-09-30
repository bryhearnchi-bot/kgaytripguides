import { useMemo } from 'react';
import type { Talent } from "@/data/trip-data";

export function useTalentByCategory(TALENT: Talent[]) {
  return useMemo(() => {
    const talentByCategory = TALENT.reduce((acc, talent) => {
      const category = talent.cat || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(talent);
      return acc;
    }, {} as Record<string, typeof TALENT>);

    const sortedCategories = Object.keys(talentByCategory).sort();

    return { talentByCategory, sortedCategories };
  }, [TALENT]);
}