import { useState, useEffect, useRef } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { DatePicker } from '@/components/ui/date-picker';
import type { ScheduleEntry } from '@/contexts/TripWizardContext';
import { Calendar, Plus } from 'lucide-react';

const modalFieldStyles = `
  .admin-form-modal input,
  .admin-form-modal select,
  .admin-form-modal textarea {
    height: 40px;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: white;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .admin-form-modal textarea {
    height: auto;
    padding: 8px 12px;
    resize: vertical;
    line-height: 1.375;
  }
  .admin-form-modal input::placeholder,
  .admin-form-modal textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .admin-form-modal input:focus,
  .admin-form-modal select:focus,
  .admin-form-modal textarea:focus {
    outline: none !important;
    border-color: rgba(34, 211, 238, 0.6) !important;
    background: rgba(34, 211, 238, 0.03) !important;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.08) !important;
  }
`;

interface EditResortScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditResortScheduleModal({ open, onOpenChange }: EditResortScheduleModalProps) {
  const { state, setScheduleEntries } = useTripWizard();

  // Local state for form - deep copy of schedule entries
  const [formData, setFormData] = useState<ScheduleEntry[]>([]);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [addDayType, setAddDayType] = useState<'before' | 'after' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const entriesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Reset form data when modal opens - deep copy
      setFormData(JSON.parse(JSON.stringify(state.scheduleEntries)));
    }
  }, [open, state.scheduleEntries]);

  const formatDate = (dateString: string) => {
    // Parse in local timezone to avoid UTC conversion
    const parts = dateString.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleImageUpload = (index: number, url: string) => {
    setFormData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], imageUrl: url };
      return updated;
    });
  };

  const handleDescriptionChange = (index: number, description: string) => {
    setFormData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description };
      return updated;
    });
  };

  // Helper to parse date string in local timezone (not UTC)
  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    return new Date(year, month - 1, day);
  };

  const handleAddDay = () => {
    if (!selectedDate || !addDayType || !state.tripData.startDate || !state.tripData.endDate)
      return;

    // Check for duplicate date
    const dateExists = formData.some(entry => entry.date === selectedDate);
    if (dateExists) {
      alert('This date has already been added to the schedule.');
      return;
    }

    // Calculate day number based on date difference
    let newDayNumber: number;
    const selectedDateObj = parseDateString(selectedDate);

    if (addDayType === 'before') {
      // Pre-trip days: calculate days before start date
      const startDateObj = parseDateString(state.tripData.startDate);
      const daysDiff = Math.floor(
        (startDateObj.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      newDayNumber = -daysDiff; // e.g., 1 day before = -1, 2 days before = -2
    } else {
      // Post-trip days: calculate days after end date
      const endDateObj = parseDateString(state.tripData.endDate);
      const daysDiff = Math.floor(
        (selectedDateObj.getTime() - endDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      newDayNumber = 100 + daysDiff - 1; // e.g., 1 day after = 100, 2 days after = 101
    }

    // Add the new entry
    const newEntry: ScheduleEntry = {
      dayNumber: newDayNumber,
      date: selectedDate,
      imageUrl: '',
      description: '',
    };

    setFormData(prev => [...prev, newEntry]);

    // Reset modal first
    setShowAddDayModal(false);
    setSelectedDate('');
    const typeToScroll = addDayType;
    setAddDayType(null);

    // Scroll to the appropriate position after adding
    setTimeout(() => {
      if (entriesContainerRef.current) {
        if (typeToScroll === 'before') {
          // Scroll to top for pre-trip days
          entriesContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Scroll to bottom for post-trip days
          entriesContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }, 150);
  };

  const getMinMaxDates = () => {
    if (!state.tripData.startDate || !state.tripData.endDate || !addDayType) {
      return { minDate: undefined, maxDate: undefined };
    }

    // Parse dates in local timezone to avoid UTC conversion
    const startDate = parseDateString(state.tripData.startDate);
    const endDate = parseDateString(state.tripData.endDate);

    if (addDayType === 'before') {
      // Allow dates up to one day before trip start
      const maxDate = new Date(startDate);
      maxDate.setDate(maxDate.getDate() - 1);
      return { minDate: undefined, maxDate };
    } else {
      // Allow dates starting one day after trip end
      const minDate = new Date(endDate);
      minDate.setDate(minDate.getDate() + 1);
      return { minDate, maxDate: undefined };
    }
  };

  const handleSave = () => {
    // Update context with form data
    setScheduleEntries(formData);
    onOpenChange(false);
  };

  // Sort entries by date for display
  const sortedEntries = [...formData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      <style>{modalFieldStyles}</style>
      <AdminBottomSheet
        isOpen={open}
        onOpenChange={onOpenChange}
        title="Edit Resort Schedule"
        description="Edit resort schedule"
        icon={<Calendar className="h-5 w-5 text-white" />}
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        primaryAction={{
          label: 'Save Changes',
          type: 'submit',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => onOpenChange(false),
        }}
        maxWidthClassName="max-w-5xl"
      >
        <div className="space-y-2.5 py-4" ref={entriesContainerRef}>
          {formData.length === 0 ? (
            <div className="p-4 rounded-lg bg-cyan-400/5 border border-cyan-400/20 text-center">
              <p className="text-sm text-white/70">
                No schedule entries found. Please ensure trip dates are set on the Basic Info page.
              </p>
            </div>
          ) : (
            <>
              {/* Schedule Entries */}
              {sortedEntries.map(entry => {
                const index = formData.findIndex(
                  e => e.date === entry.date && e.dayNumber === entry.dayNumber
                );
                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-white/10 bg-white/[0.02] transition-all hover:border-white/20"
                  >
                    {/* Day Header */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold text-cyan-400">
                        {entry.dayNumber < 1
                          ? 'Pre-Trip'
                          : entry.dayNumber >= 100
                            ? 'Post-Trip'
                            : `Day ${entry.dayNumber}`}
                      </span>
                      <span className="text-xs text-white/60">{formatDate(entry.date)}</span>
                    </div>

                    {/* Fields Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Image Upload */}
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-white/90">
                          Day Image (Optional)
                        </Label>
                        <ImageUploadField
                          label=""
                          value={entry.imageUrl || ''}
                          onChange={url => handleImageUpload(index, url || '')}
                          imageType="general"
                        />
                        <p className="text-[10px] text-white/50 mt-0.5">
                          Fun image for this day's activities
                        </p>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-white/90">
                          Description <span className="text-cyan-400">*</span>
                        </Label>
                        <Textarea
                          placeholder={`Enter what happens on Day ${entry.dayNumber}...`}
                          value={entry.description}
                          onChange={e => handleDescriptionChange(index, e.target.value)}
                          rows={4}
                          className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                        />
                        <p className="text-[10px] text-white/50 mt-0.5">
                          High-level description of activities and events
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Day Button */}
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  onClick={() => setShowAddDayModal(true)}
                  className="flex items-center gap-1.5 h-10 px-4 bg-cyan-400/10 border border-cyan-400/30 rounded-[10px] text-cyan-400 text-sm font-medium hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Day
                </Button>
              </div>
            </>
          )}
        </div>
      </AdminBottomSheet>

      {/* Add Day Modal */}
      <AdminBottomSheet
        isOpen={showAddDayModal}
        onOpenChange={setShowAddDayModal}
        title="Add Additional Day"
        description="Add a day before or after the trip"
        icon={<Plus className="h-5 w-5 text-white" />}
        onSubmit={e => {
          e.preventDefault();
          handleAddDay();
        }}
        primaryAction={{
          label: 'Add Day',
          type: 'submit',
          disabled: !selectedDate || !addDayType,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => {
            setShowAddDayModal(false);
            setSelectedDate('');
            setAddDayType(null);
          },
        }}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4 py-4">
          {/* Day Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/90">When is this day?</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddDayType('before')}
                className={`flex-1 h-10 px-3 rounded-[10px] text-sm font-medium transition-all ${
                  addDayType === 'before'
                    ? 'bg-cyan-400/20 border-[1.5px] border-cyan-400/60 text-cyan-400'
                    : 'bg-white/[0.04] border-[1.5px] border-white/8 text-white/70 hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                Before Trip
              </button>
              <button
                type="button"
                onClick={() => setAddDayType('after')}
                className={`flex-1 h-10 px-3 rounded-[10px] text-sm font-medium transition-all ${
                  addDayType === 'after'
                    ? 'bg-cyan-400/20 border-[1.5px] border-cyan-400/60 text-cyan-400'
                    : 'bg-white/[0.04] border-[1.5px] border-white/8 text-white/70 hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                After Trip
              </button>
            </div>
            <p className="text-[10px] text-white/50 mt-0.5">
              {addDayType === 'before'
                ? 'Select a date before your trip starts'
                : addDayType === 'after'
                  ? 'Select a date after your trip ends'
                  : 'Choose whether this day is before or after the main trip dates'}
            </p>
          </div>

          {/* Date Selection */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-white/90">Date</Label>
            <DatePicker
              value={selectedDate}
              onChange={date => {
                if (date) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  setSelectedDate(`${year}-${month}-${day}`);
                } else {
                  setSelectedDate('');
                }
              }}
              placeholder="Select date"
              disabled={!addDayType}
              disabledDates={date => {
                // Check if this date already exists in schedule entries
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                return formData.some(entry => entry.date === dateString);
              }}
              {...(addDayType === 'before'
                ? { toDate: getMinMaxDates().maxDate }
                : addDayType === 'after'
                  ? { fromDate: getMinMaxDates().minDate }
                  : {})}
            />
            {!addDayType && (
              <p className="text-[10px] text-white/50 mt-0.5">
                Please select when this day occurs first
              </p>
            )}
          </div>
        </div>
      </AdminBottomSheet>
    </>
  );
}
