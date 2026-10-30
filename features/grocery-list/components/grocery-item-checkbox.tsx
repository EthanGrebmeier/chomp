import type { SharedValue } from 'react-native-reanimated';

import { Checkbox } from '../../../components/ui/checkbox';

type Props = {
  checked: boolean;
  animatedChecked?: SharedValue<boolean>;
  onChange: (checked: boolean) => Promise<void>;
};

/** Key by item ID so a recycled row cannot inherit another item's pending action. */
export function GroceryItemCheckbox({
  checked,
  animatedChecked,
  onChange,
}: Props) {
  return (
    <Checkbox
      checked={checked}
      animatedChecked={animatedChecked}
      onPress={() => void onChange(!checked)}
      onCheckedChange={next => void onChange(next)}
      className="mr-1"
    />
  );
}
