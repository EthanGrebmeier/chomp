import { BookmarkIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, {
  cubicBezier,
  useReducedMotion,
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { cn } from '../../../lib/utils';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { DeleteSavedItemButton } from '../delete-saved-item-button';
import { hasSavedItemLink } from '../saved-item-intent';
import { useItemSheet } from '../use-item-sheet';

const DeleteSavedItemTrigger = ({ onPress }: { onPress: () => void }) => {
  const { hasItemTitle } = useItemSheet();

  return (
    <HapticPressable
      accessibilityRole="button"
      accessibilityLabel="Delete saved item"
      accessibilityState={{ disabled: !hasItemTitle }}
      disabled={!hasItemTitle}
      onPress={onPress}
      className={cn(
        'size-11 items-center justify-center rounded-full active:opacity-60',
        !hasItemTitle && 'opacity-50'
      )}
    >
      <Icon as={Trash2Icon} size={20} className="text-destructive" />
    </HapticPressable>
  );
};

export const SavedItemActions = () => {
  const { saveItem, setSaveItem, hasItemTitle, selectedItem } = useItemSheet();
  const isSync = hasSavedItemLink(selectedItem);
  const reducedMotion = useReducedMotion();

  const toggleSave = () => {
    const nextSaveItem = !saveItem;
    setSaveItem(nextSaveItem);
    if (nextSaveItem) {
      toast(isSync ? 'Updates will be saved' : 'This item will be saved');
    }
  };

  return (
    <View className="h-11 w-[88px]">
      {(['save', 'sync'] as const).map(action => {
        const isSyncAction = action === 'sync';
        const active = isSyncAction === isSync;

        return (
          <Animated.View
            key={action}
            className="absolute right-0 top-0 flex-row items-center"
            pointerEvents={active ? 'auto' : 'none'}
            accessibilityElementsHidden={!active}
            importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
            style={{
              opacity: active ? 1 : 0,
              transitionProperty: 'opacity',
              transitionDuration: reducedMotion ? 0 : 140,
              transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
            }}
          >
            <HapticPressable
              accessibilityRole="switch"
              accessibilityLabel={isSyncAction ? 'Sync changes' : 'Save item'}
              accessibilityState={{
                checked: saveItem,
                disabled: !hasItemTitle || !active,
              }}
              disabled={!hasItemTitle || !active}
              onPress={toggleSave}
              className={cn(
                'size-11 items-center justify-center rounded-full active:opacity-60',
                !hasItemTitle && 'opacity-50'
              )}
            >
              <Icon
                as={isSyncAction ? RefreshCwIcon : BookmarkIcon}
                size={20}
                fill={saveItem && !isSyncAction ? 'currentColor' : 'none'}
                strokeWidth={saveItem && isSyncAction ? 3 : 2}
                className={saveItem ? 'text-primary' : 'text-muted-foreground'}
              />
            </HapticPressable>
            {isSyncAction ? (
              active ? (
                <DeleteSavedItemButton Trigger={DeleteSavedItemTrigger} />
              ) : (
                // Retain only the outgoing visual, never a stale delete action.
                <View
                  className={cn(
                    'size-11 items-center justify-center',
                    !hasItemTitle && 'opacity-50'
                  )}
                >
                  <Icon
                    as={Trash2Icon}
                    size={20}
                    className="text-destructive"
                  />
                </View>
              )
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
};
