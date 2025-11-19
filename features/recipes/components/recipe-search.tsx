import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ArrowLeftIcon, SearchIcon } from 'lucide-react-native';
import { RefObject, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import { navigation } from '../../../lib/navigation';
import { useCreateRecipe } from '../hooks/useCreateRecipe';
import { useRecipes } from '../hooks/useRecipes';

type RecipeSearchProps = {
  onItemSelect: (recipe: { id: string; name: string }) => void;
  onBack: () => void;
  canGoBack: boolean;
  sheetRef: RefObject<TrueSheet | null>;
};

export const RecipeSearch = ({
  onItemSelect,
  onBack,
  canGoBack,
  sheetRef,
}: RecipeSearchProps) => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: recipes } = useRecipes();
  const searchInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const { mutate: createRecipe } = useCreateRecipe();

  const filteredRecipes =
    recipes?.filter(recipe =>
      recipe.name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  const handleCreateNewRecipe = () => {
    createRecipe(
      {
        recipe: {
          name: search,
          description: '',
        },
        ingredients: [],
      },
      {
        onSuccess: ({ id }) => {
          setSearch('');
          onItemSelect({ id, name: search });

          toast.custom(
            <View className="px-4">
              <View className="flex-row items-center justify-between gap-4 rounded-full border border-border bg-muted py-2 pl-6 pr-2">
                <Text className="text-sm font-medium text-foreground">
                  <Text className="font-semibold capitalize text-foreground">
                    {search}
                  </Text>{' '}
                  created
                </Text>
                <Button
                  variant="default"
                  size="sm"
                  onPress={() => {
                    router.push(navigation.goToRecipe(id));
                  }}
                >
                  <Text>View Recipe</Text>
                </Button>
              </View>
            </View>
          );
        },
      }
    );
  };

  return (
    <Animated.View
      entering={canGoBack ? FadeIn : undefined}
      exiting={FadeOut}
      className="h-[300] w-full gap-4"
    >
      {canGoBack && (
        <Pressable onPress={onBack} className="flex-row items-center gap-2">
          <Icon as={ArrowLeftIcon} size={16} />
          <Text className="text-sm font-bold text-foreground">Back</Text>
        </Pressable>
      )}
      <BottomSheet.Header title="Select a Recipe" />
      <View>
        <BottomSheet.TextInput
          className="border border-border bg-input px-4 pl-8 text-foreground"
          onChangeText={setSearch}
          value={search}
          placeholder="Search for or create a recipe"
          ref={searchInputRef}
          clearButtonMode="always"
        />
        <View className="absolute left-2 top-1/2 -translate-y-1/2">
          <Icon as={SearchIcon} size={16} color={theme.foreground} />
        </View>
      </View>
      {filteredRecipes.length > 0 ? (
        <FlatList
          className="min-h-[240]"
          contentContainerClassName="pb-safe"
          data={filteredRecipes}
          keyExtractor={item => item.id}
          scrollEnabled
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onItemSelect({ id: item.id, name: item.name })}
              className="py-1"
            >
              <View className="flex-row justify-between">
                <Text className="text-lg text-foreground">{item.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {item.ingredients.length} ingredients
                </Text>
              </View>
            </Pressable>
          )}
        />
      ) : search.length > 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <Text className="text-muted-foreground">
            No recipes found for &quot;{search}&quot;
          </Text>
          <Button variant="default" onPress={handleCreateNewRecipe}>
            <Text>Create Recipe</Text>
          </Button>
        </View>
      ) : null}
    </Animated.View>
  );
};
