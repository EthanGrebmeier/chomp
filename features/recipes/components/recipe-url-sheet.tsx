import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinkIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';

type RecipeUrlSheetProps = {
  sourceUrl?: string;
  onSelect: (sourceUrl?: string) => void;
  canGoBack?: boolean;
};

export const RecipeUrlSheet = ({
  sourceUrl,
  onSelect,
  canGoBack = true,
}: RecipeUrlSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [draftUrl, setDraftUrl] = useState(sourceUrl ?? '');

  useEffect(() => {
    setDraftUrl(sourceUrl ?? '');
  }, [sourceUrl]);

  const openSheet = () => {
    setDraftUrl(sourceUrl ?? '');
    sheetRef.current?.present();
  };

  const handleSave = () => {
    onSelect(draftUrl.trim() || undefined);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <HapticPressable onPress={openSheet} hapticType="light">
        <Pill
          icon={
            <Icon className="text-muted-foreground" as={LinkIcon} size={16} />
          }
          hasValue={!!sourceUrl}
          onClear={() => onSelect(undefined)}
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
              value={draftUrl}
              onChangeText={setDraftUrl}
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
