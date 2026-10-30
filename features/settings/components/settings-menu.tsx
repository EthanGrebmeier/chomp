import {
  BookmarkIcon,
  ChevronRightIcon,
  StoreIcon,
  TagIcon,
  UserRoundIcon,
} from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { SheetHeader } from '@/components/sheet-header';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { CloseButton } from '@/components/ui/close-button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

import { type SettingsSubmenu } from './settings-types';

type SettingsMenuProps = {
  onSelect: (view: SettingsSubmenu) => void;
  onCreateAccount: () => void;
  onClose: () => void;
};

export function SettingsMenu({
  onSelect,
  onCreateAccount,
  onClose,
}: SettingsMenuProps) {
  const { status, isReconciled, hasInstantEmailSession } =
    useInstantAuthState();

  return (
    <View className="justify-between gap-4">
      <View className="gap-4">
        <SheetHeader
          className="mb-0"
          title="Settings"
          backAction={<CloseButton onPress={onClose} />}
        />
        <View className="gap-4 px-8 pb-6">
          <HapticPressable
            onPress={() => onSelect('saved-items')}
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
            onPress={() => onSelect('stores')}
            className="flex-row items-center justify-between border-b border-border pb-4 active:opacity-70"
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
          <HapticPressable
            onPress={() => onSelect('categories')}
            className="flex-row items-center justify-between active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <Icon as={TagIcon} size={20} className="text-muted-foreground" />
              <Text className="font-medium">My Categories</Text>
            </View>
            <Icon
              as={ChevronRightIcon}
              size={20}
              className="text-muted-foreground"
            />
          </HapticPressable>
          {hasInstantEmailSession ? (
            <HapticPressable
              onPress={() => onSelect('account')}
              className="flex-row items-center justify-between border-t border-border pt-4 active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <Icon
                  as={UserRoundIcon}
                  size={20}
                  className="text-muted-foreground"
                />
                <Text className="font-medium">Account</Text>
              </View>
              <Icon
                as={ChevronRightIcon}
                size={20}
                className="text-muted-foreground"
              />
            </HapticPressable>
          ) : null}
        </View>
      </View>
      {!isReconciled ? (
        <View className="gap-4 px-8 pb-6">
          <ActivityIndicator />
        </View>
      ) : status === 'guest' ? (
        <View className="gap-4 px-8 pb-6">
          <View>
            <Text className="text-lg font-medium leading-5">Account</Text>
            <Text className="text-sm text-muted-foreground">
              Signed in as a guest
            </Text>
          </View>
          <BottomActionButton
            variant="secondary"
            onPress={onCreateAccount}
            className="w-full"
          >
            <Text>Create Account</Text>
          </BottomActionButton>
        </View>
      ) : null}
    </View>
  );
}
