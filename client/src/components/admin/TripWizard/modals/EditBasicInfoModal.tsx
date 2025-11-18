import { useState, useEffect } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StandardDropdown } from '@/components/ui/dropdowns';
import type { DropdownOption } from '@/components/ui/dropdowns';
import { DatePicker } from '@/components/ui/date-picker';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { api } from '@/lib/api-client';
import { Ship, Calendar, FileText } from 'lucide-react';

// Admin modal field styles - matches AdminFormModal
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

interface CharterCompany {
  id: number;
  name: string;
}

interface TripType {
  id: number;
  trip_type: string;
}

interface EditBasicInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBasicInfoModal({ open, onOpenChange }: EditBasicInfoModalProps) {
  const { state, updateTripData, setTripType } = useTripWizard();
  const [charterCompanies, setCharterCompanies] = useState<CharterCompany[]>([]);
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState(true);

  // Local state for form
  const [formData, setFormData] = useState({
    charterCompanyId: state.tripData.charterCompanyId,
    tripTypeId: state.tripData.tripTypeId,
    name: state.tripData.name || '',
    slug: state.tripData.slug || '',
    startDate: state.tripData.startDate || '',
    endDate: state.tripData.endDate || '',
    heroImageUrl: state.tripData.heroImageUrl || '',
    description: state.tripData.description || '',
    highlights: state.tripData.highlights || '',
  });

  useEffect(() => {
    loadLookupData();
  }, []);

  useEffect(() => {
    if (open) {
      // Reset form data when modal opens
      setFormData({
        charterCompanyId: state.tripData.charterCompanyId,
        tripTypeId: state.tripData.tripTypeId,
        name: state.tripData.name || '',
        slug: state.tripData.slug || '',
        startDate: state.tripData.startDate || '',
        endDate: state.tripData.endDate || '',
        heroImageUrl: state.tripData.heroImageUrl || '',
        description: state.tripData.description || '',
        highlights: state.tripData.highlights || '',
      });
    }
  }, [open, state.tripData]);

  const loadLookupData = async () => {
    try {
      setLoading(true);
      const [companiesRes, typesRes] = await Promise.all([
        api.get('/api/admin/lookup-tables/charter-companies'),
        api.get('/api/admin/lookup-tables/trip-types'),
      ]);

      if (companiesRes.ok && typesRes.ok) {
        const companiesData = await companiesRes.json();
        const typesData = await typesRes.json();
        setCharterCompanies(companiesData.items || []);
        setTripTypes(typesData.items || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const formatDateForStorage = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinimumEndDate = (): Date | undefined => {
    if (!formData.startDate) return undefined;
    const startDate = new Date(formData.startDate);
    const minEndDate = new Date(startDate);
    minEndDate.setDate(minEndDate.getDate() + 1);
    return minEndDate;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleTripTypeChange = (tripTypeId: string) => {
    setFormData(prev => ({ ...prev, tripTypeId: Number(tripTypeId) }));

    // Find the trip type and set it in context
    const selectedType = tripTypes.find(t => t.id === Number(tripTypeId));
    if (selectedType) {
      const type = selectedType.trip_type.toLowerCase() as 'resort' | 'cruise';
      setTripType(type);
    }
  };

  const handleSave = () => {
    // Update context with form data
    updateTripData(formData);
    onOpenChange(false);
  };

  return (
    <>
      <style>{modalFieldStyles}</style>
      <AdminBottomSheet
        isOpen={open}
        onOpenChange={onOpenChange}
        title="Edit Basic Information"
        description="Edit trip basic information"
        icon={<FileText className="h-5 w-5 text-white" />}
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
        maxWidthClassName="max-w-3xl"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Left Column */}
                <div className="space-y-2.5">
                  {/* Charter Company */}
                  <StandardDropdown
                    variant="single-search"
                    label="Charter Company"
                    placeholder="Select a charter company"
                    emptyMessage="No charter company found."
                    options={charterCompanies.map(company => ({
                      value: company.id.toString(),
                      label: company.name,
                    }))}
                    value={formData.charterCompanyId?.toString() || ''}
                    onChange={value =>
                      setFormData(prev => ({ ...prev, charterCompanyId: Number(value) }))
                    }
                    required
                  />

                  {/* Trip Type */}
                  <div className="space-y-1">
                    <StandardDropdown
                      variant="single-search"
                      label="Trip Type"
                      placeholder="Select a trip type"
                      emptyMessage="No trip type found."
                      options={tripTypes.map(type => ({
                        value: type.id.toString(),
                        label: type.trip_type,
                        icon: type.trip_type.toLowerCase() === 'cruise' ? Ship : Calendar,
                      }))}
                      value={formData.tripTypeId?.toString() || ''}
                      onChange={handleTripTypeChange}
                      required
                    />
                    {state.tripType && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
                        {state.tripType === 'cruise' ? (
                          <Ship className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Calendar className="w-3 h-3 text-cyan-400" />
                        )}
                        <span className="text-[10px] text-cyan-400 font-medium">
                          {state.tripType === 'cruise' ? 'Cruise' : 'Resort'} trip selected
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Trip Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/90">Trip Name *</label>
                    <Input
                      placeholder="Enter trip name"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                    />
                    {formData.slug && (
                      <p className="text-[10px] text-white/50 mt-0.5">
                        URL: /trip-guide/{formData.slug}
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/90">Start Date *</label>
                      <DatePicker
                        value={formData.startDate}
                        onChange={date => {
                          const newStartDate = date ? formatDateForStorage(date) : '';

                          // Clear end date if it's now invalid
                          if (formData.endDate && newStartDate) {
                            const startDateObj = new Date(newStartDate);
                            const endDateObj = new Date(formData.endDate);

                            if (endDateObj <= startDateObj) {
                              setFormData(prev => ({
                                ...prev,
                                startDate: newStartDate,
                                endDate: '',
                              }));
                              return;
                            }
                          }

                          setFormData(prev => ({ ...prev, startDate: newStartDate }));
                        }}
                        placeholder="Pick start date"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/90">End Date *</label>
                      <DatePicker
                        value={formData.endDate}
                        onChange={date =>
                          setFormData(prev => ({
                            ...prev,
                            endDate: date ? formatDateForStorage(date) : '',
                          }))
                        }
                        placeholder="Pick end date"
                        disabled={!formData.startDate}
                        fromDate={getMinimumEndDate()}
                      />
                      {formData.startDate && (
                        <p className="text-[10px] text-white/50 mt-0.5">
                          Must be at least one day after start date
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2.5">
                  {/* Hero Image */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/90">
                      Trip Cover Image *
                    </label>
                    <ImageUploadField
                      label="Trip Cover Image"
                      value={formData.heroImageUrl}
                      onChange={url => setFormData(prev => ({ ...prev, heroImageUrl: url || '' }))}
                      imageType="general"
                      placeholder="No cover image uploaded"
                      className="admin-form-modal"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/90">Description *</label>
                    <Textarea
                      placeholder="Enter trip description..."
                      value={formData.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                    />
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/90">Highlights</label>
                    <Textarea
                      placeholder="Enter trip highlights (one per line)..."
                      value={formData.highlights}
                      onChange={e => handleInputChange('highlights', e.target.value)}
                      rows={2}
                      className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                    />
                    <p className="text-[10px] text-white/50 mt-0.5">
                      Enter each highlight on a new line
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </AdminBottomSheet>
    </>
  );
}
