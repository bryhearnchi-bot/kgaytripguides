import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  X,
  Save,
  Download,
  Upload,
  History,
  Star,
  Calendar,
  MapPin,
  Users,
  Ship,
  Music,
  Settings,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
  label?: string;
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: SearchFilter[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  category?: string;
  isPublic?: boolean;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

interface SearchField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  searchable?: boolean;
  filterable?: boolean;
}

interface AdvancedSearchProps {
  fields: SearchField[];
  onSearch: (filters: SearchFilter[], sortBy?: string, sortDirection?: 'asc' | 'desc') => void;
  onExport?: (filters: SearchFilter[], format: string) => Promise<void>;
  savedSearches?: SavedSearch[];
  onSaveSearch?: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>) => Promise<void>;
  onDeleteSavedSearch?: (id: string) => Promise<void>;
  onLoadSavedSearch?: (search: SavedSearch) => void;
  placeholder?: string;
  className?: string;
  initialFilters?: SearchFilter[];
  recentSearches?: string[];
}

const FilterBuilder: React.FC<{
  filter: SearchFilter;
  fields: SearchField[];
  onChange: (filter: SearchFilter) => void;
  onRemove: () => void;
}> = ({ filter, fields, onChange, onRemove }) => {
  const selectedField = fields.find(f => f.key === filter.field);

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
        ];
      case 'number':
      case 'date':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greaterThan', label: 'Greater than' },
          { value: 'lessThan', label: 'Less than' },
          { value: 'between', label: 'Between' },
        ];
      case 'select':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'in', label: 'In' },
          { value: 'notIn', label: 'Not in' },
        ];
      case 'multiselect':
        return [
          { value: 'in', label: 'Contains any' },
          { value: 'notIn', label: 'Contains none' },
        ];
      case 'boolean':
        return [
          { value: 'equals', label: 'Is' },
        ];
      default:
        return [{ value: 'contains', label: 'Contains' }];
    }
  };

  const renderValueInput = () => {
    if (!selectedField) return null;

    switch (selectedField.type) {
      case 'select':
        return (
          <Select
            value={filter.value}
            onValueChange={(value) => onChange({ ...filter, value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {selectedField.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {selectedField.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.id}-${option.value}`}
                  checked={Array.isArray(filter.value) && filter.value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(filter.value) ? filter.value : [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter(v => v !== option.value);
                    onChange({ ...filter, value: newValues });
                  }}
                />
                <Label htmlFor={`${filter.id}-${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <Select
            value={filter.value?.toString()}
            onValueChange={(value) => onChange({ ...filter, value: value === 'true' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={filter.value || ''}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={filter.value || ''}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
            placeholder="Enter number"
          />
        );

      default:
        return (
          <Input
            value={filter.value || ''}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <Select
        value={filter.field}
        onValueChange={(field) => onChange({ ...filter, field, value: '' })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.key} value={field.key}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.operator}
        onValueChange={(operator: any) => onChange({ ...filter, operator })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {getOperatorOptions(selectedField?.type || 'text').map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1 min-w-40">
        {renderValueInput()}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

const SavedSearchCard: React.FC<{
  search: SavedSearch;
  onLoad: () => void;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ search, onLoad, onDelete, onEdit }) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onLoad}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{search.name}</h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {search.description && (
        <p className="text-sm text-gray-600 mb-2">{search.description}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{search.filters.length} filter{search.filters.length !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>Used {search.useCount} times</span>
        {search.lastUsed && (
          <>
            <span>•</span>
            <span>Last used {search.lastUsed.toLocaleDateString()}</span>
          </>
        )}
      </div>
      {search.category && (
        <Badge variant="outline" className="mt-2 text-xs">
          {search.category}
        </Badge>
      )}
    </CardContent>
  </Card>
);

export default function AdvancedSearch({
  fields,
  onSearch,
  onExport,
  savedSearches = [],
  onSaveSearch,
  onDeleteSavedSearch,
  onLoadSavedSearch,
  placeholder = "Search...",
  className,
  initialFilters = [],
  recentSearches = [],
}: AdvancedSearchProps) {
  const { toast } = useToast();
  const [quickSearch, setQuickSearch] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>(initialFilters);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchDescription, setNewSearchDescription] = useState('');
  const [newSearchCategory, setNewSearchCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Auto-search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.length > 0 || quickSearch) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, quickSearch, sortBy, sortDirection]);

  const handleSearch = () => {
    let searchFilters = [...filters];

    // Add quick search filter if present
    if (quickSearch.trim()) {
      const searchableFields = fields.filter(f => f.searchable !== false);
      if (searchableFields.length > 0) {
        searchFilters.push({
          id: 'quick-search',
          field: searchableFields[0].key, // Default to first searchable field
          operator: 'contains',
          value: quickSearch.trim(),
          label: `Quick search: "${quickSearch.trim()}"`,
        });
      }
    }

    onSearch(searchFilters, sortBy || undefined, sortDirection);
  };

  const addFilter = () => {
    const newFilter: SearchFilter = {
      id: `filter-${Date.now()}`,
      field: fields[0]?.key || '',
      operator: 'contains',
      value: '',
    };
    setFilters(prev => [...prev, newFilter]);
  };

  const updateFilter = (index: number, filter: SearchFilter) => {
    setFilters(prev => prev.map((f, i) => i === index ? filter : f));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setFilters([]);
    setQuickSearch('');
    setSortBy('');
    setSortDirection('asc');
  };

  const handleSaveSearch = async () => {
    if (!onSaveSearch || !newSearchName.trim()) return;

    try {
      await onSaveSearch({
        name: newSearchName.trim(),
        description: newSearchDescription.trim() || undefined,
        category: newSearchCategory.trim() || undefined,
        filters,
        sortBy: sortBy || undefined,
        sortDirection: sortDirection,
        isPublic,
        lastUsed: new Date(),
      });

      setSaveDialogOpen(false);
      setNewSearchName('');
      setNewSearchDescription('');
      setNewSearchCategory('');
      setIsPublic(false);

      toast({
        title: "Search saved",
        description: "Your search has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save search. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    setSortBy(search.sortBy || '');
    setSortDirection(search.sortDirection || 'asc');
    onLoadSavedSearch?.(search);

    toast({
      title: "Search loaded",
      description: `Loaded search: ${search.name}`,
    });
  };

  const handleExport = async (format: string) => {
    if (!onExport) return;

    try {
      await onExport(filters, format);
      toast({
        title: "Export started",
        description: `Exporting search results as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const activeFilterCount = filters.length + (quickSearch ? 1 : 0);
  const categorizedSavedSearches = useMemo(() => {
    const categories: Record<string, SavedSearch[]> = {};
    savedSearches.forEach(search => {
      const category = search.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(search);
    });
    return categories;
  }, [savedSearches]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={placeholder}
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {quickSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickSearch('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={cn(
                "flex items-center gap-2",
                activeFilterCount > 0 && "border-blue-500 text-blue-600"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Advanced
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              {quickSearch && (
                <Badge variant="outline" className="text-xs">
                  Search: "{quickSearch}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuickSearch('')}
                    className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                  >
                    <X className="w-2 h-2" />
                  </Button>
                </Badge>
              )}
              {filters.map((filter, index) => {
                const field = fields.find(f => f.key === filter.field);
                return (
                  <Badge key={filter.id} variant="outline" className="text-xs">
                    {field?.label || filter.field}: {filter.operator} "{filter.value}"
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(index)}
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Search Panel */}
      {isAdvancedOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Search
              </span>
              <div className="flex items-center gap-2">
                {onExport && (
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </Button>
                )}
                {onSaveSearch && filters.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)}>
                    <Save className="w-4 h-4 mr-1" />
                    Save Search
                  </Button>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Build complex search queries with multiple filters and sorting options.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="saved">Saved Searches</TabsTrigger>
              </TabsList>

              <TabsContent value="filters" className="space-y-4">
                {/* Filter Builder */}
                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <FilterBuilder
                      key={filter.id}
                      filter={filter}
                      fields={fields}
                      onChange={(updatedFilter) => updateFilter(index, updatedFilter)}
                      onRemove={() => removeFilter(index)}
                    />
                  ))}

                  <Button
                    variant="outline"
                    onClick={addFilter}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Filter
                  </Button>
                </div>

                {/* Sorting */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sort by</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No sorting</SelectItem>
                        {fields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="saved" className="space-y-4">
                {Object.keys(categorizedSavedSearches).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Save className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No saved searches yet</p>
                    <p className="text-sm">Create filters and save them for quick access</p>
                  </div>
                ) : (
                  Object.entries(categorizedSavedSearches).map(([category, searches]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-gray-900">{category}</h4>
                      <div className="grid gap-3">
                        {searches.map((search) => (
                          <SavedSearchCard
                            key={search.id}
                            search={search}
                            onLoad={() => loadSavedSearch(search)}
                            onDelete={() => onDeleteSavedSearch?.(search.id)}
                            onEdit={() => {
                              // TODO: Implement edit functionality
                              toast({
                                title: "Edit saved search",
                                description: "Edit functionality coming soon.",
                              });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save your current search filters for quick access later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Search name</Label>
              <Input
                id="name"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
                placeholder="Enter a name for this search"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newSearchDescription}
                onChange={(e) => setNewSearchDescription(e.target.value)}
                placeholder="Brief description of this search"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={newSearchCategory}
                onChange={(e) => setNewSearchCategory(e.target.value)}
                placeholder="e.g., Trips, Talent, Events"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(!!checked)}
              />
              <Label htmlFor="public">Make this search public</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSearch}
              disabled={!newSearchName.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600"
            >
              <Save className="w-4 h-4 mr-1" />
              Save Search
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}