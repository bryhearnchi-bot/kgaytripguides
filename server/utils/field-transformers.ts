/**
 * Database Field Transformation Utilities
 *
 * PostgreSQL uses snake_case, but our API returns camelCase.
 * This module provides consistent transformation between the two conventions.
 */

export interface DbLocation {
  id: number;
  name: string;
  country: string;
  coordinates: any;
  description: string | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiLocation {
  id: number;
  name: string;
  country: string;
  coordinates: any;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbTalent {
  id: number;
  name: string;
  talent_category_id: number;
  bio: string | null;
  known_for: string | null;
  profile_image_url: string | null;
  social_links: any;
  website: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiTalent {
  id: number;
  name: string;
  talentCategoryId: number;
  bio: string | null;
  knownFor: string | null;
  profileImageUrl: string | null;
  socialLinks: any;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform database Location to API Location
 */
export function transformLocationToApi(dbLocation: DbLocation): ApiLocation {
  return {
    id: dbLocation.id,
    name: dbLocation.name,
    country: dbLocation.country,
    coordinates: dbLocation.coordinates,
    description: dbLocation.description,
    imageUrl: dbLocation.image_url,
    createdAt: dbLocation.created_at,
    updatedAt: dbLocation.updated_at,
  };
}

/**
 * Transform API Location to database Location
 */
export function transformLocationToDb(apiLocation: Partial<ApiLocation>): Partial<DbLocation> {
  const result: Partial<DbLocation> = {};

  if (apiLocation.id !== undefined) result.id = apiLocation.id;
  if (apiLocation.name !== undefined) result.name = apiLocation.name;
  if (apiLocation.country !== undefined) result.country = apiLocation.country;
  if (apiLocation.coordinates !== undefined) result.coordinates = apiLocation.coordinates;
  if (apiLocation.description !== undefined) result.description = apiLocation.description;
  if (apiLocation.imageUrl !== undefined) result.image_url = apiLocation.imageUrl;
  if (apiLocation.createdAt !== undefined) result.created_at = apiLocation.createdAt;
  if (apiLocation.updatedAt !== undefined) result.updated_at = apiLocation.updatedAt;

  return result;
}

/**
 * Transform database Talent to API Talent
 */
export function transformTalentToApi(dbTalent: DbTalent): ApiTalent {
  return {
    id: dbTalent.id,
    name: dbTalent.name,
    talentCategoryId: dbTalent.talent_category_id,
    bio: dbTalent.bio,
    knownFor: dbTalent.known_for,
    profileImageUrl: dbTalent.profile_image_url,
    socialLinks: dbTalent.social_links,
    website: dbTalent.website,
    createdAt: dbTalent.created_at,
    updatedAt: dbTalent.updated_at,
  };
}

/**
 * Transform API Talent to database Talent
 */
export function transformTalentToDb(apiTalent: Partial<ApiTalent>): Partial<DbTalent> {
  const result: Partial<DbTalent> = {};

  if (apiTalent.id !== undefined) result.id = apiTalent.id;
  if (apiTalent.name !== undefined) result.name = apiTalent.name;
  if (apiTalent.talentCategoryId !== undefined) result.talent_category_id = apiTalent.talentCategoryId;
  if (apiTalent.bio !== undefined) result.bio = apiTalent.bio;
  if (apiTalent.knownFor !== undefined) result.known_for = apiTalent.knownFor;
  if (apiTalent.profileImageUrl !== undefined) result.profile_image_url = apiTalent.profileImageUrl;
  if (apiTalent.socialLinks !== undefined) result.social_links = apiTalent.socialLinks;
  if (apiTalent.website !== undefined) result.website = apiTalent.website;
  if (apiTalent.createdAt !== undefined) result.created_at = apiTalent.createdAt;
  if (apiTalent.updatedAt !== undefined) result.updated_at = apiTalent.updatedAt;

  return result;
}

/**
 * Generic snake_case to camelCase transformation
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Generic camelCase to snake_case transformation
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Transform any object from snake_case to camelCase
 */
export function transformObjectToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformObjectToCamelCase);

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = typeof value === 'object' ? transformObjectToCamelCase(value) : value;
  }
  return result;
}

/**
 * Transform any object from camelCase to snake_case
 */
export function transformObjectToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformObjectToSnakeCase);

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = typeof value === 'object' ? transformObjectToSnakeCase(value) : value;
  }
  return result;
}