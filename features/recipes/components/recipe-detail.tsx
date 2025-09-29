import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useDebounceCallback } from 'usehooks-ts';
import { TextDisplayInput } from '../../../components/text-input';
import { Text } from '../../../components/ui/text';
import { useAddRecipeToList } from '../hooks/useAddRecipeToList';
import { useUpdateRecipe } from '../hooks/useUpdateRecipe';
import { RecipeWithIngredients } from '../types';
import { AddIngredientSheet } from './add-ingredient-sheet';

type RecipeDetailProps = {
  recipe: RecipeWithIngredients;
  autofocus?: boolean;
};

export const RecipeDetail = ({
  recipe,
  autofocus = false,
}: RecipeDetailProps) => {
  const { mutate: addRecipeToList, isPending } = useAddRecipeToList();
  const { mutate: updateRecipe } = useUpdateRecipe();
  const hasClearedName = useRef(false);

  const [name, setName] = useState(recipe.name);
  const textInputRef = useRef<TextInput>(null);

  const debouncedUpdateDbRecipe = useDebounceCallback(updateRecipe, 500);

  useEffect(() => {
    if (autofocus && textInputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [autofocus]);

  const updateName = (text: string) => {
    setName(text);
    debouncedUpdateDbRecipe({ recipe: { ...recipe, name: text } });
  };

  const handleKeyPress = (e: any) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      autofocus &&
      !hasClearedName.current
    ) {
      // If backspace is pressed and we're in autofocus mode with default name, clear the entire title
      updateName('');
      hasClearedName.current = true;
    }
  };

  return (
    <View className="flex-1 gap-4">
      {/* Header */}
      <View className="px-4">
        <TextDisplayInput
          ref={textInputRef}
          onChangeText={updateName}
          value={name}
          multiline
          onKeyPress={handleKeyPress}
          className="align-text-top text-3xl font-bold"
        />
        {recipe.description && (
          <Text className="mt-2 text-lg text-muted-foreground">
            {recipe.description}
          </Text>
        )}
        <View className="mt-2 flex-row gap-4">
          <Text className="text-lg text-muted-foreground">
            {recipe.ingredients.length} ingredients
          </Text>
          {recipe.servings && (
            <Text className="text-lg text-muted-foreground">
              Serves {recipe.servings}
            </Text>
          )}
        </View>
      </View>

      {/* Ingredients */}
      <View className="flex-1 px-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xl font-semibold">Ingredients:</Text>
          <AddIngredientSheet recipeId={recipe.id} />
        </View>
        <View className="gap-2">
          {recipe.ingredients.map((ingredient, index) => (
            <View key={ingredient.id} className="flex-row items-center gap-2">
              <Text className="text-muted-foreground">{index + 1}.</Text>
              <Text className="flex-1 text-base">
                {ingredient.quantity} {ingredient.unit} {ingredient.name}
                {ingredient.notes && (
                  <Text className="text-muted-foreground">
                    ({ingredient.notes})
                  </Text>
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
