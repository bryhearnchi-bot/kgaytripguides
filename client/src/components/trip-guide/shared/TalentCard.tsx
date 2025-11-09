import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import type { Talent } from '@/data/trip-data';

interface TalentCardProps {
  talent: Talent;
  onClick: () => void;
  delay?: number;
  categoryIcon?: LucideIcon;
  hideCategoryBadge?: boolean;
  useYellowBadge?: boolean;
  disableAnimation?: boolean;
}

export const TalentCard = memo<TalentCardProps>(function TalentCard({
  talent,
  onClick,
  delay = 0,
  categoryIcon: CategoryIcon,
  hideCategoryBadge = false,
  useYellowBadge = false,
  disableAnimation = false,
}) {
  const cardClassName =
    'group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-white/30';

  const cardContent = (
    <>
      <div className="flex flex-row h-full">
        {/* Left: Artist Image - Square aspect ratio */}
        <div className="relative w-32 sm:w-40 md:w-48 aspect-square flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
          <img
            src={talent.img}
            alt={talent.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
        </div>

        {/* Right: Content */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col min-w-0 relative">
          {/* More Info Button - Top Right */}
          <button className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 rounded-md border border-cyan-400/30 transition-all duration-200 text-xs font-medium group/btn z-10">
            <span>More Info</span>
            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
          </button>

          <div className="flex-1 min-w-0 pr-20">
            {/* Artist Name */}
            <h3 className="text-white font-bold text-base sm:text-lg mb-1.5 sm:mb-2 group-hover:text-ocean-200 transition-colors truncate">
              {talent.name}
            </h3>

            {/* Talent Type Badge - Hide if hideCategoryBadge is true */}
            {!hideCategoryBadge && (
              <div className="mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    useYellowBadge
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400/50'
                      : 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                  }`}
                >
                  {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                  {talent.cat}
                </span>
              </div>
            )}

            {/* Bio - Small font underneath badge */}
            {talent.bio && (
              <p className="text-white/70 text-xs leading-relaxed line-clamp-3 mb-2">
                {talent.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (disableAnimation) {
    return (
      <div onClick={onClick} className={cardClassName}>
        {cardContent}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className={cardClassName}
    >
      {cardContent}
    </motion.div>
  );
});
