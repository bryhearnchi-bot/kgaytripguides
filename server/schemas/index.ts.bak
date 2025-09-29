/**
 * Central Export Point for All Validation Schemas
 *
 * This file provides a convenient single import point for all validation schemas
 * used throughout the application.
 */

// Re-export specific schemas to avoid conflicts
// Common schemas
export {
  idParamSchema,
  slugParamSchema,
  uuidParamSchema,
  paginationSchema,
  cursorPaginationSchema,
  searchSchema,
  advancedSearchSchema,
  sortingSchema,
  dateRangeSchema,
  statusFilterSchema,
  emailSchema,
  passwordSchema,
  urlSchema,
  phoneSchema,
  coordinatesSchema,
  timeSchema,
  priceSchema,
  percentageSchema,
  bulkOperationSchema,
  responseFormatSchema,
  listRequestSchema,
  adminListRequestSchema,
  createEnumSchema,
  nullable,
  jsonSchema,
  csvSchema
} from './common';

// Trip and cruise schemas
export {
  createTripSchema,
  updateTripSchema,
  duplicateTripSchema,
  tripFilterSchema,
  tripStatusEnum,
  tripTypeEnum,
  createEventSchema,
  updateEventSchema,
  bulkEventsSchema,
  eventFilterSchema,
  eventTypeEnum,
  createItineraryStopSchema,
  updateItineraryStopSchema,
  bulkItinerarySchema,
  portSegmentEnum,
  cruiseInfoSectionSchema,
  exportTripSchema,
  importTripSchema,
  exportFormatEnum
} from './trips';

// Media and talent schemas
export {
  createTalentSchema,
  updateTalentSchema,
  talentAssignmentSchema,
  bulkTalentAssignSchema,
  talentFilterSchema,
  talentCategoryEnum,
  imageUploadSchema,
  imageFromUrlSchema,
  imageProcessingSchema,
  mediaGallerySchema,
  imageTypeEnum,
  partyTemplateSchema,
  partyTemplateFilterSchema,
  mediaFilterSchema,
  bulkMediaOperationSchema
} from './media';

// User management schemas
export {
  userRoleEnum,
  accountStatusEnum,
  authProviderEnum,
  userRegistrationSchema,
  createUserSchema,
  updateProfileSchema,
  adminUpdateUserSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  loginSchema,
  oauthLoginSchema,
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  updateUserStatusSchema,
  updateUserPermissionsSchema,
  sendInvitationSchema,
  acceptInvitationSchema,
  userFilterSchema,
  bulkUserOperationSchema,
  sessionManagementSchema
} from './users';

// Location schemas
export {
  createLocationSchema,
  updateLocationSchema,
  locationFilterSchema,
  locationTypeEnum,
  regionEnum,
  createShipSchema,
  updateShipSchema,
  shipFilterSchema,
  shipClassEnum,
  cruiseLineEnum,
  createVenueSchema,
  updateVenueSchema,
  venueTypeEnum
} from './locations';

// Import specific schemas for convenient access
import commonSchemas from './common';
import tripSchemas from './trips';
import mediaSchemas from './media';
import userSchemas from './users';
import locationSchemas from './locations';

// Export grouped schemas for organized access
export const schemas = {
  common: commonSchemas,
  trips: tripSchemas,
  media: mediaSchemas,
  users: userSchemas,
  locations: locationSchemas
};

// Default export for convenient importing
export default schemas;