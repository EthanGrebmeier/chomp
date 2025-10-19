import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ArrowLeftIcon, SearchIcon } from 'lucide-react-native';
import { RefObject, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import { useRecipes } from '../hooks/useRecipes';
import { RecipeWithIngredients } from '../types';
import { CreateRecipeButton } from './create-recipe-button';

type RecipeSearchProps = {
  onItemSelect: (item: RecipeWithIngredients) => void;
  onBack: () => void;
  canGoBack: boolean;
  sheetRef: RefObject<BottomSheetModal | null>;
};

export const RecipeSearch = ({
  onItemSelect,
  onBack,
  canGoBack,
  sheetRef,
}: RecipeSearchProps) => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: recipes, isLoading } = useRecipes();
  const searchInputRef =
    useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);

  const filteredRecipes =
    recipes?.filter(recipe =>
      recipe.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

  return (
    <Animated.View
      entering={canGoBack ? FadeIn : undefined}
      exiting={FadeOut}
      className="h-[300] w-full gap-2"
    >
      {canGoBack && (
        <Pressable onPress={onBack} className="flex-row items-center gap-2">
          <ArrowLeftIcon size={16} />
          <Text className="text-sm font-bold text-foreground">Back</Text>
        </Pressable>
      )}
      <BottomSheet.Header
        title="Search Recipes"
        button={
          <Pressable onPress={() => sheetRef.current?.dismiss()}>
            <CreateRecipeButton />
          </Pressable>
        }
      />
      <View>
        <BottomSheet.TextInput
          className="border border-border bg-input px-4 pl-8 text-foreground"
          onChangeText={setSearch}
          value={search}
          ref={searchInputRef}
        />
        <View className="absolute left-2 top-1/2 -translate-y-1/2">
          <SearchIcon size={16} color={theme.foreground} />
        </View>
      </View>
      {filteredRecipes.length > 0 ? (
        <FlatList
          className="min-h-[240]"
          contentContainerClassName="pb-4"
          data={filteredRecipes}
          scrollEnabled
          renderItem={({ item }) => (
            <Pressable onPress={() => onItemSelect(item)}>
              <View className="flex-1 flex-row justify-between">
                <Text className="text-lg text-foreground">{item.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {item.ingredients.length} ingredients
                </Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-muted-foreground">No recipes found</Text>
        </View>
      )}
    </Animated.View>
  );
};
