import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinkIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { cn } from '../../../lib/utils';

type RecipeUrlSheetProps = {
  sourceUrl?: string;
  onSelect: (sourceUrl?: string) => void;
  canGoBack?: boolean;
  disabled?: boolean;
};

export const RecipeUrlSheet = ({
  sourceUrl,
  onSelect,
  canGoBack = true,
  disabled = false,
}: RecipeUrlSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const draftUrlInput = useUncontrolledTextInput(sourceUrl ?? '');
  const {
    inputKey: draftUrlInputKey,
    defaultValue: draftUrlDefaultValue,
    handleChangeText: handleDraftUrlChange,
    getValue: getDraftUrl,
    reset: resetDraftUrl,
  } = draftUrlInput;

  useEffect(() => {
    resetDraftUrl(sourceUrl ?? '');
  }, [resetDraftUrl, sourceUrl]);

  const openSheet = () => {
    if (disabled) return;
    resetDraftUrl(sourceUrl ?? '');
    sheetRef.current?.present();
  };

  const handleSave = () => {
    onSelect(getDraftUrl().trim() || undefined);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <HapticPressable
        onPress={openSheet}
        hapticType="light"
        disabled={disabled}
      >
        <Pill
          className={cn(disabled && 'opacity-50')}
          textClassName={cn(disabled && 'text-muted-foreground')}
          icon={
            <Icon className="text-muted-foreground" as={LinkIcon} size={16} />
          }
          hasValue={!!sourceUrl}
          onClear={disabled ? undefined : () => onSelect(undefined)}
        >
          Recipe URL
        </Pill>
      </HapticPressable>

      <BottomSheet
        footer={
          <View className="px-10 pb-4">
            <Button onPress={handleSave}>
              <Text>Done</Text>
            </Button>
          </View>
        }
        ref={sheetRef}
        name="recipe-url-sheet"
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header
            className="mb-0"
            dismissButton={
              canGoBack && (
                <BackButton onPress={() => sheetRef.current?.dismiss()} />
              )
            }
            title="Recipe URL"
          />

          <View className="gap-4 pb-4">
            <BottomSheet.TextInput
              key={draftUrlInputKey}
              defaultValue={draftUrlDefaultValue}
              onChangeText={handleDraftUrlChange}
              onSubmitEditing={handleSave}
              placeholder="https://example.com/recipe"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
            />
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    </>
  );
};
