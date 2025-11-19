import { Text as RNText, View } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';

import { RecipeList } from '@/features/recipes/components/recipe-list';
import { useRecipes } from '@/features/recipes/hooks';

import { Heading } from '../../components/text/heading';
import { CreateRecipeButton } from '../../features/recipes/components/create-recipe-button';
import { NATIVE_TABS_OFFSET } from '../../features/shared/consts';

export default function Recipes() {
  const { data: recipes, isLoading } = useRecipes();

  return (
    <View className="pt-safe flex-1 bg-background ">
      <View className="px-4">
        <Heading>Recipes</Heading>
      </View>
      <View
        className="absolute right-4 z-10"
        style={{ bottom: NATIVE_TABS_OFFSET }}
      >
        <CreateRecipeButton />
      </View>
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <RNText className="text-gray-500">Loading recipes...</RNText>
          </View>
        ) : (
          <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
            <RecipeList recipes={recipes ?? []} />
          </LayoutAnimationConfig>
        )}
      </View>
    </View>
  );
}
