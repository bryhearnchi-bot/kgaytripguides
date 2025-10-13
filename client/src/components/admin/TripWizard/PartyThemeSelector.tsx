import { useState, useEffect } from 'react';
import { PartyPopper, Plus } from 'lucide-react';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OceanInput } from '@/components/ui/ocean-input';
import { OceanTextarea } from '@/components/ui/ocean-textarea';
import { api } from '@/lib/api-client';
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

interface PartyTheme {
  id: number;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  costumeIdeas?: string;
  imageUrl?: string;
  amazonShoppingListUrl?: string;
}

interface PartyThemeSelectorProps {
  value: number | null;
  onChange: (themeId: number) => void;
  required?: boolean;
  label?: string;
  className?: string;
}

export function PartyThemeSelector({
  value,
  onChange,
  required = false,
  label = 'Party Theme',
  className,
}: PartyThemeSelectorProps) {
  const [themes, setThemes] = useState<PartyTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    costumeIdeas: '',
    imageUrl: '',
    amazonShoppingListUrl: '',
  });

  useEffect(() => {
    fetchPartyThemes();
  }, []);

  const fetchPartyThemes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/party-themes');
      const data = await response.json();
      setThemes(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load party themes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTheme = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Theme name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/api/admin/party-themes', {
        name: formData.name,
        shortDescription: formData.shortDescription || undefined,
        longDescription: formData.longDescription || undefined,
        costumeIdeas: formData.costumeIdeas || undefined,
        imageUrl: formData.imageUrl || undefined,
        amazonShoppingListUrl: formData.amazonShoppingListUrl || undefined,
      });

      const newTheme = await response.json();
      setThemes(prev => [...prev, newTheme]);
      onChange(newTheme.id);

      toast({
        title: 'Success',
        description: 'Party theme created successfully',
      });

      setShowCreateModal(false);
      setFormData({
        name: '',
        shortDescription: '',
        longDescription: '',
        costumeIdeas: '',
        imageUrl: '',
        amazonShoppingListUrl: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create party theme',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Build dropdown options
  const options = [
    {
      value: 'create-new',
      label: '+ Add New Party Theme',
    },
    ...themes.map(theme => ({
      value: String(theme.id),
      label: theme.name,
    })),
  ];

  const handleChange = (selectedValue: string) => {
    if (selectedValue === 'create-new') {
      setShowCreateModal(true);
    } else {
      onChange(parseInt(selectedValue));
    }
  };

  return (
    <>
      <style>{modalFieldStyles}</style>
      <SingleDropDownNew
        label={label}
        placeholder="Select a party theme"
        emptyMessage={loading ? 'Loading themes...' : 'No themes found'}
        options={options}
        value={value ? String(value) : ''}
        onChange={handleChange}
        required={required}
        className={className}
        disabled={loading}
      />

      {/* Create Party Theme Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="admin-form-modal sm:max-w-lg border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-cyan-400" />
              Create New Party Theme
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Theme Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Theme Name <span className="text-cyan-400">*</span>
              </label>
              <OceanInput
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., White Party, Black & White Ball"
                className="h-10"
              />
            </div>

            {/* Short Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Short Description</label>
              <OceanInput
                value={formData.shortDescription}
                onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief theme description (1-2 sentences)"
                className="h-10"
              />
              <p className="text-[10px] text-white/50">Max 200 characters</p>
            </div>

            {/* Long Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Long Description</label>
              <OceanTextarea
                value={formData.longDescription}
                onChange={e => setFormData({ ...formData, longDescription: e.target.value })}
                placeholder="Detailed theme description, history, expectations..."
                rows={4}
              />
            </div>

            {/* Costume Ideas */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Costume Ideas</label>
              <OceanTextarea
                value={formData.costumeIdeas}
                onChange={e => setFormData({ ...formData, costumeIdeas: e.target.value })}
                placeholder="Suggested outfits, accessories, dress code guidelines..."
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Theme Image URL</label>
              <OceanInput
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="h-10"
              />
            </div>

            {/* Amazon Shopping List URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">
                Amazon Shopping List URL
              </label>
              <OceanInput
                value={formData.amazonShoppingListUrl}
                onChange={e => setFormData({ ...formData, amazonShoppingListUrl: e.target.value })}
                placeholder="https://amazon.com/..."
                className="h-10"
              />
              <p className="text-[10px] text-white/50">Optional link to costume shopping list</p>
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
              onClick={handleCreateTheme}
              disabled={creating}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Create Theme'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
