import { startTransition, useOptimistic } from 'react';
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
  const [displayedChecked, setDisplayedChecked] = useOptimistic(checked);

  const handlePress = () => {
    const next = !displayedChecked;
    startTransition(async () => {
      setDisplayedChecked(next);
      await onChange(next);
    });
  };

  return (
    <Checkbox
      checked={displayedChecked}
      animatedChecked={animatedChecked}
      onPress={handlePress}
      className="mr-1"
    />
  );
}
