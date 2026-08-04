import { PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Heading } from '@/components/text/heading';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useCategories } from '@/features/categories/instant/use-categories';
import { SavedItemsListSkeleton } from '@/features/saved-items/components/saved-items-list-skeleton';
import { builtInCategoryOptions } from '@/features/shared/category/categories';
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
  const { data: categories, isLoading } = useCategories();
  const { present } = useCategorySheet();
  const { status } = useInstantAuthState();
  const canCreateCategories = status === 'signed-in';
  const isGuest = status === 'guest';
  const categoryCount = builtInCategoryOptions.length + categories.length;

  return (
    <View className="flex-1 bg-background pt-6">
      <View className="flex-row items-center gap-3 px-4">
        <BackButton onPress={onBack} href="/settings" />
        <Heading>My Categories</Heading>
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
            <CategoriesList categories={categories} onEditCategory={present} />
          </Animated.View>
        )}
      </View>

      {canCreateCategories ? (
        <View className="absolute bottom-6 right-6 z-20">
          <Button size="wide-small" onPress={() => present()}>
            <Icon
              as={PlusIcon}
              size={28}
              strokeWidth={3}
              className="text-primary-foreground"
            />
          </Button>
        </View>
      ) : null}
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
