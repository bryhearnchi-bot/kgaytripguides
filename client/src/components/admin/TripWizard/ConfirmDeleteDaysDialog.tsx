import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar } from 'lucide-react';
import type { ScheduleEntry, ItineraryEntry } from '@/contexts/TripWizardContext';

interface ConfirmDeleteDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entriesToDelete: (ScheduleEntry | ItineraryEntry)[];
  tripType: 'resort' | 'cruise';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDaysDialog({
  open,
  onOpenChange,
  entriesToDelete,
  tripType,
  onConfirm,
  onCancel,
}: ConfirmDeleteDaysDialogProps) {
  const formatDate = (dateString: string) => {
    const parts = dateString.split('-').map(Number);
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    const date = new Date(year!, month! - 1, day!);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDayLabel = (dayNumber: number) => {
    if (dayNumber < 1) return 'Pre-Trip';
    if (dayNumber >= 100) return 'Post-Trip';
    return `Day ${dayNumber}`;
  };

  const hasData = (entry: ScheduleEntry | ItineraryEntry) => {
    if ('locationName' in entry) {
      // Itinerary entry
      return !!(
        entry.locationName ||
        entry.description ||
        entry.imageUrl ||
        entry.arrivalTime ||
        entry.departureTime ||
        entry.allAboardTime
      );
    } else {
      // Schedule entry
      return !!(entry.description || entry.imageUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a1628] border border-white/10 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <DialogTitle className="text-lg font-semibold text-white">
              Confirm Trip Shortening
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-white/70 mt-2">
            Changing the trip dates will delete the following{' '}
            {tripType === 'resort' ? 'schedule' : 'itinerary'} entries:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto custom-scrollbar">
          {entriesToDelete.map((entry, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-cyan-400">
                      {getDayLabel(entry.dayNumber)}
                    </span>
                    <span className="text-xs text-white/60">{formatDate(entry.date)}</span>
                  </div>
                  {hasData(entry) && (
                    <div className="space-y-1">
                      {'locationName' in entry && entry.locationName && (
                        <p className="text-[10px] text-white/70">
                          <span className="font-semibold">Port:</span> {entry.locationName}
                        </p>
                      )}
                      {entry.description && (
                        <p className="text-[10px] text-white/70 line-clamp-2">
                          <span className="font-semibold">Description:</span> {entry.description}
                        </p>
                      )}
                      {entry.imageUrl && (
                        <p className="text-[10px] text-white/70">
                          <span className="font-semibold">Has image</span>
                        </p>
                      )}
                      {'arrivalTime' in entry &&
                        (entry.arrivalTime || entry.departureTime || entry.allAboardTime) && (
                          <p className="text-[10px] text-white/70">
                            <span className="font-semibold">Has time information</span>
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-[11px] text-yellow-200 leading-relaxed">
            <span className="font-semibold">Warning:</span> This action cannot be undone. All data
            for these days will be permanently deleted.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 bg-white/[0.04] border border-white/10 rounded-[10px] text-white text-sm hover:bg-white/[0.06] transition-all"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-10 px-4 bg-red-500/20 border border-red-500/40 rounded-[10px] text-red-400 text-sm font-medium hover:bg-red-500/30 hover:border-red-500/60 transition-all"
          >
            Delete Days and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
