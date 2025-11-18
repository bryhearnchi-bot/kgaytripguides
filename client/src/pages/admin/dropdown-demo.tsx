import * as React from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { StandardDropdown, PillDropdown } from '@/components/ui/dropdowns';
import type { DropdownOption } from '@/components/ui/dropdowns';

// Simple demo data
const statusOptions: DropdownOption[] = [
  { value: 'all', label: 'All Trips' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'draft', label: 'Drafts' },
];

const charterCompanyOptions: DropdownOption[] = [
  { value: 'virgin', label: 'Virgin Voyages' },
  { value: 'celebrity', label: 'Celebrity Cruises' },
  { value: 'rcc', label: 'Royal Caribbean' },
];

const talentOptionsInitial: DropdownOption[] = [
  { value: 'dj-grind', label: 'DJ Grind' },
  { value: 'nina-flowers', label: 'Nina Flowers' },
  { value: 'lady-bunny', label: 'Lady Bunny' },
  { value: 'local-talent', label: 'Local Talent' },
  { value: 'chi-chi-devayne', label: 'Chi Chi DeVayne' },
  { value: 'shangela', label: 'Shangela' },
  { value: 'trixie-mattel', label: 'Trixie Mattel' },
  { value: 'katya', label: 'Katya' },
  { value: 'bianca-del-rio', label: 'Bianca Del Rio' },
  { value: 'bob-the-drag-queen', label: 'Bob the Drag Queen' },
  { value: 'ru-paul', label: 'RuPaul' },
  { value: 'alaska', label: 'Alaska' },
];

function OxfordBluePageSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-white/90 tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Variant 1a: Single – Basic (no search, no add) standard shape
 */
function SingleSelectBasicDemo() {
  const [value, setValue] = React.useState('upcoming');

  return (
    <StandardDropdown
      variant="single-basic"
      options={statusOptions}
      value={value}
      onChange={setValue}
      placeholder="Select status"
      className="max-w-xs"
    />
  );
}

/**
 * Variant 1b: Single – Basic (pill filter style, no search, no add)
 */
function SingleSelectBasicPillDemo() {
  const [value, setValue] = React.useState('upcoming');

  return (
    <PillDropdown
      options={statusOptions}
      value={value}
      onChange={setValue}
      placeholder="Select status"
      className="w-56"
    />
  );
}

/**
 * Variant 2: Single – Search (no add)
 */
function SingleSelectSearchDemo() {
  const [value, setValue] = React.useState<string>('virgin');

  return (
    <StandardDropdown
      variant="single-search"
      options={charterCompanyOptions}
      value={value}
      onChange={setValue}
      placeholder="Select a company"
      searchPlaceholder="Search companies..."
      className="max-w-sm"
    />
  );
}

/**
 * Variant 3: Single – Search + Add (inline Add New)
 */
function SingleSelectSearchAddDemo() {
  const [value, setValue] = React.useState<string>('virgin');
  const [options, setOptions] = React.useState(charterCompanyOptions);

  const handleCreateNew = async (name: string) => {
    const valueSlug = name.toLowerCase().replace(/\s+/g, '-');
    const newOption = { value: valueSlug, label: name };
    setOptions(prev => [...prev, newOption]);
    return newOption;
  };

  return (
    <StandardDropdown
      variant="single-search-add"
      options={options}
      value={value}
      onChange={setValue}
      onCreateNew={handleCreateNew}
      placeholder="Select a company"
      addLabel="Add New Cruise Line"
      searchPlaceholder="Search cruise lines..."
      className="max-w-sm"
    />
  );
}

/**
 * Variant 4: Multi – Search (no add)
 */
function MultiSelectSearchDemo() {
  const [selectedValues, setSelectedValues] = React.useState<string[]>([
    'dj-grind',
    'nina-flowers',
  ]);

  return (
    <StandardDropdown
      variant="multi-search"
      options={talentOptionsInitial}
      value={selectedValues}
      onChange={setSelectedValues}
      placeholder="Select talent..."
      searchPlaceholder="Search talent..."
      className="max-w-xl"
    />
  );
}

/**
 * Variant 5: Multi – Search + Add (inline Add New)
 */
function MultiSelectSearchAddDemo() {
  const [selectedValues, setSelectedValues] = React.useState<string[]>([
    'dj-grind',
    'nina-flowers',
  ]);
  const [options, setOptions] = React.useState(talentOptionsInitial);

  const handleCreateNew = async (name: string) => {
    const valueSlug = name.toLowerCase().replace(/\s+/g, '-');
    const newOption = { value: valueSlug, label: name };
    setOptions(prev => [...prev, newOption]);
    return newOption;
  };

  return (
    <StandardDropdown
      variant="multi-search-add"
      options={options}
      value={selectedValues}
      onChange={setSelectedValues}
      onCreateNew={handleCreateNew}
      placeholder="Select talent..."
      addLabel="Add New Talent"
      searchPlaceholder="Search talent..."
      className="max-w-xl"
    />
  );
}

function DatePickerCalendarMock() {
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      <div className="space-y-1">
        <p className="text-[11px] text-white/60">Start Date</p>
        <DatePicker value={startDate} onChange={setStartDate} placeholder="Select start date" />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] text-white/60">End Date</p>
        <DatePicker value={endDate} onChange={setEndDate} placeholder="Select end date" />
      </div>
    </div>
  );
}

/**
 * Page-level demo component
 * Background: solid Oxford Blue (#002147), minimal layout.
 */
export default function AdminDropdownDemoPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#002147] text-white">
      <div className="w-full max-w-3xl px-6 py-8 space-y-8">
        <header className="space-y-1">
          <h1 className="text-lg font-semibold">Dropdown System Demo</h1>
          <p className="text-xs text-white/70 max-w-xl">
            These React-only mockups show the five dropdown variants using the same input shape as
            Edit Ship and a slightly lighter menu overlay. Once you like these, we&apos;ll wire them
            into real admin screens.
          </p>
        </header>

        <OxfordBluePageSection title="Single – Basic (no search, no add)">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-white/60 mb-1">Standard field shape</p>
              <SingleSelectBasicDemo />
            </div>
            <div>
              <p className="text-[11px] text-white/60 mb-1">Pill filter shape</p>
              <SingleSelectBasicPillDemo />
            </div>
          </div>
        </OxfordBluePageSection>

        <OxfordBluePageSection title="Single – Search">
          <SingleSelectSearchDemo />
        </OxfordBluePageSection>

        <OxfordBluePageSection title="Single – Search + Add New (inline)">
          <SingleSelectSearchAddDemo />
        </OxfordBluePageSection>

        <OxfordBluePageSection title="Multi – Search">
          <MultiSelectSearchDemo />
        </OxfordBluePageSection>

        <OxfordBluePageSection title="Multi – Search + Add New (inline)">
          <MultiSelectSearchAddDemo />
        </OxfordBluePageSection>

        <OxfordBluePageSection title="Date Picker – Calendar Styling">
          <DatePickerCalendarMock />
        </OxfordBluePageSection>
      </div>
    </div>
  );
}
