import React, { createContext, useContext, useState, useEffect } from 'react';

type TimeFormat = '12h' | '24h';

interface TimeFormatContextType {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  toggleTimeFormat: () => void;
}

const TimeFormatContext = createContext<TimeFormatContextType | undefined>(undefined);

export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  // Load saved preference from localStorage, default to 24-hour format
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>(() => {
    const saved = localStorage.getItem('timeFormat');
    return saved === '12h' || saved === '24h' ? saved : '24h';
  });

  // Save to localStorage when format changes
  const setTimeFormat = (format: TimeFormat) => {
    setTimeFormatState(format);
    localStorage.setItem('timeFormat', format);
  };

  const toggleTimeFormat = () => {
    const newFormat = timeFormat === '12h' ? '24h' : '12h';
    setTimeFormat(newFormat);
  };

  return (
    <TimeFormatContext.Provider
      value={{
        timeFormat,
        setTimeFormat,
        toggleTimeFormat,
      }}
    >
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  const context = useContext(TimeFormatContext);
  if (context === undefined) {
    throw new Error('useTimeFormat must be used within a TimeFormatProvider');
  }
  return context;
}
