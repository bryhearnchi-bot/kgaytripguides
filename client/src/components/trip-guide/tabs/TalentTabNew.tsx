import React, { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Sparkles,
  Mic2,
  Music,
  Laugh,
  Disc3,
  Piano,
  Drama,
  Users,
  Crown,
} from 'lucide-react';
import type { Talent } from '@/data/trip-data';
import { TalentCard } from '../shared/TalentCard';

interface TalentTabProps {
  TALENT: Talent[];
  SCHEDULED_DAILY: Array<{
    key: string;
    items: Array<{
      time: string;
      title: string;
      venue: string;
      talent?: Array<{ name: string }>;
      date?: string;
    }>;
  }>;
  onTalentClick: (name: string) => void;
}

export const TalentTabNew = memo(function TalentTabNew({
  TALENT,
  SCHEDULED_DAILY,
  onTalentClick,
}: TalentTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Separate headliners and other talent
  const { headliners, otherTalent } = useMemo(() => {
    const heads: Talent[] = [];
    const others: Talent[] = [];

    TALENT.forEach(talent => {
      // Check if talent's category is "Headliners"
      if (talent.cat === 'Headliners') {
        heads.push(talent);
      } else {
        others.push(talent);
      }
    });

    // Sort headliners alphabetically
    heads.sort((a, b) => a.name.localeCompare(b.name));

    // Sort others alphabetically
    others.sort((a, b) => a.name.localeCompare(b.name));

    return { headliners: heads, otherTalent: others };
  }, [TALENT]);

  // Icon mapping for talent types
  const getTalentIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      All: Users,
      Headliners: Sparkles,
      'Drag & Variety': Crown,
      Vocalists: Mic2,
      Comedy: Laugh,
      "DJ's": Disc3,
      'Piano Bar / Cabaret': Piano,
      Shows: Drama,
    };
    return iconMap[type] || User;
  };

  // Get all unique talent types/categories (including headliners)
  const talentTypes = useMemo(() => {
    const types = new Set<string>();

    // Add other categories (not headliners)
    otherTalent.forEach(talent => {
      if (talent.cat) {
        types.add(talent.cat);
      }
    });

    // Build array with specific order: All, Headliners (if any), then sorted others
    const result = ['All'];
    if (headliners.length > 0) {
      result.push('Headliners');
    }
    result.push(...Array.from(types).sort());

    return result;
  }, [headliners.length, otherTalent]);

  // Filter talent by selected type
  const filteredTalent = useMemo(() => {
    if (selectedFilter === 'All') {
      // When "All" is selected, show headliners first, then other talent alphabetically
      const sortedOthers = [...otherTalent].sort((a, b) => a.name.localeCompare(b.name));
      return [...headliners, ...sortedOthers];
    }
    if (selectedFilter === 'Headliners') {
      // Show only headliners
      return headliners;
    }
    // Show only the selected category (no headliners)
    return otherTalent.filter(talent => talent.cat === selectedFilter);
  }, [headliners, otherTalent, selectedFilter]);

  const handleTalentClick = (talentName: string) => {
    onTalentClick(talentName);
  };

  if (TALENT.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No talent information available</h3>
          <p className="text-white/70">Talent roster will be available soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* Talent Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center mb-6">
          {/* Filter Bar - Left-aligned */}
          <div className="flex flex-wrap gap-2">
            {talentTypes.map(type => {
              const isActive = selectedFilter === type;
              const Icon = getTalentIcon(type);
              const isHeadliners = type === 'Headliners';

              return (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors border flex items-center gap-1 ${
                    isHeadliners
                      ? isActive
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400/50 font-bold shadow-lg'
                        : 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30 hover:bg-yellow-500/30 font-medium'
                      : isActive
                        ? 'bg-purple-400/50 text-white border-purple-300/60 font-bold shadow-lg'
                        : 'bg-purple-500/20 text-purple-200 border-purple-400/30 hover:bg-purple-500/30 font-medium'
                  }`}
                  aria-label={type}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{type}</span>
                  {isActive && (
                    <span className="sm:hidden">
                      {type === 'Piano Bar / Cabaret'
                        ? 'Cabaret'
                        : type === 'Drag & Variety'
                          ? 'Drag'
                          : type}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Talent Grid */}
        {filteredTalent.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
            <User className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/60">No talent found for this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTalent.map((talent, index) => {
              const isHeadliner = talent.cat === 'Headliners';
              const showYellowBorder =
                isHeadliner && (selectedFilter === 'All' || selectedFilter === 'Headliners');
              const useYellowBadge =
                isHeadliner && (selectedFilter === 'All' || selectedFilter === 'Headliners');

              return (
                <motion.div
                  key={`${selectedFilter}-${talent.name}`}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div
                    className={
                      showYellowBorder
                        ? 'rounded-xl border-2 border-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                        : ''
                    }
                  >
                    <TalentCard
                      talent={talent}
                      onClick={() => handleTalentClick(talent.name)}
                      delay={0}
                      categoryIcon={getTalentIcon(talent.cat)}
                      useYellowBadge={useYellowBadge}
                      disableAnimation={true}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
});
