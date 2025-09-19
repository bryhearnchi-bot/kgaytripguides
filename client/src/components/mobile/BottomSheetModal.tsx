import React, { useState, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
  showHandle?: boolean;
}

export function BottomSheetModal({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.3, 0.6, 0.9],
  initialSnapPoint = 0.6,
  showHandle = true
}: BottomSheetModalProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startSnapPoint, setStartSnapPoint] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartSnapPoint(currentSnapPoint);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    const viewportHeight = window.innerHeight;
    const deltaSnapPoint = deltaY / viewportHeight;

    const newSnapPoint = Math.max(0, Math.min(1, startSnapPoint + deltaSnapPoint));
    setCurrentSnapPoint(newSnapPoint);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to nearest point
    const nearestSnapPoint = snapPoints.reduce((prev, curr) => {
      return Math.abs(curr - currentSnapPoint) < Math.abs(prev - currentSnapPoint) ? curr : prev;
    });

    if (nearestSnapPoint <= 0.1) {
      onClose();
    } else {
      setCurrentSnapPoint(nearestSnapPoint);
    }
  };

  if (!isOpen) return null;

  const bottomSheetHeight = `${currentSnapPoint * 100}vh`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: currentSnapPoint }}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 ease-out overflow-hidden"
        style={{
          height: bottomSheetHeight,
          transform: isDragging ? 'none' : undefined
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full cursor-grab active:cursor-grabbing" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}