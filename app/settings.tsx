import { router } from 'expo-router';
import { View } from 'react-native';

import { SettingsMenu } from '@/features/settings/components/settings-menu';
import { type SettingsSubmenu } from '@/features/settings/components/settings-types';

export default function Settings() {
  const handleSelect = (view: SettingsSubmenu) => {
    switch (view) {
      case 'saved-items':
        router.push('/saved-items');
        break;
      case 'stores':
        router.push('/stores');
        break;
      case 'categories':
        router.push('/categories');
        break;
      case 'account':
        router.push('/account');
        break;
    }
  };

  const handleCreateAccount = () => {
    router.dismissTo('/(auth)/sign-in');
  };

  return (
    <View className="bg-background pt-6">
      <SettingsMenu
        onSelect={handleSelect}
        onCreateAccount={handleCreateAccount}
      />
    </View>
  );
}
