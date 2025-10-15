import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BottomSheet } from '../../../components/bottom-sheet';
import { useRecipes } from '../hooks/useRecipes';
import { RecipeWithIngredients } from '../types';

type RecipeSearchProps = {
  onItemSelect: (item: RecipeWithIngredients) => void;
  onBack: () => void;
  canGoBack: boolean;
};

export const RecipeSearch = ({
  onItemSelect,
  onBack,
  canGoBack,
}: RecipeSearchProps) => {
  const [search, setSearch] = useState('');
  const { data: recipes, isLoading } = useRecipes();
  const searchInputRef =
    useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);

  const filteredRecipes =
    recipes?.filter(recipe =>
      recipe.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, [onBack]);

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
      <BottomSheet.TextInput
        className="h-11 rounded-full border border-border bg-input px-4 text-foreground"
        placeholder="Search recipes"
        onChangeText={setSearch}
        value={search}
        ref={searchInputRef}
      />
      {filteredRecipes.length > 0 && (
        <View className="w-full px-4">
          <FlatList
            data={filteredRecipes}
            scrollEnabled
            renderItem={({ item }) => (
              <Pressable onPress={() => onItemSelect(item)}>
                <Text className="text-lg text-foreground">{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </Animated.View>
  );
};
