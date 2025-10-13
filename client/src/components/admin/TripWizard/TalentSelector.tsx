import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
import {
  MultiSelectWithCreate,
  MultiSelectItem,
  type MultiSelectMenuVariant,
} from '../MultiSelectWithCreate';
import { AlertCircle, User, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OceanInput } from '@/components/ui/ocean-input';
import { OceanTextarea } from '@/components/ui/ocean-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// Trip Wizard style guide for modal inputs
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
    font-family: inherit;
    line-height: 1.375;
  }
  .admin-form-modal input::placeholder,
  .admin-form-modal textarea::placeholder,
  .admin-form-modal select::placeholder {
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
  .admin-form-modal label {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 4px;
    display: block;
  }
`;

interface Talent {
  id: number;
  name: string;
  talentCategoryId: number;
  talentCategoryName?: string;
  bio?: string;
  knownFor?: string;
  profileImageUrl?: string;
  socialLinks?: Record<string, string>;
  website?: string;
}

interface TalentCategory {
  id: number;
  name: string;
}

interface TalentSelectorProps {
  tripId: number;
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  disabled?: boolean;
  className?: string;
  menuVariant?: MultiSelectMenuVariant;
  wizardMode?: boolean;
  container?: HTMLElement;
}

export function TalentSelector({
  tripId,
  selectedIds,
  onSelectionChange,
  disabled = false,
  className,
  menuVariant = 'compact',
  wizardMode = false,
  container,
}: TalentSelectorProps) {
  const [talent, setTalent] = useState<Talent[]>([]);
  const [talentCategories, setTalentCategories] = useState<TalentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const fetchedIdsRef = useRef<Set<number>>(new Set());

  const [formData, setFormData] = useState({
    name: '',
    talentCategoryId: '',
    bio: '',
    knownFor: '',
    profileImageUrl: '',
    instagram: '',
    twitter: '',
    facebook: '',
    website: '',
  });

  useEffect(() => {
    if (!wizardMode) {
      fetchAllTalent(); // Fetch ALL talent, not just trip talent
    }
    fetchTalentCategories();
  }, [tripId, wizardMode]);

  // In wizard mode, fetch only selected talent on demand
  useEffect(() => {
    if (wizardMode && selectedIds.length > 0) {
      const newIds = selectedIds.filter(id => !fetchedIdsRef.current.has(id));
      if (newIds.length > 0) {
        fetchSelectedTalent(newIds);
      }
    }
  }, [selectedIds, wizardMode]);

  const fetchAllTalent = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch ALL talent from the global talent table, not just trip talent
      const response = await api.get('/api/admin/talent');
      const data = await response.json();
      // Ensure data is an array
      const talentArray = Array.isArray(data) ? data : [];
      setTalent(talentArray);
      talentArray.forEach((t: Talent) => fetchedIdsRef.current.add(t.id));
    } catch (err) {
      setTalent([]); // Set empty array on error
      setError('Failed to load talent');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedTalent = async (ids: number[]) => {
    try {
      const promises = ids.map(id => api.get(`/api/admin/talent/${id}`));
      const responses = await Promise.all(promises);
      const fetchedTalent = await Promise.all(responses.map(r => r.json()));

      setTalent(prev => {
        const existing = new Map(prev.map(t => [t.id, t]));
        fetchedTalent.forEach(t => {
          existing.set(t.id, t);
          fetchedIdsRef.current.add(t.id);
        });
        return Array.from(existing.values());
      });
    } catch (err) {}
  };

  const fetchTalentCategories = async () => {
    try {
      const response = await api.get('/api/admin/talent-categories');
      const data = await response.json();
      // Ensure data is an array
      setTalentCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setTalentCategories([]); // Set empty array on error
    }
  };

  const handleCreateTalent = async () => {
    if (!formData.name.trim() || !formData.talentCategoryId) {
      toast({
        title: 'Validation Error',
        description: 'Name and talent category are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);

      // Create talent
      const talentResponse = await api.post('/api/admin/talent', {
        name: formData.name,
        talentCategoryId: parseInt(formData.talentCategoryId),
        bio: formData.bio || undefined,
        knownFor: formData.knownFor || undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
        socialLinks: {
          instagram: formData.instagram || undefined,
          twitter: formData.twitter || undefined,
          facebook: formData.facebook || undefined,
        },
        website: formData.website || undefined,
      });

      const newTalent = await talentResponse.json();

      // Add talent to trip
      await api.post(`/api/admin/trips/${tripId}/talent`, {
        talentIds: [newTalent.id],
      });

      // Add to local state
      setTalent(prev => [...prev, newTalent]);
      fetchedIdsRef.current.add(newTalent.id);

      // Auto-select
      onSelectionChange([...selectedIds, newTalent.id]);

      toast({
        title: 'Success',
        description: 'Talent created and added to trip',
      });

      setShowCreateModal(false);
      setFormData({
        name: '',
        talentCategoryId: '',
        bio: '',
        knownFor: '',
        profileImageUrl: '',
        instagram: '',
        twitter: '',
        facebook: '',
        website: '',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create talent',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSelectionChange = (newSelectedIds: (number | string)[]) => {
    const numericIds = newSelectedIds.map(id => (typeof id === 'string' ? parseInt(id) : id));
    onSelectionChange(numericIds);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  // Convert to MultiSelectItem format
  const items: MultiSelectItem[] = talent.map(t => ({
    id: t.id,
    name: `${t.name}${t.talentCategoryName ? ` • ${t.talentCategoryName}` : ''}`,
  }));

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading talent</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAllTalent}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{modalFieldStyles}</style>
      <MultiSelectWithCreate
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onCreate={handleCreate}
        createButtonText="Add New Talent"
        placeholder="Select talent..."
        disabled={disabled || loading}
        menuVariant={menuVariant}
        className={className}
        container={container}
      />

      {/* Create Talent Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-lg border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Create New Talent
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Name <span className="text-cyan-400">*</span>
              </label>
              <OceanInput
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., RuPaul, Lady Bunny"
                className="h-10"
              />
            </div>

            {/* Talent Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Talent Category <span className="text-cyan-400">*</span>
              </label>
              <Select
                value={formData.talentCategoryId}
                onValueChange={val => setFormData({ ...formData, talentCategoryId: val })}
              >
                <SelectTrigger className="h-10 bg-white/[0.04] border-[1.5px] border-white/8 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a1628] border-white/10">
                  {talentCategories.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)} className="text-white">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Known For */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Known For</label>
              <OceanInput
                value={formData.knownFor}
                onChange={e => setFormData({ ...formData, knownFor: e.target.value })}
                placeholder="e.g., Winner of RuPaul's Drag Race Season 5"
                className="h-10"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Bio</label>
              <OceanTextarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief biography..."
                rows={3}
              />
            </div>

            {/* Profile Image URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Profile Image URL</label>
              <OceanInput
                value={formData.profileImageUrl}
                onChange={e => setFormData({ ...formData, profileImageUrl: e.target.value })}
                placeholder="https://..."
                className="h-10"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/90">Social Links</label>
              <div className="space-y-2">
                <OceanInput
                  value={formData.instagram}
                  onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="Instagram handle (without @)"
                  className="h-10"
                />
                <OceanInput
                  value={formData.twitter}
                  onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="Twitter/X handle (without @)"
                  className="h-10"
                />
                <OceanInput
                  value={formData.facebook}
                  onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="Facebook profile URL"
                  className="h-10"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Website</label>
              <OceanInput
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="h-10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/90 hover:bg-white/10 hover:text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTalent}
              disabled={creating}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Create Talent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
