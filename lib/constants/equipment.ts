export const EQUIPMENT_CATEGORIES = [
  'Tractor',
  'Truck',
  'Mower',
  'Implement',
  'Other'
] as const;

export const SERVICE_TYPES = [
  'Oil Change',
  'Filter Change',
  'Tire Rotation/Check',
  'Grease/Lubrication',
  'Inspection',
  'Other'
] as const;

export type EquipmentCategory = typeof EQUIPMENT_CATEGORIES[number];
export type ServiceTypeOption = typeof SERVICE_TYPES[number];
