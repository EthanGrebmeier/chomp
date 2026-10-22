import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { useRecipe } from '../hooks/useRecipe';

import { RecipeDetail } from './recipe-detail';
import { RecipeDetailSkeleton } from './recipe-detail-skeleton';

type RecipeDetailSheetProps = {
  listId?: string;
};

export type RecipeDetailSheetRef = {
  present: (recipeId: string) => void;
  dismiss: () => void;
};

export const RecipeDetailSheet = forwardRef<
  RecipeDetailSheetRef,
  RecipeDetailSheetProps
>(({ listId }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [recipeId, setRecipeId] = useState<string | undefined>(undefined);

  const { data: recipe, isLoading } = useRecipe(recipeId);

  useImperativeHandle(ref, () => ({
    present: (nextRecipeId: string) => {
      setRecipeId(nextRecipeId);
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleDismiss = () => {
    setRecipeId(undefined);
  };

  return (
    <BottomSheet
      name="recipe-detail-sheet"
      ref={sheetRef}
      detents={[1]}
      scrollable
      viewClassName="flex-1"
      onDismiss={handleDismiss}
    >
      <BottomSheet.Header title="View recipe" className="px-4" />
      <View className="flex-1">
        {isLoading ? (
          <Animated.View
            key="skeleton"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <RecipeDetailSkeleton />
          </Animated.View>
        ) : !recipe ? (
          <Animated.View
            key="not-found"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1 items-center justify-center"
          >
            <Text className="text-muted-foreground">Recipe not found</Text>
          </Animated.View>
        ) : (
          <Animated.View
            key="content"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <RecipeDetail
              recipe={recipe}
              listId={listId}
              onClose={() => sheetRef.current?.dismiss()}
            />
          </Animated.View>
        )}
      </View>
    </BottomSheet>
  );
});

RecipeDetailSheet.displayName = 'RecipeDetailSheet';
