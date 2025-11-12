import { useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { toast } from 'sonner-native';

import { TextInput } from '../../components/text-input';
import { HapticPressable } from '../../components/ui/haptic-pressable';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { useTheme } from '../../hooks/use-theme';
import { cn } from '../../lib/utils';
import { groceries } from '../grocery-list/consts/groceries';
import { useAddGroceryItem } from '../grocery-list/hooks/useAddGroceryListItem';
import { queryKeys } from '../grocery-list/query-keys';
import { BaseGroceryItem } from '../grocery-list/types';

type AddItemNewProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const AddItemNew = ({ isOpen, setIsOpen }: AddItemNewProps) => {
  const [input, setInput] = useState('');
  const theme = useTheme();
  const matchingItems =
    input.length > 0
      ? groceries
          .filter(item => item.name.toLowerCase().includes(input.toLowerCase()))
          .slice(0, 7)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const { mutate: addItem } = useAddGroceryItem();
  const queryClient = useQueryClient();
  const handleAddItem = (item: BaseGroceryItem) => {
    addItem(
      {
        name: item.name,
        quantity: 1,
        unit: 'each',
        category: item.category,
      },
      {
        onSuccess: () => {
          setInput('');
          toast.success(`${item.name} added to grocery list`);
          queryClient.invalidateQueries({ queryKey: queryKeys.items() });
        },
      }
    );
  };

  useEffect(() => {
    if (!isOpen) {
      KeyboardController.dismiss();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setInput('');
    KeyboardController.dismiss();
  };

  return (
    <>
      {isOpen && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 z-[5] bg-black/10"
        >
          <Pressable
            onPress={handleClose}
            className="absolute bottom-0 left-0 right-0 top-0 "
          />
        </Animated.View>
      )}
      <KeyboardStickyView
        style={[style.container]}
        offset={{
          opened: 48,
        }}
      >
        <View>
          <TextInput
            placeholder="Add item"
            placeholderTextColor={theme.mutedForeground}
            className="z-10 border border-border bg-muted font-semibold"
            value={input}
            onChangeText={setInput}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              setIsOpen(false);
              setInput('');
            }}
            returnKeyType="none"
          />
          {isOpen && input.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              className="absolute right-2 top-1/2 z-10 size-8 -translate-y-1/2  items-center justify-center rounded-full bg-primary"
            >
              <HapticPressable
                className="items-center justify-center"
                onPress={() => handleAddItem({ name: input })}
              >
                <Icon
                  as={PlusIcon}
                  size={20}
                  className="text-primary-foreground"
                />
              </HapticPressable>
            </Animated.View>
          )}
        </View>
        {isOpen && input.length > 0 && (
          <GestureDetector
            gesture={Gesture.Pan().onUpdate(event => {
              'worklet';
              if (event.translationY > 10) {
                scheduleOnRN(handleClose);
              }
            })}
          >
            <Animated.View
              entering={FadeInDown.duration(300)}
              className=" z-10 mb-4 gap-1"
            >
              {matchingItems.map(item => (
                <Animated.View key={item.name} entering={FadeIn.duration(300)}>
                  <Pressable
                    className={cn(
                      'flex-row items-center justify-between self-start rounded-xl border border-border bg-muted px-1.5 py-1'
                    )}
                    onPress={() => handleAddItem(item)}
                  >
                    <Text className={cn('font-medium text-foreground')}>
                      {item.name}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </Animated.View>
          </GestureDetector>
        )}
      </KeyboardStickyView>
    </>
  );
};

const style = StyleSheet.create({
  container: {
    flexDirection: 'column-reverse',
    position: 'absolute',
    display: 'flex',
    columnGap: 16,
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
});
