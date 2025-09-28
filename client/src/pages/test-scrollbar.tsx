import { useState } from 'react';
import { MultiSelectWithCreate } from '@/components/admin/MultiSelectWithCreate';

export default function TestScrollbar() {
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  // Create only 1 real item to simulate current database state
  const realItems = [
    { id: 1, name: 'Pool Deck', description: 'Main pool area' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a2332] p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            MultiSelect Scrollbar Test
          </h1>
          <p className="text-white/60">
            Testing with 1 real item + 25 fake items = 26 total items
          </p>
          <p className="text-yellow-400 text-sm mt-2">
            The dropdown should show a visible scrollbar
          </p>
        </div>

        <div className="bg-[#1a2332]/50 backdrop-blur rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Test Component</h2>

          <div className="space-y-2">
            <label className="text-sm text-white/80">
              Select Venues (should show scrollbar with 26 items)
            </label>
            <MultiSelectWithCreate
              items={realItems}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onCreate={async (name) => {
                console.log('Creating:', name);
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
              }}
              placeholder="Select venues..."
              createButtonText="Create Venue"
              searchPlaceholder="Search venues..."
            />
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h3 className="text-sm font-medium text-white/80 mb-2">Selected IDs:</h3>
            <pre className="text-xs text-blue-400">
              {JSON.stringify(selectedIds, null, 2)}
            </pre>
          </div>

          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-200 mb-2">Expected Behavior:</h3>
            <ul className="text-xs text-yellow-200/80 space-y-1">
              <li>✓ Dropdown should show exactly 26 items (1 real + 25 test)</li>
              <li>✓ Scrollbar should be visible on the right side</li>
              <li>✓ Scrollbar should be blue-tinted and semi-transparent</li>
              <li>✓ Max height should be 200px forcing scroll</li>
              <li>✓ Yellow test mode banner should appear at top</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white/40 text-sm">
            Once confirmed working, remove the test items from MultiSelectWithCreate.tsx
          </p>
        </div>
      </div>
    </div>
  );
}