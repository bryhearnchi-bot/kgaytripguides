import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PartyThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPartyTheme: {
    id: number;
    name: string;
    longDescription?: string;
    costumeIdeas?: string;
    imageUrl?: string;
  } | null;
}

export const PartyThemeModal = memo(function PartyThemeModal({
  open,
  onOpenChange,
  selectedPartyTheme,
}: PartyThemeModalProps) {
  if (!selectedPartyTheme) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-3xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">{selectedPartyTheme.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Party theme details for {selectedPartyTheme.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Party Theme Info */}
          <div className="flex flex-col md:flex-row-reverse gap-6">
            {/* Party Theme Image - Perfect Square */}
            {selectedPartyTheme.imageUrl && (
              <div className="w-full md:w-64 md:flex-shrink-0">
                <img
                  src={selectedPartyTheme.imageUrl}
                  alt={selectedPartyTheme.name}
                  className="w-full aspect-square object-cover rounded-xl border-2 border-blue-400/30 shadow-lg"
                  loading="lazy"
                />
              </div>
            )}

            {/* Party Theme Details */}
            <div className="flex-1">
              {/* Party Theme Name */}
              <h2 className="text-2xl font-bold mb-4 text-white">{selectedPartyTheme.name}</h2>

              {/* Long Description */}
              {selectedPartyTheme.longDescription && (
                <div className="mb-6">
                  <p className="text-blue-50 text-sm leading-relaxed">
                    {selectedPartyTheme.longDescription}
                  </p>
                </div>
              )}

              {/* Costume Ideas */}
              {selectedPartyTheme.costumeIdeas && (
                <div className="mb-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-3">
                    Costume Ideas
                  </h3>
                  <div className="bg-blue-500/10 backdrop-blur-md rounded-lg p-4 border border-blue-400/20">
                    <p className="text-blue-100 text-sm leading-relaxed">
                      {selectedPartyTheme.costumeIdeas}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
