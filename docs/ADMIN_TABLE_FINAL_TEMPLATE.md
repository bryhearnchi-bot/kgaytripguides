# Admin Table Final Template - WORKING VERSION

## ✅ THIS IS THE PROVEN WORKING TEMPLATE
Based on the successfully implemented Trips, Ships, and Resorts tables.

## Step 1: Create the Enhanced Table Component

Copy `/client/src/components/admin/EnhancedShipsTable.tsx` as your base and rename it.

Key changes to make:
1. Rename interface from `EnhancedShipsTableProps` to `Enhanced[YourEntity]TableProps`
2. Rename function from `EnhancedShipsTable` to `Enhanced[YourEntity]Table`
3. Update default column widths for your specific columns
4. Change table state key from `'ships_table'` to `'[yourentity]_table'`

## Step 2: Page Structure Template

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Enhanced[Entity]Table } from '@/components/admin/Enhanced[Entity]Table';
import { [Entity]FormModal } from '@/components/admin/[Entity]FormModal';
import { api } from '@/lib/api-client';
import { [Icon], Plus, PlusSquare, Edit2, Trash2, Search } from 'lucide-react';

// Your interface
interface [Entity] {
  id?: number;
  name: string;
  // ... other fields
}

export default function [Entity]Management() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<[Entity] | null>(null);

  // ... queries and mutations

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <[Icon] className="h-6 w-6" />
              [Entity] Management
            </h1>
            <p className="text-sm text-white/60">Manage your [entities]</p>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search [entities]..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/10 pl-10 text-sm text-white placeholder:text-white/50 focus:border-[#22d3ee]/70"
            />
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pl-6 pr-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">All [Entities]</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }}
            className="h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15"
            title="Add New [Entity]"
          >
            <PlusSquare className="h-5 w-5 text-blue-400/80" />
          </Button>
        </header>

        <Enhanced[Entity]Table
          data={filteredData}
          columns={columns}
          actions={actions}
          keyField="id"
          isLoading={isLoading}
          emptyMessage={searchTerm ? 'No [entities] match your search.' : 'Get started by adding your first [entity].'}
        />

        {filteredData.length > 0 && (
          <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <div className="text-xs text-white/50">
              Showing {filteredData.length} of {data.length} [entities]
            </div>
          </footer>
        )}
      </section>

      {/* Form Modal */}
      <[Entity]FormModal
        isOpen={showAddModal}
        onOpenChange={handleModalOpenChange}
        [entity]={editingItem}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
```

## Step 3: Column Configuration

### REQUIRED Structure:
```tsx
columns={[
  {
    key: 'image',
    label: '',
    priority: 'high',
    sortable: false,
    resizable: false,
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    render: (_value, item) => (
      <div className="flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#22d3ee]/30 to-[#2563eb]/40 border border-white/10">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <YourIcon className="h-6 w-6 text-white/70" />
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'name',
    label: '[Entity] Name',
    priority: 'high',
    sortable: true,
    minWidth: 200,
    render: (value) => (
      <p className="font-bold text-xs text-white">{value}</p>
    ),
  },
  // Add more columns with appropriate priorities:
  // - 'high' = always visible
  // - 'medium' = hidden on mobile
  // - 'low' = hidden on tablet and mobile
]}
```

### Actions Configuration:
```tsx
actions={[
  {
    label: 'Edit [Entity]',
    icon: <Edit2 className="h-4 w-4" />,
    onClick: handleEdit,
  },
  {
    label: 'Delete [Entity]',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: (item) => handleDelete(item.id!),
    variant: 'destructive',
  },
]}
```

## Critical Rules:

### Column Widths:
- **Image column**: ALWAYS 80px fixed (width, minWidth, maxWidth all = 80)
- **Actions column**: ALWAYS 100px fixed (automatically handled)
- **Other columns**: Use appropriate minWidth values

### Icon Sizes:
- **Table header icon**: h-6 w-6
- **Image placeholder**: h-6 w-6 text-white/70
- **Action buttons**: h-4 w-4
- **Add button (PlusSquare)**: h-5 w-5 text-blue-400/80

### Button Classes:
- **Add button**: `h-4 w-4 rounded-xl border border-white/15 bg-blue-500/10 text-white/80 hover:bg-blue-500/15`
- **Edit button**: `h-4 w-4 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10`
- **Delete button**: `h-4 w-4 rounded-xl border border-[#fb7185]/30 bg-[#fb7185]/10 text-[#fb7185] hover:bg-[#fb7185]/20`

### Responsive Priorities:
- **high**: Always visible (image, name, primary identifier)
- **medium**: Hidden on mobile (<768px)
- **low**: Hidden on tablet and below (<1024px)

### Table Layout:
- Use `tableLayout: 'auto'` with min/max width constraints
- Table wrapper: `rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur`
- Header: `pl-6 pr-3 py-3` with flex layout
- Footer: Show only when data exists

## Copy These Exact Files as Templates:
1. `/client/src/components/admin/EnhancedShipsTable.tsx` → Your enhanced table component
2. `/client/src/pages/admin/ships.tsx` → Your page structure

Just rename and adjust the entity-specific fields!