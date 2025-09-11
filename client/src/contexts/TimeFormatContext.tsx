import React, { createContext, useContext, useState, useEffect } from 'react';

type TimeFormat = '12h' | '24h';

interface TimeFormatContextType {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  toggleTimeFormat: () => void;
}

const TimeFormatContext = createContext<TimeFormatContextType | undefined>(undefined);

export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('12h');

  // Load saved preference from localStorage on mount
  useEffect(() => {
    const savedFormat = localStorage.getItem('timeFormat') as TimeFormat;
    if (savedFormat === '12h' || savedFormat === '24h') {
      setTimeFormatState(savedFormat);
    }
  }, []);

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
    <TimeFormatContext.Provider value={{
      timeFormat,
      setTimeFormat,
      toggleTimeFormat
    }}>
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