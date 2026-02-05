import { router } from 'expo-router';
import { BookmarkIcon, ChevronRightIcon, StoreIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Heading } from '@/components/text/heading';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import Account from '../../features/settings/components/account';

export default function Settings() {
  const handleNavigateToSavedItems = () => {
    router.push('/saved-items');
  };

  const handleNavigateToStores = () => {
    router.push('/stores');
  };

  return (
    <View className="pt-safe pb-safe-offset-16 flex-1 bg-background">
      <View className="flex-1 justify-between gap-4 px-4 pt-6 ">
        {/* Settings Menu */}
        <View className="gap-4">
          <Heading>Settings</Heading>
          <View className="mb-8 gap-4 rounded-xl bg-muted/50 p-4">
            <HapticPressable
              onPress={handleNavigateToSavedItems}
              className="flex-row items-center justify-between border-b border-border pb-4 active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <Icon
                  as={BookmarkIcon}
                  size={20}
                  className="text-muted-foreground"
                />
                <Text className="font-medium">My Saved Items</Text>
              </View>
              <Icon
                as={ChevronRightIcon}
                size={20}
                className="text-muted-foreground"
              />
            </HapticPressable>
            <HapticPressable
              onPress={handleNavigateToStores}
              className="flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <Icon
                  as={StoreIcon}
                  size={20}
                  className="text-muted-foreground"
                />
                <Text className="font-medium">My Stores</Text>
              </View>
              <Icon
                as={ChevronRightIcon}
                size={20}
                className="text-muted-foreground"
              />
            </HapticPressable>
          </View>
        </View>
        <Account />
      </View>
    </View>
  );
}
