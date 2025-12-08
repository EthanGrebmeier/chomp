import { ScaleIcon } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { QuantityUnit } from '../types';

const unitOptions = [
  { label: 'Each', value: 'each' },
  { label: 'Kilogram', value: 'kg' },
  { label: 'Gram', value: 'g' },
  { label: 'Liter', value: 'l' },
  { label: 'Milliliter', value: 'ml' },
  { label: 'Pound', value: 'lb' },
] as const;

type UnitSelectorProps = {
  unit: string;
  onSelect: (unit: string) => void;
};

export const UnitSelector = ({ unit, onSelect }: UnitSelectorProps) => {
  const selectedUnit = unitOptions.find(opt => opt.value === unit);

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          icon={<Icon as={ScaleIcon} size={16} />}
          className="border border-border bg-none"
          textClassName="text-foreground"
        >
          {selectedUnit?.label ?? 'Select Unit'}
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {unitOptions.map(option => (
          <DropdownMenuCheckboxItem
            key={option.value}
            value={unit === option.value ? 'on' : 'off'}
            onValueChange={() => onSelect(option.value as QuantityUnit)}
          >
            <DropdownMenuItemTitle>{option.label}</DropdownMenuItemTitle>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
