import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { MealTimeSheet } from '../../meal-planner/components/meal-time-sheet';

import { RecipeUrlSheet } from './recipe-url-sheet';

type CreateRecipeSheetProps = {
  onSubmit: (data: {
    name: string;
    mealTag?: string;
    description?: string;
    sourceUrl?: string;
  }) => void;
  onClose?: () => void;
  defaultValues?: {
    name: string;
    mealTag?: string;
    description?: string;
    sourceUrl?: string;
  } | null;
};

export type CreateRecipeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const CreateRecipeSheet = forwardRef<
  CreateRecipeSheetRef,
  CreateRecipeSheetProps
>(({ onSubmit, onClose, defaultValues }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [mealTag, setMealTag] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState(
    defaultValues?.description ?? ''
  );
  const [sourceUrl, setSourceUrl] = useState(defaultValues?.sourceUrl ?? '');
  const nameInputRef = useRef<TextInput>(null);
  const isEditing = !!defaultValues;

  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset or set initial values when opening
      setName(defaultValues?.name ?? '');
      setMealTag(defaultValues?.mealTag ?? undefined);
      setDescription(defaultValues?.description ?? '');
      setSourceUrl(defaultValues?.sourceUrl ?? '');
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      mealTag,
      description: description.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
    });
    sheetRef.current?.dismiss();
  };

  const handleClose = () => {
    KeyboardController.dismiss();
    onClose?.();
  };

  return (
    <BottomSheet
      name="create-recipe-sheet"
      ref={sheetRef}
      onStartClose={handleClose}
      footer={
        <View className="px-10 pb-4">
          <Button onPress={handleSubmit} disabled={!name.trim()}>
            <Text>{isEditing ? 'Update Recipe' : 'Create Recipe'}</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        <BottomSheet.Header
          className="mb-0"
          title={isEditing ? 'Edit Recipe' : 'Create Recipe'}
        />

        <View>
          <View>
            <BottomSheet.BareTextInput
              ref={nameInputRef}
              value={name}
              onChangeText={setName}
              placeholder="Recipe name"
              className="text-2xl font-bold "
              autoFocus
              autoCapitalize="words"
            />
          </View>
          <View>
            <BottomSheet.BareTextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
              numberOfLines={5}
              className="h-24 text-lg font-medium"
            />
          </View>
          <MetaBarLayout>
            <ScrollingMetaBar>
              <MealTimeSheet mealTime={mealTag} onSelect={setMealTag} />
              <RecipeUrlSheet
                sourceUrl={sourceUrl}
                onSelect={url => setSourceUrl(url ?? '')}
              />
            </ScrollingMetaBar>
          </MetaBarLayout>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

CreateRecipeSheet.displayName = 'CreateRecipeSheet';
