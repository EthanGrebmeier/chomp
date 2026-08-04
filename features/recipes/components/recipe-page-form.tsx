import { useRef, useState } from 'react';
import { TextInput as RNTextInput, ScrollView, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { cn } from '@/lib/utils';

const mealTimeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

export type RecipePageFormData = {
  name: string;
  mealTag?: string;
  description?: string;
  sourceUrl?: string;
};

type RecipePageFormProps = {
  initialValues?: Partial<RecipePageFormData>;
  isPending?: boolean;
  mode: 'create' | 'edit';
  onSubmit: (data: RecipePageFormData) => void;
};

export const RecipePageForm = ({
  initialValues,
  isPending = false,
  mode,
  onSubmit,
}: RecipePageFormProps) => {
  const nameInput = useUncontrolledTextInput(initialValues?.name ?? '');
  const descriptionInput = useUncontrolledTextInput(
    initialValues?.description ?? ''
  );
  const sourceUrlInput = useUncontrolledTextInput(
    initialValues?.sourceUrl ?? ''
  );
  const [mealTag, setMealTag] = useState(initialValues?.mealTag);
  const [canSubmit, setCanSubmit] = useState(
    Boolean(initialValues?.name?.trim())
  );
  const descriptionInputRef = useRef<RNTextInput>(null);
  const bottomInset = useSafeAreaInsets().bottom;
  const isEditing = mode === 'edit';

  const handleNameChange = (text: string) => {
    nameInput.handleChangeText(text);
    setCanSubmit(Boolean(text.trim()));
  };

  const handleSubmit = () => {
    const name = nameInput.getValue().trim();
    if (!name) return;

    onSubmit({
      name,
      mealTag,
      description: descriptionInput.getValue().trim() || undefined,
      sourceUrl: sourceUrlInput.getValue().trim() || undefined,
    });
  };

  const pendingLabel = isEditing ? 'Updating Recipe...' : 'Creating Recipe...';
  const submitLabel = isEditing ? 'Update Recipe' : 'Create Recipe';

  return (
    <View className="flex-1">
      <ScrollView
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerClassName="gap-8 pb-6"
      >
        <View className="gap-2">
          <Text variant="label" className="text-muted-foreground">
            Recipe name
          </Text>
          <TextInput
            key={nameInput.inputKey}
            defaultValue={nameInput.defaultValue}
            onChangeText={handleNameChange}
            placeholder="Recipe name"
            className="h-14 rounded-2xl px-4 text-lg font-semibold leading-6"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => descriptionInputRef.current?.focus()}
            accessibilityLabel="Recipe name"
            autoFocus
          />
        </View>

        <View className="gap-2">
          <Text variant="label" className="text-muted-foreground">
            Description
          </Text>
          <TextInput
            key={descriptionInput.inputKey}
            ref={descriptionInputRef}
            defaultValue={descriptionInput.defaultValue}
            onChangeText={descriptionInput.handleChangeText}
            placeholder="Add a short description (optional)"
            multiline
            numberOfLines={5}
            clearable={false}
            className="h-28 rounded-2xl px-4 py-3 text-base leading-6"
            textAlignVertical="top"
            accessibilityLabel="Recipe description"
          />
        </View>

        <View className="gap-2">
          <Text variant="label" className="text-muted-foreground">
            Meal time
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Button
              variant={!mealTag ? 'default' : 'outline'}
              onPress={() => setMealTag(undefined)}
              className="h-8 px-4"
            >
              <Text>Any</Text>
            </Button>
            {mealTimeOptions.map(option => {
              const isSelected = mealTag === option;

              return (
                <Button
                  key={option}
                  variant={isSelected ? 'default' : 'outline'}
                  onPress={() => setMealTag(isSelected ? undefined : option)}
                  className="h-8 px-4"
                >
                  <Text>{option}</Text>
                </Button>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text variant="label" className="text-muted-foreground">
            Source URL
          </Text>
          <TextInput
            key={sourceUrlInput.inputKey}
            defaultValue={sourceUrlInput.defaultValue}
            onChangeText={sourceUrlInput.handleChangeText}
            placeholder="https://example.com/recipe"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            className="h-12 rounded-2xl px-4"
            accessibilityLabel="Recipe source URL"
          />
        </View>
      </ScrollView>

      <KeyboardStickyView
        offset={{
          closed: 0,
          opened: bottomInset - 12,
        }}
      >
        <View
          className="bg-background pt-3"
          style={{ paddingBottom: bottomInset }}
        >
          <Button
            size="xl"
            onPress={handleSubmit}
            disabled={!canSubmit || isPending}
            className={cn(isPending && 'opacity-70')}
          >
            <Text>{isPending ? pendingLabel : submitLabel}</Text>
          </Button>
        </View>
      </KeyboardStickyView>
    </View>
  );
};
