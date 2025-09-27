# K-GAY Travel Guides - Admin Interface Style Guide

## 🎨 Design System Overview

The admin interface follows a **consistent ocean theme** with blue/teal gradients and modern component patterns. ALL admin pages must follow this exact styling pattern.

---

## 📋 Admin Page Structure Pattern

**CRITICAL RULE: NEVER CREATE NEW ADMIN PAGES - ONLY UPDATE EXISTING ONES**

### Required Structure
Every admin page MUST follow this exact pattern (see `LocationManagement.tsx` as the reference):

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { ResponsiveAdminTable } from '@/components/admin/ResponsiveAdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { [ItemFormModal] } from '@/components/admin/[ItemFormModal]';
import { api } from '@/lib/api-client';
import { [Icons] } from 'lucide-react';

export default function [ItemsManagement]() {
  // Standard state management pattern
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Standard modal handling
  const handleModalOpenChange = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      setEditingItem(null);
    }
  };

  // Standard data fetching with React Query
  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    }
  });

  // Standard delete mutation with proper error handling
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/items/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item deleted successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message.includes('Cannot delete')
          ? 'This item is in use and cannot be deleted'
          : 'Failed to delete item',
        variant: 'destructive',
      });
    }
  });

  // Standard action handlers
  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    setShowAddModal(false);
    setEditingItem(null);
  };

  // Standard filtering
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) // Add other fields as needed
  );

  return (
    <div className="space-y-8">
      {/* REQUIRED: Header Section */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">[Page Title]</h1>
            <p className="text-sm text-white/60">[Page Description]</p>
          </div>
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:from-[#38e0f6] hover:to-[#3b82f6]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add [Item]
          </Button>
        </div>

        {/* REQUIRED: Search and Filter Section */}
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search [items] by [field]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/60">
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Filter 1
            </Button>
            <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Filter 2
            </Button>
          </div>
        </div>
      </section>

      {/* REQUIRED: Data Table Section */}
      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All [Items] ({filteredItems.length})</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Across all [categories]</p>
          </div>
        </header>

        {/* ResponsiveAdminTable with proper empty state */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-white/60">
            <[Icon] className="h-10 w-10 text-white/30" />
            <p className="text-sm">{searchTerm ? 'No [items] match your search.' : 'Get started by adding your first [item].'}</p>
            {!searchTerm && (
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setShowAddModal(true);
                }}
                className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First [Item]
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveAdminTable
            data={filteredItems}
            columns={[/* Define columns */]}
            actions={[
              {
                label: 'Edit [Item]',
                icon: <Edit2 className="h-4 w-4" />,
                onClick: handleEdit,
              },
              {
                label: 'Delete [Item]',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (item) => handleDelete(item.id!),
                variant: 'destructive',
              },
            ]}
            keyField="id"
            isLoading={isLoading}
            emptyMessage={searchTerm ? 'No [items] match your search.' : 'Get started by adding your first [item].'}
          />
        )}

        <footer className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
          Showing {filteredItems.length} [item]{filteredItems.length === 1 ? '' : 's'}
        </footer>
      </section>

      {/* REQUIRED: Form Modal */}
      <[ItemFormModal]
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        [item]={editingItem}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
```

---

## 🎨 Color Palette & Theme

### Primary Colors
- **Main Background**: `#0b1222` (dark blue-gray)
- **Section Background**: `bg-[#10192f]/80` (slightly lighter with opacity)
- **Card Background**: `bg-white/5` (subtle white overlay)
- **Border Color**: `border-white/10` (subtle white border)

### Accent Colors
- **Primary Gradient**: `from-[#22d3ee] to-[#2563eb]` (cyan to blue)
- **Hover Gradient**: `from-[#38e0f6] to-[#3b82f6]` (lighter cyan to blue)
- **Focus Border**: `border-[#22d3ee]/70` (cyan with opacity)

### Text Colors
- **Primary Text**: `text-white`
- **Secondary Text**: `text-white/60`
- **Tertiary Text**: `text-white/40`
- **Input Placeholder**: `placeholder:text-white/50`

---

## 🔧 Component Guidelines

### Buttons
```tsx
// Primary Action Button
<Button className="rounded-full bg-gradient-to-r from-[#22d3ee] to-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:from-[#38e0f6] hover:to-[#3b82f6]">
  <Plus className="mr-2 h-4 w-4" />
  Button Text
</Button>

// Filter/Ghost Button
<Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
  Filter Text
</Button>
```

### Input Fields
```tsx
<Input
  placeholder="Search placeholder"
  className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
/>
```

### Section Containers
```tsx
// Header Section
<section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">

// Data Section
<section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
```

---

## 📱 ResponsiveAdminTable Configuration

### Column Structure
```tsx
columns={[
  {
    key: 'name',
    label: 'Primary Label',
    priority: 'high',
    render: (_value, item) => (
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded-xl object-cover" />
          ) : (
            <[Icon] className="h-5 w-5 text-white/70" />
          )}
        </div>
        <div className="space-y-1 min-w-0">
          <p className="font-medium text-white">{item.name}</p>
          <p className="text-xs text-white/60">{item.subtitle}</p>
          {item.description && (
            <p className="text-xs text-white/60 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
    ),
  },
  // Additional columns...
]}
```

### Standard Actions
```tsx
actions={[
  {
    label: 'Edit [Item]',
    icon: <Edit2 className="h-4 w-4" />,
    onClick: handleEdit,
  },
  {
    label: 'Delete [Item]',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: (item) => handleDelete(item.id!),
    variant: 'destructive',
  },
]}
```

---

## 🔄 Form Modal Standards

### Layout Pattern
- **Modal Width**: `max-w-6xl` for wide modals with multiple sections
- **Grid Layout**: `grid grid-cols-1 lg:grid-cols-2 gap-6` (left: form, right: selectors)
- **Compact Spacing**: `space-y-3` for sections, `space-y-1` for fields

### Form Structure
```tsx
<AdminFormModal
  maxWidthClassName="max-w-6xl"
  title={isEditing ? 'Edit [Item]' : 'Add New [Item]'}
  description="[Modal description]"
>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Left Column - Basic Info */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white/90 mb-3">Basic Information</h3>
      <div className="space-y-3">
        {/* Form fields with space-y-1 */}
      </div>
    </div>

    {/* Right Column - Relations */}
    <div className="space-y-4">
      {/* Selectors and additional fields */}
    </div>
  </div>
</AdminFormModal>
```

### Form Field Pattern
```tsx
<div className="space-y-1">
  <label className="text-sm font-medium text-white/90">[Field Label] *</label>
  <Input
    placeholder="[placeholder]"
    value={formData.[field]}
    onChange={(e) => handleInputChange('[field]', e.target.value)}
    className="admin-form-modal"
  />
</div>
```

---

## ✅ Checklist for New Admin Pages

- [ ] **Follow exact LocationManagement.tsx structure**
- [ ] **Use ResponsiveAdminTable for data display**
- [ ] **Implement proper React Query patterns**
- [ ] **Add comprehensive error handling with toast notifications**
- [ ] **Include search and filter functionality**
- [ ] **Use ocean theme colors and gradients consistently**
- [ ] **Implement proper empty states**
- [ ] **Create compact, scrollable form modals**
- [ ] **Add proper loading states**
- [ ] **Include confirmation dialogs for destructive actions**

---

## 🚫 Common Mistakes to Avoid

1. **Never create new page files** - only update existing ones
2. **Never use custom styling** - always use the standard components and classes
3. **Never skip error handling** - always implement proper error states
4. **Never use different modal layouts** - stick to the 2-column grid pattern
5. **Never ignore the ocean theme** - maintain consistent colors and gradients
6. **Never skip the ResponsiveAdminTable** - always use it for data display
7. **Never create pages without proper React Query integration**
8. **Never forget the search and filter functionality**

---

## 📚 Reference Components

- **Base Pattern**: `LocationManagement.tsx`
- **Ships Example**: `ShipsManagement.tsx` (ships.tsx)
- **Resorts Example**: `ResortsManagement.tsx` (resorts.tsx)
- **Table Component**: `ResponsiveAdminTable.tsx`
- **Modal Component**: `AdminFormModal.tsx`
- **Status Component**: `StatusBadge.tsx`