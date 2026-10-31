import { SheetFooter } from './sheet-content';
import { BottomActionButton } from './ui/bottom-action-button';
import { Text } from './ui/text';

/** Explicit confirmation stays visible below the sheet's form. */
export function SheetConfirmFooter({
  onPress,
  disabled,
  label = 'Apply',
}: {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <SheetFooter>
      <BottomActionButton onPress={onPress} disabled={disabled}>
        <Text>{label}</Text>
      </BottomActionButton>
    </SheetFooter>
  );
}
