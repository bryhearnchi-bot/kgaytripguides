import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { locationService, type LocationData } from '@/lib/location-service';
import { cn } from '@/lib/utils';

interface LocationSearchBarProps {
  label?: string;
  placeholder?: string;
  value?: Partial<LocationData>;
  onChange: (location: Partial<LocationData>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function LocationSearchBar({
  label = 'Location',
  placeholder = 'Search city, state, or country...',
  value,
  onChange,
  className,
  disabled = false,
  required = false,
}: LocationSearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Partial<LocationData> | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize input value from prop
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      const formatted = locationService.formatLocation(value);
      setInputValue(formatted);
      setSelectedLocation(value);
    } else {
      setInputValue('');
      setSelectedLocation(null);
    }
  }, [value]);

  // Debounced search function
  const debouncedSearch = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Add timeout to prevent long-hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), 5000)
      );

      const searchPromise = locationService.searchLocations(query);
      const results = (await Promise.race([searchPromise, timeoutPromise])) as LocationData[];

      setSuggestions(results);

      // Keep focus on input after results load
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSelectedLocation(null);

    // Only open popover if we have enough characters
    if (newValue.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce - increased to 500ms to prevent stuttering
    debounceRef.current = setTimeout(() => {
      debouncedSearch(newValue);
    }, 500);

    // Ensure input stays focused during typing
    setTimeout(() => {
      if (inputRef.current && inputRef.current !== document.activeElement) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleSelect = (location: LocationData) => {
    setInputValue(location.formatted);
    setSelectedLocation(location);
    setIsOpen(false);
    setSuggestions([]);
    onChange(location);

    // Return focus to input after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedLocation(null);
    setSuggestions([]);
    onChange({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestions[0]) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="location-search">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              id="location-search"
              placeholder={placeholder}
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (inputValue.length >= 2) {
                  setIsOpen(true);
                }
              }}
              disabled={disabled}
              required={required}
              className="pr-20 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-white/20 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 focus-visible:outline-none h-11 min-h-[44px]"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-6 w-6 text-white/60 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-white/60 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-white/60" />
              )}
            </div>
          </div>
        </PopoverTrigger>

        {isOpen && suggestions.length > 0 && (
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/5/95 border-white/10 backdrop-blur"
            align="start"
            container={typeof document !== 'undefined' ? document.body : undefined}
            onOpenAutoFocus={e => e.preventDefault()}
            onCloseAutoFocus={e => e.preventDefault()}
          >
            <Command className="bg-transparent">
              <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
                <CommandGroup>
                  {suggestions.map((location, index) => (
                    <CommandItem
                      key={`${location.countryCode}-${location.city}-${index}`}
                      onSelect={() => handleSelect(location)}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 text-white"
                    >
                      <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium truncate">{location.formatted}</div>
                        {location.city && (
                          <div className="text-xs text-white/60 truncate">
                            {location.countryCode}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>

      {/* Display selected location details */}
      {selectedLocation && Object.keys(selectedLocation).length > 0 && (
        <div className="text-xs text-white/70 mt-1">
          <span className="font-medium">Selected:</span>{' '}
          {selectedLocation.city && `${selectedLocation.city}, `}
          {selectedLocation.state && `${selectedLocation.state}, `}
          {selectedLocation.country}
          {selectedLocation.countryCode && ` (${selectedLocation.countryCode})`}
        </div>
      )}
    </div>
  );
}
