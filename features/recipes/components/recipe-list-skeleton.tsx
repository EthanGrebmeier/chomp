import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeBookSurface, RecipeRowSeparator } from './recipe-book-surface';
import { RecipeCardSkeleton } from './recipe-card-skeleton';

export const RecipeListSkeleton = () => {
  return (
    <SafeAreaView edges={['bottom']} className="flex-1">
      <RecipeBookSurface>
        <RecipeCardSkeleton />
        <RecipeRowSeparator />
        <RecipeCardSkeleton />
        <RecipeRowSeparator />
        <RecipeCardSkeleton />
        <RecipeRowSeparator />
        <RecipeCardSkeleton />
        <RecipeRowSeparator />
        <RecipeCardSkeleton />
      </RecipeBookSurface>
    </SafeAreaView>
  );
};
