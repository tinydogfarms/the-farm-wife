export const LIVESTOCK_SPECIES = [
  'Cattle',
  'Sheep',
  'Goat',
  'Pig',
  'Horse',
  'Poultry',
  'Other'
] as const;

export const CARE_TYPES = [
  'Vaccination',
  'Deworming',
  'Hoof Trimming',
  'Other'
] as const;

export type LivestockSpeciesOption = typeof LIVESTOCK_SPECIES[number];
export type CareTypeOption = typeof CARE_TYPES[number];
