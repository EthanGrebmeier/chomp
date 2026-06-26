import { View } from 'react-native';

import { Heading } from '@/components/text/heading';
import { BackButton } from '@/components/ui/back-button';
import { AccountScreen } from '@/features/account/components/account-screen';

export default function AccountPage() {
  return (
    <View className="flex-1 bg-background pt-6">
      <View className="flex-row items-center gap-3 px-4">
        <BackButton href="/settings" />
        <Heading>Account</Heading>
      </View>
      <AccountScreen />
    </View>
  );
}
