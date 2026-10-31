import { View } from 'react-native';

import { SheetHeader } from '@/components/sheet-header';
import { BackButton } from '@/components/ui/back-button';
import { CloseButton } from '@/components/ui/close-button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

import { RecipeIngredientSkeleton } from './recipe-ingredient-skeleton';

/** Mirrors the fixed recipe title and dismiss control. */
export const RecipeDetailSkeleton = ({ onClose }: { onClose?: () => void }) => {
  return (
    <View className="flex-1 bg-background">
      <SheetHeader
        title={<Skeleton className="h-9 w-4/5 rounded-md" />}
        backAction={!onClose ? <BackButton /> : undefined}
        closeAction={onClose ? <CloseButton onPress={onClose} /> : undefined}
      />

      <View className="flex-1 gap-6 pt-2">
        {/* Overview */}
        <View className="gap-3 px-8">
          <View className="items-start gap-2">
            <Skeleton className="h-6 w-20 rounded-lg" />
          </View>
          <View className="gap-2">
            <SkeletonText width="full" height="md" />
            <SkeletonText width="lg" height="md" />
          </View>
        </View>

        {/* Ingredients */}
        <View className="gap-1">
          <View className="h-9 justify-center px-8">
            <SkeletonText width="sm" height="xs" />
          </View>
          <RecipeIngredientSkeleton showNotes />
          <RecipeIngredientSkeleton />
          <RecipeIngredientSkeleton showTag={false} />
          <RecipeIngredientSkeleton />
          <RecipeIngredientSkeleton />
        </View>
      </View>
    </View>
  );
};
