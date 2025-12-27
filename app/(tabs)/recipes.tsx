import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig } from 'react-native-reanimated';

import { RecipeList } from '@/features/recipes/components/recipe-list';
import { RecipeListSkeleton } from '@/features/recipes/components/recipe-list-skeleton';
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
        className="absolute right-6 z-10"
        style={{ bottom: NATIVE_TABS_OFFSET }}
      >
        <CreateRecipeButton />
      </View>
      <View className="flex-1">
        {isLoading ? (
          <Animated.View
            key="skeleton"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <RecipeListSkeleton />
          </Animated.View>
        ) : (
          <Animated.View
            key="content"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
              <RecipeList recipes={recipes ?? []} />
            </LayoutAnimationConfig>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
