import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Heading } from '@/components/text/heading';
import { AddButton } from '@/components/ui/add-button';
import { BackButton } from '@/components/ui/back-button';
import { Text } from '@/components/ui/text';
import { useCategoryOptions } from '@/features/categories/use-category-options';
import { SavedItemsListSkeleton } from '@/features/saved-items/components/saved-items-list-skeleton';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

import { CategoriesList } from './categories-list';
import {
  CategorySheetProvider,
  useCategorySheet,
} from './create-category-sheet';

type CategoriesScreenProps = {
  onBack?: () => void;
};

function CategoriesContent({ onBack }: CategoriesScreenProps) {
  const { data: categories, isLoading } = useCategoryOptions();
  const { present } = useCategorySheet();
  const { status } = useInstantAuthState();
  const canEditCategories = status === 'signed-in';

  return (
    <View className="flex-1 bg-background pt-6">
      <View className="flex-row items-center gap-3 px-4">
        <BackButton onPress={onBack} href="/settings" />
        <View className="flex-1 gap-1">
          <Heading>My Categories</Heading>
          <Text variant="caption">
            {canEditCategories
              ? 'Tap a category to edit or delete it.'
              : 'Sign in to add or edit categories.'}
          </Text>
        </View>
        {canEditCategories ? (
          <AddButton
            accessibilityLabel="Add category"
            onPress={() => present()}
          />
        ) : null}
      </View>

      <View className="mt-2 flex-1">
        {isLoading ? (
          <Animated.View
            key="skeleton"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <SavedItemsListSkeleton />
          </Animated.View>
        ) : (
          <Animated.View
            key="content"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <CategoriesList
              categories={categories}
              canEdit={canEditCategories}
              onEditCategory={present}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

export function CategoriesScreen({ onBack }: CategoriesScreenProps) {
  return (
    <CategorySheetProvider>
      <CategoriesContent onBack={onBack} />
    </CategorySheetProvider>
  );
}
