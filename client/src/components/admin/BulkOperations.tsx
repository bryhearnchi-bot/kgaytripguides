import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  CheckSquare,
  Square,
  Edit,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  Ship,
  MapPin,
  Music,
  Calendar,
  Settings,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  Search,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkOperationItem {
  id: string;
  name: string;
  type: string;
  status?: string;
  lastModified?: Date;
  metadata?: Record<string, any>;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentItem?: string;
  errors?: Array<{ item: string; error: string }>;
}

interface BulkOperationsProps {
  items: BulkOperationItem[];
  onBulkEdit?: (selectedIds: string[], changes: Record<string, any>) => Promise<void>;
  onBulkDelete?: (selectedIds: string[]) => Promise<void>;
  onExport?: (selectedIds: string[], format: string) => Promise<void>;
  onImport?: (file: File, options: Record<string, any>) => Promise<void>;
  allowedOperations?: Array<'edit' | 'delete' | 'export' | 'import'>;
  itemType?: string;
  columns?: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
  }>;
}

const DataTable: React.FC<{
  items: BulkOperationItem[];
  selectedItems: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  columns: Array<{ key: string; label: string; sortable?: boolean }>;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
}> = ({
  items,
  selectedItems,
  onSelectionChange,
  columns,
  sortConfig,
  onSort,
  filters,
  onFilterChange,
}) => {
  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < items.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    onSelectionChange(newSelected);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-700">
          <div className="flex items-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className={cn(isPartiallySelected && "data-[state=checked]:bg-orange-500")}
              aria-label="Select all items"
            />
          </div>
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "flex items-center gap-2 col-span-2",
                column.sortable && "cursor-pointer hover:text-gray-900"
              )}
              onClick={() => column.sortable && onSort(column.key)}
            >
              <span>{column.label}</span>
              {column.sortable && sortConfig?.key === column.key && (
                <span className={cn(
                  "text-xs",
                  sortConfig.direction === 'asc' ? 'rotate-180' : ''
                )}>
                  ↓
                </span>
              )}
            </div>
          ))}
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-12 gap-4 p-4 border-t border-gray-200 bg-white">
          <div></div> {/* Empty cell for checkbox column */}
          {columns.map((column) => (
            <div key={`filter-${column.key}`} className="col-span-2">
              <Input
                placeholder={`Filter ${column.label.toLowerCase()}...`}
                value={filters[column.key] || ''}
                onChange={(e) => onFilterChange(column.key, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          ))}
          <div className="col-span-2"></div> {/* Empty cell for actions column */}
        </div>
      </div>

      {/* Table Body */}
      <div className="max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors",
              selectedItems.has(item.id) && "bg-blue-50 border-blue-200"
            )}
          >
            <div className="flex items-center">
              <Checkbox
                checked={selectedItems.has(item.id)}
                onCheckedChange={() => handleSelectItem(item.id)}
                aria-label={`Select ${item.name}`}
              />
            </div>
            <div className="col-span-2 font-medium text-gray-900 truncate">{item.name}</div>
            <div className="col-span-2">
              <Badge variant="outline">{item.type}</Badge>
            </div>
            <div className="col-span-2">
              {item.status && (
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              )}
            </div>
            <div className="col-span-2 text-sm text-gray-500">
              {item.lastModified?.toLocaleDateString()}
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm">
                <Edit className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange(new Set())}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const BulkEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApply: (changes: Record<string, any>) => void;
  itemType: string;
}> = ({ isOpen, onClose, selectedCount, onApply, itemType }) => {
  const [changes, setChanges] = useState<Record<string, any>>({});

  const handleApply = () => {
    onApply(changes);
    setChanges({});
    onClose();
  };

  const editableFields = {
    trip: [
      { key: 'status', label: 'Status', type: 'select', options: ['upcoming', 'ongoing', 'past'] },
      { key: 'cruiseLine', label: 'Cruise Line', type: 'text' },
    ],
    talent: [
      { key: 'category', label: 'Category', type: 'select', options: ['Drag', 'Comedy', 'Music', 'Broadway'] },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    event: [
      { key: 'type', label: 'Type', type: 'select', options: ['party', 'show', 'dining', 'lounge'] },
      { key: 'venue', label: 'Venue', type: 'text' },
    ],
  };

  const fields = editableFields[itemType as keyof typeof editableFields] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedCount} Items</DialogTitle>
          <DialogDescription>
            Make changes that will be applied to all selected items. Only fields you modify will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === 'select' ? (
                <Select
                  value={changes[field.key] || ''}
                  onValueChange={(value) => setChanges(prev => ({ ...prev, [field.key]: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.key}
                  value={changes[field.key] || ''}
                  onChange={(e) => setChanges(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleApply}
            disabled={Object.keys(changes).length === 0}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, options: Record<string, any>) => void;
  itemType: string;
}> = ({ isOpen, onClose, onImport, itemType }) => {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState({
    skipFirstRow: true,
    updateExisting: false,
    validateOnly: false,
  });

  const handleImport = () => {
    if (file) {
      onImport(file, options);
      setFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import {itemType}s</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple items at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Import Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipFirstRow"
                  checked={options.skipFirstRow}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, skipFirstRow: !!checked }))
                  }
                />
                <Label htmlFor="skipFirstRow" className="text-sm">
                  Skip first row (headers)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={options.updateExisting}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, updateExisting: !!checked }))
                  }
                />
                <Label htmlFor="updateExisting" className="text-sm">
                  Update existing items
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validateOnly"
                  checked={options.validateOnly}
                  onCheckedChange={(checked) =>
                    setOptions(prev => ({ ...prev, validateOnly: !!checked }))
                  }
                />
                <Label htmlFor="validateOnly" className="text-sm">
                  Validate only (don't import)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!file}
            className="bg-gradient-to-r from-green-500 to-green-600"
          >
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProgressIndicator: React.FC<{
  progress: BulkOperationProgress;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}> = ({ progress, onPause, onResume, onCancel }) => {
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {progress.status === 'running' ? (
              <PlayCircle className="w-5 h-5 text-blue-600" />
            ) : progress.status === 'paused' ? (
              <PauseCircle className="w-5 h-5 text-orange-600" />
            ) : progress.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium text-gray-900">
              {progress.status === 'running' && 'Processing...'}
              {progress.status === 'paused' && 'Paused'}
              {progress.status === 'completed' && 'Completed'}
              {progress.status === 'failed' && 'Failed'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {progress.status === 'running' && onPause && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <PauseCircle className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            {progress.status === 'paused' && onResume && (
              <Button variant="outline" size="sm" onClick={onResume}>
                <PlayCircle className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            {onCancel && progress.status !== 'completed' && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        <Progress value={percentage} className="mb-2" />

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {progress.completed} of {progress.total} items processed
            {progress.failed > 0 && ` (${progress.failed} failed)`}
          </span>
          <span>{percentage}%</span>
        </div>

        {progress.currentItem && (
          <p className="text-xs text-gray-500 mt-1">
            Current: {progress.currentItem}
          </p>
        )}

        {progress.errors && progress.errors.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
            <p className="font-medium text-red-900">Errors:</p>
            <ul className="list-disc list-inside text-red-700 text-xs mt-1">
              {progress.errors.slice(0, 3).map((error, index) => (
                <li key={index}>{error.item}: {error.error}</li>
              ))}
              {progress.errors.length > 3 && (
                <li>...and {progress.errors.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function BulkOperations({
  items,
  onBulkEdit,
  onBulkDelete,
  onExport,
  onImport,
  allowedOperations = ['edit', 'delete', 'export', 'import'],
  itemType = 'item',
  columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'lastModified', label: 'Last Modified', sortable: true },
  ],
}: BulkOperationsProps) {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [operationProgress, setOperationProgress] = useState<BulkOperationProgress | null>(null);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let filtered = items;

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          const itemValue = item[key as keyof BulkOperationItem];
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof BulkOperationItem];
        const bValue = b[sortConfig.key as keyof BulkOperationItem];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [items, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleBulkEdit = async (changes: Record<string, any>) => {
    if (!onBulkEdit) return;

    const selectedIds = Array.from(selectedItems);
    setOperationProgress({
      total: selectedIds.length,
      completed: 0,
      failed: 0,
      status: 'running',
      currentItem: selectedIds[0],
    });

    try {
      await onBulkEdit(selectedIds, changes);
      setOperationProgress(prev => prev ? { ...prev, status: 'completed', completed: prev.total } : null);
      setSelectedItems(new Set());
      toast({
        title: "Bulk edit completed",
        description: `Successfully updated ${selectedIds.length} items.`,
      });
    } catch (error) {
      setOperationProgress(prev => prev ? { ...prev, status: 'failed' } : null);
      toast({
        title: "Bulk edit failed",
        description: "Some items could not be updated. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;

    const selectedIds = Array.from(selectedItems);
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`)) {
      return;
    }

    setOperationProgress({
      total: selectedIds.length,
      completed: 0,
      failed: 0,
      status: 'running',
    });

    try {
      await onBulkDelete(selectedIds);
      setOperationProgress(prev => prev ? { ...prev, status: 'completed', completed: prev.total } : null);
      setSelectedItems(new Set());
      toast({
        title: "Bulk delete completed",
        description: `Successfully deleted ${selectedIds.length} items.`,
      });
    } catch (error) {
      setOperationProgress(prev => prev ? { ...prev, status: 'failed' } : null);
      toast({
        title: "Bulk delete failed",
        description: "Some items could not be deleted. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: string) => {
    if (!onExport) return;

    const selectedIds = Array.from(selectedItems);
    try {
      await onExport(selectedIds, format);
      toast({
        title: "Export started",
        description: `Exporting ${selectedIds.length} items as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (file: File, options: Record<string, any>) => {
    if (!onImport) return;

    try {
      await onImport(file, options);
      toast({
        title: "Import completed",
        description: `Successfully imported data from ${file.name}.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Unable to import file. Please check the format and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Management
          </h3>
          <p className="text-gray-600 text-sm">
            {items.length} total items • {selectedItems.size} selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allowedOperations.includes('import') && (
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="hover:bg-green-50 hover:border-green-300"
            >
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
          )}

          {selectedItems.size > 0 && (
            <>
              {allowedOperations.includes('export') && (
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              )}

              {allowedOperations.includes('edit') && (
                <Button
                  variant="outline"
                  onClick={() => setBulkEditOpen(true)}
                  className="hover:bg-orange-50 hover:border-orange-300"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Bulk Edit
                </Button>
              )}

              {allowedOperations.includes('delete') && (
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="hover:bg-red-50 hover:border-red-300 text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      {operationProgress && operationProgress.status !== 'idle' && (
        <ProgressIndicator
          progress={operationProgress}
          onCancel={() => setOperationProgress(null)}
        />
      )}

      {/* Data table */}
      <DataTable
        items={processedItems}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        columns={columns}
        sortConfig={sortConfig}
        onSort={handleSort}
        filters={filters}
        onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
      />

      {/* Modals */}
      <BulkEditModal
        isOpen={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        selectedCount={selectedItems.size}
        onApply={handleBulkEdit}
        itemType={itemType}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        itemType={itemType}
      />
    </div>
  );
}