import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { BareTextInput, TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useUncontrolledTextInput } from '@/components/use-uncontrolled-text-input';
import { cn } from '@/lib/utils';

const mealTimeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

export type CreateRecipePageFormData = {
  name: string;
  mealTag?: string;
  description?: string;
  sourceUrl?: string;
};

type CreateRecipePageFormProps = {
  initialName?: string;
  isPending?: boolean;
  onSubmit: (data: CreateRecipePageFormData) => void;
};

export const CreateRecipePageForm = ({
  initialName = '',
  isPending = false,
  onSubmit,
}: CreateRecipePageFormProps) => {
  const nameInput = useUncontrolledTextInput(initialName);
  const descriptionInput = useUncontrolledTextInput();
  const sourceUrlInput = useUncontrolledTextInput();
  const [mealTag, setMealTag] = useState<string | undefined>();
  const [canSubmit, setCanSubmit] = useState(Boolean(initialName.trim()));

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

  return (
    <View className="flex-1 gap-6">
      <ScrollView
        keyboardDismissMode="on-drag"
        className="flex-1 "
        contentContainerClassName="gap-6"
      >
        <View>
          <BareTextInput
            key={nameInput.inputKey}
            defaultValue={nameInput.defaultValue}
            onChangeText={handleNameChange}
            placeholder="Recipe name"
            className="text-3xl font-bold leading-10"
            autoCapitalize="words"
            returnKeyType="next"
            autoFocus
          />
        </View>

        <View>
          <BareTextInput
            key={descriptionInput.inputKey}
            defaultValue={descriptionInput.defaultValue}
            onChangeText={descriptionInput.handleChangeText}
            placeholder="Description"
            multiline
            numberOfLines={5}
            className="min-h-28 text-lg font-medium"
            textAlignVertical="top"
          />
        </View>

        <View className="gap-3">
          <Text className="text-sm font-medium text-muted-foreground">
            Meal time
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Button
              variant={!mealTag ? 'default' : 'outline'}
              onPress={() => setMealTag(undefined)}
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
                >
                  <Text>{option}</Text>
                </Button>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">
            Recipe URL
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
            className="rounded-xl"
          />
        </View>
      </ScrollView>

      <KeyboardStickyView>
        <Button
          size="xl"
          onPress={handleSubmit}
          disabled={!canSubmit || isPending}
          className={cn(isPending && 'opacity-70')}
        >
          <Text>{isPending ? 'Creating Recipe...' : 'Create Recipe'}</Text>
        </Button>
      </KeyboardStickyView>
    </View>
  );
};
