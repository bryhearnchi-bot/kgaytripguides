import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('handles conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
    expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
  });

  it('handles tailwind merge conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('filters out falsy values', () => {
    expect(cn('valid', null, undefined, false, '')).toBe('valid');
  });

  it('handles arrays and objects', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
    expect(cn({ 'class1': true, 'class2': false })).toBe('class1');
  });
});