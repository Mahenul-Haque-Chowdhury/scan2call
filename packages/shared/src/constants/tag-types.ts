// Tag Types
export const TagType = {
  PET_COLLAR: 'PET_COLLAR',
  CAR_STICKER: 'CAR_STICKER',
  LUGGAGE_TAG: 'LUGGAGE_TAG',
  KEYCHAIN: 'KEYCHAIN',
  MEDICAL_BAND: 'MEDICAL_BAND',
  GENERIC: 'GENERIC',
} as const;
export type TagType = (typeof TagType)[keyof typeof TagType];

// Tag Status
export const TagStatus = {
  INACTIVE: 'INACTIVE',
  ACTIVE: 'ACTIVE',
  LOST: 'LOST',
  FOUND: 'FOUND',
  DEACTIVATED: 'DEACTIVATED',
} as const;
export type TagStatus = (typeof TagStatus)[keyof typeof TagStatus];

// Tag type display labels
export const TAG_TYPE_LABELS: Record<TagType, string> = {
  PET_COLLAR: 'Pet Collar Tag',
  CAR_STICKER: 'Car Windshield Sticker',
  LUGGAGE_TAG: 'Luggage Tag',
  KEYCHAIN: 'Keychain Tag',
  MEDICAL_BAND: 'Medical / ID Band',
  GENERIC: 'Generic Tag',
};
