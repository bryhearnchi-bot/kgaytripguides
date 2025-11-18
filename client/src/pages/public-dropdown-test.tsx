import * as React from 'react';
import { StandardDropdown } from '@/components/ui/dropdowns';
import type { DropdownOption } from '@/components/ui/dropdowns';

// Test data with many options to test scrolling
const manyOptions: DropdownOption[] = [
  { value: 'option-1', label: 'Option 1 - First Item' },
  { value: 'option-2', label: 'Option 2 - Second Item' },
  { value: 'option-3', label: 'Option 3 - Third Item' },
  { value: 'option-4', label: 'Option 4 - Fourth Item' },
  { value: 'option-5', label: 'Option 5 - Fifth Item' },
  { value: 'option-6', label: 'Option 6 - Sixth Item' },
  { value: 'option-7', label: 'Option 7 - Seventh Item' },
  { value: 'option-8', label: 'Option 8 - Eighth Item' },
  { value: 'option-9', label: 'Option 9 - Ninth Item' },
  { value: 'option-10', label: 'Option 10 - Tenth Item' },
  { value: 'option-11', label: 'Option 11 - Eleventh Item' },
  { value: 'option-12', label: 'Option 12 - Twelfth Item' },
  { value: 'option-13', label: 'Option 13 - Thirteenth Item' },
  { value: 'option-14', label: 'Option 14 - Fourteenth Item' },
  { value: 'option-15', label: 'Option 15 - Fifteenth Item' },
];

const basicOptions: DropdownOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

export default function PublicDropdownTest() {
  const [singleValue, setSingleValue] = React.useState<string>('option-1');
  const [multiValue, setMultiValue] = React.useState<string[]>(['option-1', 'option-2']);
  const [basicValue, setBasicValue] = React.useState<string>('a');

  return (
    <div className="min-h-screen bg-[#002147] text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold mb-4">Dropdown Component Test</h1>
        <p className="text-sm text-white/70 mb-8">
          This page tests the StandardDropdown component for focus and scrolling issues. No
          authentication required.
        </p>

        {/* Test 1: Single Select with Search - Tests focus */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Test 1: Single Select with Search</h2>
          <p className="text-xs text-white/60">
            Click the dropdown, then try to click in the search box and type.
            <br />
            <strong>Expected:</strong> Search input should be focusable and typeable.
          </p>
          <StandardDropdown
            variant="single-search"
            options={manyOptions}
            value={singleValue}
            onChange={val => setSingleValue(val as string)}
            placeholder="Select an option..."
            searchPlaceholder="Type to search..."
            className="max-w-md"
          />
          <div className="text-xs text-white/60">
            Current value: <code className="bg-white/10 px-1 py-0.5 rounded">{singleValue}</code>
          </div>
        </section>

        {/* Test 2: Multi Select with Search - Tests scrolling */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Test 2: Multi Select with Search (15 items)</h2>
          <p className="text-xs text-white/60">
            Open the dropdown and try to scroll down to see all 15 options.
            <br />
            <strong>Expected:</strong> List should be scrollable with a visible scrollbar.
          </p>
          <StandardDropdown
            variant="multi-search"
            options={manyOptions}
            value={multiValue}
            onChange={val => setMultiValue(val as string[])}
            placeholder="Select options..."
            searchPlaceholder="Search options..."
            className="max-w-md"
          />
          <div className="text-xs text-white/60">
            Selected:{' '}
            <code className="bg-white/10 px-1 py-0.5 rounded">{multiValue.join(', ')}</code>
          </div>
        </section>

        {/* Test 3: Basic dropdown (no search) */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Test 3: Basic Single Select (No Search)</h2>
          <p className="text-xs text-white/60">
            This is a basic dropdown without search functionality.
          </p>
          <StandardDropdown
            variant="single-basic"
            options={basicOptions}
            value={basicValue}
            onChange={val => setBasicValue(val as string)}
            placeholder="Select..."
            className="max-w-md"
          />
          <div className="text-xs text-white/60">
            Current value: <code className="bg-white/10 px-1 py-0.5 rounded">{basicValue}</code>
          </div>
        </section>

        {/* Diagnostic info */}
        <section className="mt-12 p-4 bg-white/5 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Diagnostic Information</h3>
          <p className="text-xs text-white/60">
            Open browser DevTools (F12) and run this code to check scroll/focus behavior:
          </p>
          <pre className="mt-2 p-3 bg-black/30 rounded text-xs overflow-x-auto">
            {`// After opening a dropdown:
const list = document.querySelector('[cmdk-list]');
console.log('scrollHeight:', list.scrollHeight);
console.log('clientHeight:', list.clientHeight);
console.log('Has scrollbar:', list.scrollHeight > list.clientHeight);

const input = document.querySelector('[cmdk-input]');
if (input) {
  input.focus();
  console.log('Input focused:', document.activeElement === input);
}`}
          </pre>
        </section>
      </div>
    </div>
  );
}
