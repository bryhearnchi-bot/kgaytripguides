import { useState, useEffect } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { DatePicker } from '@/components/ui/date-picker';
import { api } from '@/lib/api-client';
import { Ship, Calendar, Building2 } from 'lucide-react';

interface CharterCompany {
  id: number;
  name: string;
}

interface TripType {
  id: number;
  trip_type: string;
}

export function BasicInfoPage() {
  const { state, updateTripData, setTripType } = useTripWizard();
  const [charterCompanies, setCharterCompanies] = useState<CharterCompany[]>([]);
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLookupData();
  }, []);

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
      console.error('Error loading lookup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    updateTripData({ [field]: value });

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      updateTripData({ slug });
    }
  };

  const handleTripTypeChange = (tripTypeId: string) => {
    updateTripData({ tripTypeId: Number(tripTypeId) });

    // Find the trip type and set it in context
    const selectedType = tripTypes.find(t => t.id === Number(tripTypeId));
    if (selectedType) {
      const type = selectedType.trip_type.toLowerCase() as 'resort' | 'cruise';
      setTripType(type);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="space-y-2.5">
          {/* Charter Company */}
          <SingleDropDownNew
            label="Charter Company"
            placeholder="Select a charter company"
            emptyMessage="No charter company found."
            options={charterCompanies.map(company => ({
              value: company.id.toString(),
              label: company.name,
            }))}
            value={state.tripData.charterCompanyId?.toString() || ''}
            onChange={value => updateTripData({ charterCompanyId: Number(value) })}
            required
          />

          {/* Trip Type */}
          <div className="space-y-1">
            <SingleDropDownNew
              label="Trip Type"
              placeholder="Select a trip type"
              emptyMessage="No trip type found."
              options={tripTypes.map(type => ({
                value: type.id.toString(),
                label: type.trip_type,
                icon: type.trip_type.toLowerCase() === 'cruise' ? Ship : Calendar,
              }))}
              value={state.tripData.tripTypeId?.toString() || ''}
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
              value={state.tripData.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
              className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
            {state.tripData.slug && (
              <p className="text-[10px] text-white/50 mt-0.5">
                URL: /trip-guide/{state.tripData.slug}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Start Date *</label>
              <DatePicker
                value={state.tripData.startDate}
                onChange={date =>
                  updateTripData({ startDate: date ? date.toISOString().split('T')[0] : '' })
                }
                placeholder="Pick start date"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">End Date *</label>
              <DatePicker
                value={state.tripData.endDate}
                onChange={date =>
                  updateTripData({ endDate: date ? date.toISOString().split('T')[0] : '' })
                }
                placeholder="Pick end date"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2.5">
          {/* Hero Image */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Trip Cover Image *</label>
            <ImageUploadField
              label="Trip Cover Image"
              value={state.tripData.heroImageUrl || ''}
              onChange={url => updateTripData({ heroImageUrl: url || '' })}
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
              value={state.tripData.description || ''}
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
              value={state.tripData.highlights || ''}
              onChange={e => handleInputChange('highlights', e.target.value)}
              rows={2}
              className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
            <p className="text-[10px] text-white/50 mt-0.5">Enter each highlight on a new line</p>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="mt-2.5 p-2.5 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[10px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span> New trips are automatically set
          to "Upcoming" status and will be visible on the site immediately after creation.
        </p>
      </div>
    </div>
  );
}
