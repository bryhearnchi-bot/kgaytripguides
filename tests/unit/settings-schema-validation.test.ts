import { describe, it, expect } from 'vitest';
import { settings, insertSettingsSchema, type Settings, type InsertSettings } from '../shared/schema';

describe('Settings Schema Validation', () => {
  it('should have correct table structure', () => {
    // Verify table exists and has expected structure
    expect(settings).toBeDefined();
    expect(settings._).toBeDefined();
    expect(settings._.name).toBe('settings');
  });

  it('should have correct column definitions', () => {
    const columns = settings._.columns;

    // Check required columns exist
    expect(columns.id).toBeDefined();
    expect(columns.category).toBeDefined();
    expect(columns.key).toBeDefined();
    expect(columns.label).toBeDefined();
    expect(columns.value).toBeDefined();
    expect(columns.metadata).toBeDefined();
    expect(columns.isActive).toBeDefined();
    expect(columns.orderIndex).toBeDefined();
    expect(columns.createdBy).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it('should have proper type inference for Settings', () => {
    // Test that Settings type is properly inferred
    const mockSettings: Settings = {
      id: 1,
      category: 'trip_types',
      key: 'cruise',
      label: 'Cruise',
      value: null,
      metadata: null,
      isActive: true,
      orderIndex: 0,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockSettings.id).toBe(1);
    expect(mockSettings.category).toBe('trip_types');
    expect(mockSettings.key).toBe('cruise');
  });

  it('should have proper type inference for InsertSettings', () => {
    // Test that InsertSettings type properly omits auto-generated fields
    const mockInsertSettings: InsertSettings = {
      category: 'trip_types',
      key: 'cruise',
      label: 'Cruise',
      value: null,
      metadata: null,
      isActive: true,
      orderIndex: 0,
      createdBy: null,
    };

    expect(mockInsertSettings.category).toBe('trip_types');
    expect(mockInsertSettings.key).toBe('cruise');

    // These fields should not be assignable in InsertSettings
    // @ts-expect-error - id should not be assignable
    mockInsertSettings.id = 1;
    // @ts-expect-error - createdAt should not be assignable
    mockInsertSettings.createdAt = new Date();
    // @ts-expect-error - updatedAt should not be assignable
    mockInsertSettings.updatedAt = new Date();
  });

  it('should validate insert schema with Zod', () => {
    const validData = {
      category: 'trip_types',
      key: 'cruise',
      label: 'Cruise',
      value: null,
      metadata: null,
      isActive: true,
      orderIndex: 0,
      createdBy: null,
    };

    const result = insertSettingsSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidData = {
      // Missing required fields
      category: 'trip_types',
      // key is missing
      label: 'Cruise',
    };

    const invalidResult = insertSettingsSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });

  it('should have proper indexes and constraints', () => {
    const config = settings._.config;

    // Verify that indexes are defined
    expect(config.indexes).toBeDefined();
    expect(Array.isArray(config.indexes)).toBe(true);
    expect(config.indexes.length).toBeGreaterThan(0);
  });
});