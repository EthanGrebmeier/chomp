export const MAX_UNIT_LENGTH = 16;
export const DEFAULT_UNIT_VALUE = 'each';
export const CUSTOM_UNIT_VALUE = 'custom';

export type UnitOption = {
  label: string;
  value: string;
};

export const UNIT_OPTIONS: UnitOption[] = [
  { label: 'Custom', value: 'custom' },
  { label: 'Each', value: 'each' },
  { label: 'Teaspoon', value: 'tsp' },
  { label: 'Tablespoon', value: 'tbsp' },
  { label: 'Fluid Ounce', value: 'fl oz' },
  { label: 'Cup', value: 'cup' },
  { label: 'Pint', value: 'pt' },
  { label: 'Quart', value: 'qt' },
  { label: 'Gallon', value: 'gal' },
  { label: 'Milliliter', value: 'ml' },
  { label: 'Liter', value: 'l' },
  { label: 'Gram', value: 'g' },
  { label: 'Kilogram', value: 'kg' },
  { label: 'Ounce', value: 'oz' },
  { label: 'Pound', value: 'lb' },
  { label: 'Pinch', value: 'pinch' },
  { label: 'Dash', value: 'dash' },
  { label: 'Clove', value: 'clove' },
  { label: 'Slice', value: 'slice' },
  { label: 'Piece', value: 'piece' },
  { label: 'Can', value: 'can' },
  { label: 'Jar', value: 'jar' },
  { label: 'Package', value: 'pkg' },
  { label: 'Bottle', value: 'bottle' },
  { label: 'Bunch', value: 'bunch' },
  { label: 'Stick', value: 'stick' },
  { label: 'Bag', value: 'bag' },
  { label: 'Box', value: 'box' },
];
