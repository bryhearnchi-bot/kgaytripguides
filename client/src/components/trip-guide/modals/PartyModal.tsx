import React, { memo, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { DailyEvent } from "@/data/trip-data";
import { useTimeFormat } from "@/contexts/TimeFormatContext";
import { formatTime } from "@/lib/timeFormat";

interface PartyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedParty: (DailyEvent & {
    imageUrl?: string;
    description?: string;
    dressCode?: string;
    theme?: {
      desc?: string;
      shortDesc?: string;
    };
  }) | null;
}

export const PartyModal = memo(function PartyModal({
  open,
  onOpenChange,
  selectedParty
}: PartyModalProps) {
  const { timeFormat } = useTimeFormat();

  // Determine party description - prefer theme description if available
  const partyDescription = useMemo(() => {
    if (!selectedParty) return null;
    return selectedParty.theme?.desc || selectedParty.description;
  }, [selectedParty]);

  if (!selectedParty) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedParty.title}
          </DialogTitle>
          <DialogDescription>
            Party details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Party Image */}
            {selectedParty.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={selectedParty.imageUrl}
                  alt={selectedParty.title}
                  className="w-32 h-32 rounded-md object-cover mx-auto lg:mx-0"
                  loading="lazy"
                />
              </div>
            )}

            {/* Party Details */}
            <div className="flex-1 text-center lg:text-left space-y-2 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                <Badge variant="secondary" className="bg-ocean-100 text-ocean-700">
                  <span className="break-words">{selectedParty.venue}</span>
                </Badge>
                {selectedParty.time && (
                  <span className="text-ocean-600 font-medium break-words">
                    {formatTime(selectedParty.time, timeFormat)}
                  </span>
                )}
              </div>

              {/* Party Description */}
              {partyDescription && (
                <p className="text-gray-700 leading-relaxed break-words">
                  {partyDescription}
                </p>
              )}

              {/* Dress Code */}
              {selectedParty.dressCode && (
                <div>
                  <span className="font-medium text-gray-900">Dress Code: </span>
                  <span className="text-gray-700 break-words">{selectedParty.dressCode}</span>
                </div>
              )}

              {/* Party Theme Info */}
              {selectedParty.theme?.shortDesc && selectedParty.theme.shortDesc !== partyDescription && (
                <div className="mt-2 p-3 bg-ocean-50 rounded-md">
                  <p className="text-sm text-ocean-700 break-words">
                    {selectedParty.theme.shortDesc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});